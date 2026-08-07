import AVFoundation
import Foundation

/**
 * AVAudioEngine capture + DSP. Mirrors Android CaptureEngine contracts so JS stays identical.
 * PCM never leaves this type — only throttled level / snore / interruption payloads.
 *
 * Input taps use the hardware float format and convert into a pre-sized Int16 scratch
 * buffer (no per-frame allocation of the ring itself).
 */
final class CaptureEngine {
  static let sampleRate = 16_000
  private static let ringSeconds = 5
  private static let emitIntervalMs: Double = 150
  private static let calibrationMs: Double = 3_000
  private static let snoreMarginDb = 12.0
  private static let snoreMinMs: Int64 = 450
  private static let snoreEndHangMs: Int64 = 700

  private let ring: PcmRingBuffer
  private var analysisWindow: [Int16]
  private var snippetScratch: [Int16]
  private var convertScratch: [Int16]

  private let engine = AVAudioEngine()
  private var isRunning = false
  private var isPaused = false
  private var sessionId: String?
  private var ambientBaselineDb: Double = 32.0

  private var snoreActive = false
  private var snoreStartedAt: Int64 = 0
  private var snorePeakDb: Double = 0
  private var snoreLastAboveAt: Int64 = 0
  private var snoreEpisodeId: String?

  private var emitTimer: Timer?
  private var interruptionObserver: NSObjectProtocol?

  var onLevel: (([String: Any]) -> Void)?
  var onSnore: (([String: Any]) -> Void)?
  var onInterruption: (([String: Any]) -> Void)?

  init() {
    let capacity = Self.sampleRate * Self.ringSeconds
    ring = PcmRingBuffer(capacity: capacity)
    analysisWindow = [Int16](repeating: 0, count: Self.sampleRate / 10)
    snippetScratch = [Int16](repeating: 0, count: capacity)
    convertScratch = [Int16](repeating: 0, count: 4096)
  }

  func running() -> Bool { isRunning }

