import AVFoundation
import Foundation

/**
 * AVAudioEngine capture + DSP. Mirrors Android CaptureEngine contracts so JS stays identical.
 * PCM never leaves this type — only throttled level / snore / interruption payloads.
 *
 * Input taps use the hardware float format, resample to 16 kHz Int16, then write a
 * pre-sized ring (no per-frame allocation of the ring itself).
 *
 * Task 6.3 rewrites detection around `SnoreClassifier` (ADR-21). The dB threshold
 * (`snoreMarginDb`) is removed entirely per ADR-23. dB survives only as a display value
 * on `AudioLevelEvent` and as `SnoreEvent.peakDb` for legacy metric cards.
 */
final class CaptureEngine {
  static let sampleRate = 16_000
  private static let ringSeconds = 5
  private static let emitIntervalMs: Double = 150
  private static let calibrationMs: Double = 3_000

  // Task 6.3 hysteresis (ADR-21 / api-contracts.md).
  private static let snoreEnterConfidence: Float = 0.55
  private static let snoreExitConfidence: Float = 0.35
  private static let snoreMinMs: Int64 = 300
  private static let snoreEndHangMs: Int64 = 700

  private static let classLabelSnoring = "snoring"
  private static let classLabelSnort = "snort"

  private let classifier: SnoreClassifier?

  private let ring: PcmRingBuffer
  private var analysisWindow: [Int16]
  private var snippetScratch: [Int16]
  private var convertScratch: [Int16]
  private let waveform = WaveformWindow()
  private var patchScratch: [Int16]

  private let engine = AVAudioEngine()
  private var isRunning = false
  private var isPaused = false
  private var sessionId: String?
  private var ambientBaselineDb: Double = 32.0

  private var snoreActive = false
  private var snoreStartedAt: Int64 = 0
  private var snorePeakDb: Double = 0
  private var snorePeakConfidence: Float = 0
  private var snoreConfidenceSum: Float = 0
  private var snoreSnoringSum: Float = 0
  private var snoreSnortSum: Float = 0
  private var snoreClassifiedFrames: Int = 0
  private var snoreLastAboveAt: Int64 = 0
  private var snoreEpisodeId: String?

  private var emitTimer: Timer?
  private var interruptionObserver: NSObjectProtocol?

  var onLevel: (([String: Any]) -> Void)?
  var onSnore: (([String: Any]) -> Void)?
  var onInterruption: (([String: Any]) -> Void)?

  init(classifier: SnoreClassifier? = nil) {
    self.classifier = classifier
    let capacity = Self.sampleRate * Self.ringSeconds
    ring = PcmRingBuffer(capacity: capacity)
    analysisWindow = [Int16](repeating: 0, count: Self.sampleRate / 10)
    snippetScratch = [Int16](repeating: 0, count: capacity)
    convertScratch = [Int16](repeating: 0, count: 4096)
    patchScratch = [Int16](repeating: 0, count: WaveformWindow.defaultPatchSamples)
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

  private func configureSession() throws {
    let session = AVAudioSession.sharedInstance()
    try session.setCategory(.playAndRecord, mode: .measurement, options: [.mixWithOthers, .allowBluetooth])
    // Prefer 16 kHz to match Android AudioRecord; hardware may still deliver 44.1/48 kHz.
    try? session.setPreferredSampleRate(Double(Self.sampleRate))
    try session.setActive(true, options: .notifyOthersOnDeactivation)
  }

  /// Convert input tap PCM to mono Int16 at `sampleRate` (resample when hardware ≠ 16 kHz).
  private func floatBufferToInt16(_ buffer: AVAudioPCMBuffer) -> Int {
    guard let channel = buffer.floatChannelData?[0] else { return 0 }
    let inFrames = Int(buffer.frameLength)
    guard inFrames > 0 else { return 0 }

    let inRate = buffer.format.sampleRate
    let outRate = Double(Self.sampleRate)
    let outCount: Int
    if abs(inRate - outRate) < 1.0 {
      outCount = inFrames
      ensureConvertCapacity(outCount)
      for i in 0..<inFrames {
        let clamped = max(-1.0, min(1.0, Double(channel[i])))
        convertScratch[i] = Int16(clamped * 32767.0)
      }
      return outCount
    }

    // Linear resample hardware rate → 16 kHz (same target as Android CaptureEngine).
    outCount = max(1, Int((Double(inFrames) * outRate / inRate).rounded(.down)))
    ensureConvertCapacity(outCount)
    let step = inRate / outRate
    for i in 0..<outCount {
      let srcPos = Double(i) * step
      let idx = min(inFrames - 1, Int(srcPos))
      let frac = srcPos - Double(idx)
      let s0 = Double(channel[idx])
      let s1 = Double(channel[min(inFrames - 1, idx + 1)])
      let sample = s0 + (s1 - s0) * frac
      let clamped = max(-1.0, min(1.0, sample))
      convertScratch[i] = Int16(clamped * 32767.0)
    }
    return outCount
  }

  private func ensureConvertCapacity(_ count: Int) {
    if count > convertScratch.count {
      convertScratch = [Int16](repeating: 0, count: count)
    }
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
    let displayCount = ring.copyLatest(count: analysisWindow.count, into: &analysisWindow)
    guard displayCount > 0 else { return }
    let rms = AudioDsp.rms(samples: analysisWindow, count: displayCount)
    let peak = AudioDsp.peak(samples: analysisWindow, count: displayCount)
    let db = AudioDsp.rmsToDb(rms)
    let peakDb = AudioDsp.rmsToDb(Double(peak))

    let classification = classifyIfReady()
    let confidence = classification?.combined ?? 0
    let now = Int64(Date().timeIntervalSince1970 * 1000)

    // Detection is entirely classifier-driven now (ADR-23). Hysteresis state advances
    // regardless of dB; dB is kept only for display and for SnoreEvent.peakDb.
    updateSnoreState(now: now, peakDb: peakDb, classification: classification)

    onLevel?([
      "sessionId": id,
      "timestamp": Double(now),
      "decibel": db,
      "rms": rms / 32768.0,
      "snoreDetected": snoreActive,
      "confidence": Double(confidence),
      // Task 6.4 will replace this with the rolling 60 s median (ADR-25). Emit 0.0 for
      // now so downstream types are stable.
      "noiseFloorDb": 0.0,
    ])
  }

  /// Run YAMNet on the newest 15,600 ring samples if we have that many yet. Returns nil
  /// during the first ~1 s of a session (ring not full enough) or when the classifier is
  /// unavailable (warmup failed at module init).
  private func classifyIfReady() -> SnoreClassification? {
    guard let cls = classifier else { return nil }
    guard ring.length >= waveform.patchSamples else { return nil }
    let read = ring.copyLatest(count: waveform.patchSamples, into: &patchScratch)
    guard read == waveform.patchSamples else { return nil }
    let patch = waveform.fill(patchScratch)
    do {
      return try cls.classify(patch: patch)
    } catch {
      NSLog("Classifier failure on capture path: %@", String(describing: error))
      return nil
    }
  }

  private func updateSnoreState(now: Int64, peakDb: Double, classification: SnoreClassification?) {
    let confidence = classification?.combined ?? 0
    let above = confidence >= Self.snoreEnterConfidence
    let below = confidence < Self.snoreExitConfidence

    if above {
      snoreLastAboveAt = now
      if !snoreActive {
        snoreActive = true
        snoreStartedAt = now
        snorePeakDb = peakDb
        snorePeakConfidence = confidence
        snoreConfidenceSum = 0
        snoreSnoringSum = 0
        snoreSnortSum = 0
        snoreClassifiedFrames = 0
        snoreEpisodeId = UUID().uuidString
      } else {
        if peakDb > snorePeakDb { snorePeakDb = peakDb }
        if confidence > snorePeakConfidence { snorePeakConfidence = confidence }
      }
    }

    if snoreActive, let classification {
      snoreConfidenceSum += classification.combined
      snoreSnoringSum += classification.snoring
      snoreSnortSum += classification.snort
      snoreClassifiedFrames += 1
    }

    if snoreActive, below, now - snoreLastAboveAt >= Self.snoreEndHangMs {
      finalizeSnoreIfNeeded(now: now)
    }
  }

  private func finalizeSnoreIfNeeded(now: Int64) {
    guard snoreActive else { return }
    let duration = now - snoreStartedAt
    let id = sessionId
    let episodeId = snoreEpisodeId
    let frames = snoreClassifiedFrames
    let snoringTotal = snoreSnoringSum
    let snortTotal = snoreSnortSum
    let meanConfidence: Double = frames > 0
      ? Double(snoreConfidenceSum) / Double(frames)
      : 0
    let classLabel = snoringTotal >= snortTotal ? Self.classLabelSnoring : Self.classLabelSnort
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
      "confidence": meanConfidence,
      "classLabel": classLabel,
      // spectralPeakHz is emitted as null in Task 6.3; a future spectral-analysis stage
      // will populate it. Null is a legal value per docs/api-contracts.md.
      "spectralPeakHz": NSNull(),
      "audioPath": path as Any,
    ])
    resetSnoreState()
  }

  private func resetSnoreState() {
    snoreActive = false
    snoreStartedAt = 0
    snorePeakDb = 0
    snorePeakConfidence = 0
    snoreConfidenceSum = 0
    snoreSnoringSum = 0
    snoreSnortSum = 0
    snoreClassifiedFrames = 0
    snoreLastAboveAt = 0
    snoreEpisodeId = nil
  }
}