  func calibrate() throws -> [String: Any] {
    if isRunning {
      throw NSError(domain: "SnoozePulseAudio", code: 1, userInfo: [
        NSLocalizedDescriptionKey: "Cannot calibrate while recording",
      ])
    }
    try configureSession()
    let input = engine.inputNode
    let format = input.inputFormat(forBus: 0)
    var sumDb = 0.0
    var samples = 0
    let lock = NSLock()
    input.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
      guard let self else { return }
      let count = self.floatBufferToInt16(buffer)
      guard count > 0 else { return }
      let rms = AudioDsp.rms(samples: self.convertScratch, count: count)
      let db = AudioDsp.rmsToDb(rms)
      lock.lock()
      sumDb += db
      samples += 1
      lock.unlock()
    }
    engine.prepare()
    try engine.start()
    Thread.sleep(forTimeInterval: Self.calibrationMs / 1000.0)
    input.removeTap(onBus: 0)
    engine.stop()
    let baseline = samples > 0 ? sumDb / Double(samples) : 32.0
    ambientBaselineDb = baseline
    let environment: String
    if baseline < 35 { environment = "quiet" }
    else if baseline < 48 { environment = "moderate" }
    else { environment = "noisy" }
    return [
      "baselineDb": baseline,
      "sampledMs": Self.calibrationMs,
      "environment": environment,
    ]
  }

  func start(sessionId: String, baselineDb: Double?) throws {
    if isRunning {
      throw NSError(domain: "SnoozePulseAudio", code: 2, userInfo: [
        NSLocalizedDescriptionKey: "Already recording",
      ])
    }
    self.sessionId = sessionId
    if let baselineDb { ambientBaselineDb = baselineDb }
    isPaused = false
    ring.clear()
    resetSnoreState()
    try configureSession()
    observeInterruptions()

    let input = engine.inputNode
    let format = input.inputFormat(forBus: 0)
    input.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
      guard let self, self.isRunning, !self.isPaused else { return }
      let count = self.floatBufferToInt16(buffer)
      guard count > 0 else { return }
      self.convertScratch.withUnsafeBufferPointer { ptr in
        guard let base = ptr.baseAddress else { return }
        self.ring.write(base, count: count)
      }
    }
    engine.prepare()
    try engine.start()
    isRunning = true
    startEmitTimer()
  }

  func stop() {
    guard isRunning else { return }
    finalizeSnoreIfNeeded(now: Int64(Date().timeIntervalSince1970 * 1000))
    isRunning = false
    emitTimer?.invalidate()
    emitTimer = nil
    engine.inputNode.removeTap(onBus: 0)
    engine.stop()
    if let observer = interruptionObserver {
      NotificationCenter.default.removeObserver(observer)
      interruptionObserver = nil
    }
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    sessionId = nil
  }

  func pause() {
    guard isRunning, !isPaused else { return }
    isPaused = true
    engine.pause()
    guard let id = sessionId else { return }
    onInterruption?([
      "sessionId": id,
      "timestamp": Date().timeIntervalSince1970 * 1000,
      "reason": "audioSessionSeized",
      "resumed": false,
    ])
  }

  func resume() {
    guard isRunning, isPaused else { return }
    do {
      try engine.start()
      isPaused = false
      guard let id = sessionId else { return }
      onInterruption?([
        "sessionId": id,
        "timestamp": Date().timeIntervalSince1970 * 1000,
        "reason": "audioSessionSeized",
        "resumed": true,
      ])
    } catch {
      // Leave paused.
    }
  }

  /// Convert float PCM from the input tap into [convertScratch]; returns sample count.
  private func floatBufferToInt16(_ buffer: AVAudioPCMBuffer) -> Int {
    guard let channel = buffer.floatChannelData?[0] else { return 0 }
    let frameCount = Int(buffer.frameLength)
    if frameCount > convertScratch.count {
      // Rare hardware burst — grow once (still not per steady-state frame).
      convertScratch = [Int16](repeating: 0, count: frameCount)
    }
    for i in 0..<frameCount {
      let clamped = max(-1.0, min(1.0, Double(channel[i])))
      convertScratch[i] = Int16(clamped * 32767.0)
    }
    return frameCount
  }

  private func configureSession() throws {
    let session = AVAudioSession.sharedInstance()
    try session.setCategory(.playAndRecord, mode: .measurement, options: [.mixWithOthers, .allowBluetooth])
    try session.setActive(true, options: .notifyOthersOnDeactivation)
  }

  private func observeInterruptions() {
    interruptionObserver = NotificationCenter.default.addObserver(
      forName: AVAudioSession.interruptionNotification,
      object: AVAudioSession.sharedInstance(),
      queue: .main
    ) { [weak self] notification in
      guard let self else { return }
      guard
        let info = notification.userInfo,
        let typeValue = info[AVAudioSessionInterruptionTypeKey] as? UInt,
        let type = AVAudioSession.InterruptionType(rawValue: typeValue)
      else { return }
      switch type {
      case .began:
        self.pause()
      case .ended:
        if let optionsValue = info[AVAudioSessionInterruptionOptionKey] as? UInt {
          let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
          if options.contains(.shouldResume) {
            self.resume()
          }
        }
      @unknown default:
        break
      }
    }
  }

  private func startEmitTimer() {
    DispatchQueue.main.async {
      self.emitTimer = Timer.scheduledTimer(withTimeInterval: Self.emitIntervalMs / 1000.0, repeats: true) { [weak self] _ in
        self?.emitMeterAndDetect()
      }
    }
  }

  private func emitMeterAndDetect() {
    guard isRunning, !isPaused, let id = sessionId else { return }
    let count = ring.copyLatest(count: analysisWindow.count, into: &analysisWindow)
    guard count > 0 else { return }
    let rms = AudioDsp.rms(samples: analysisWindow, count: count)
    let peak = AudioDsp.peak(samples: analysisWindow, count: count)
    let db = AudioDsp.rmsToDb(rms)
    let peakDb = AudioDsp.rmsToDb(Double(peak))
    let snoreDetected = db >= ambientBaselineDb + Self.snoreMarginDb
    let now = Int64(Date().timeIntervalSince1970 * 1000)

    onLevel?([
      "sessionId": id,
      "timestamp": Double(now),
      "decibel": db,
      "rms": rms / 32768.0,
      "snoreDetected": snoreDetected,
    ])
    updateSnoreState(now: now, peakDb: peakDb, above: snoreDetected)
  }

  private func updateSnoreState(now: Int64, peakDb: Double, above: Bool) {
    if above {
      snoreLastAboveAt = now
      if !snoreActive {
        snoreActive = true
        snoreStartedAt = now
        snorePeakDb = peakDb
        snoreEpisodeId = UUID().uuidString
      } else {
        snorePeakDb = max(snorePeakDb, peakDb)
      }
      return
    }
    if snoreActive && now - snoreLastAboveAt >= Self.snoreEndHangMs {
      finalizeSnoreIfNeeded(now: now)
    }
  }

  private func finalizeSnoreIfNeeded(now: Int64) {
    guard snoreActive else { return }
    let duration = now - snoreStartedAt
    let id = sessionId
    let episodeId = snoreEpisodeId
    snoreActive = false
    guard let id, let episodeId, duration >= Self.snoreMinMs else {
      resetSnoreState()
      return
    }
    let sampleCount = ring.copyLatest(count: snippetScratch.count, into: &snippetScratch)
    let path = SnippetWriter.writeWav(
      sessionId: id,
      timestampMs: snoreStartedAt,
      sampleRate: Self.sampleRate,
      samples: snippetScratch,
      sampleCount: sampleCount
    )
    onSnore?([
      "id": episodeId,
      "sessionId": id,
      "timestamp": Double(snoreStartedAt),
      "durationMs": Double(duration),
      "peakDb": snorePeakDb,
      "audioPath": path as Any,
    ])
    resetSnoreState()
  }

  private func resetSnoreState() {
    snoreActive = false
    snoreStartedAt = 0
    snorePeakDb = 0
    snoreLastAboveAt = 0
    snoreEpisodeId = nil
  }
}
