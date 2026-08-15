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
 *
 * Task 6.4 (ADR-25) additionally:
 * - Retains `.measurement` mode (AGC disabled) and logs the session category / mode on
 *   start so we have parity with the Android capture-source log.
 * - Maintains a rolling 60 s median of display dB and publishes it as
 *   `AudioLevelEvent.noiseFloorDb`.
 * - Turns `calibrate()` into an immediate query over that rolling median (no 3 s wait).
 */
final class CaptureEngine {
  static let sampleRate = 16_000
  private static let ringSeconds = 5
  private static let emitIntervalMs: Double = 150

  // Task 6.3 hysteresis (ADR-21 / api-contracts.md).
  private static let snoreEnterConfidence: Float = 0.55
  private static let snoreExitConfidence: Float = 0.35
  private static let snoreMinMs: Int64 = 300
  private static let snoreEndHangMs: Int64 = 700

  private static let classLabelSnoring = "snoring"
  private static let classLabelSnort = "snort"

  // Task 6.4 noise-floor window (ADR-25). 60 s / emitIntervalMs ≈ 400 samples.
  private static let noiseFloorWindowMs: Double = 60_000
  private static let noiseFloorCapacity: Int = max(1, Int(noiseFloorWindowMs / emitIntervalMs))

  // Environment thresholds preserved from the M5 UX — see docs/api-contracts.md.
  private static let quietUpperDb: Double = 35
  private static let moderateUpperDb: Double = 48

  // Silence gate (Task battery-hardening §4). Skip YAMNet when the room is quiet.
  // Configurable in-place: change the constant, recompile, rerun the regression corpus.
  private static let silenceGateMarginDb: Double = 6.0
  private static let silenceGateMinIntervalMs: Int64 = 2_000

  // Debug telemetry cadence.
  private static let filterLogIntervalMs: Int64 = 60_000

  private let classifier: SnoreClassifier?

  private let ring: PcmRingBuffer
  private var analysisWindow: [Int16]
  private var snippetScratch: [Int16]
  private var convertScratch: [Int16]
  private let waveform = WaveformWindow()
  private var patchScratch: [Int16]
  private let noiseFloor = NoiseFloor(capacity: CaptureEngine.noiseFloorCapacity)

  private let engine = AVAudioEngine()
  private var isRunning = false
  private var isPaused = false
  private var sessionId: String?

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

  // Silence-gate + quality-filter state. Reset in `resetSnoreState`.
  private var lastInferenceMonotonicMs: Int64 = 0
  private var totalWindows: Int = 0
  private var skippedByGate: Int = 0
  private var totalInferences: Int = 0
  private var lastFilterLogMs: Int64 = 0

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

  /// Return the current rolling-median noise floor without blocking (ADR-25). The M5
  /// three-second sampling loop is gone; the noise floor is now maintained continuously
  /// during capture. On cold start (no capture has ever run) the floor is 0 and the
  /// environment is reported as "quiet" — the Home affordance stays as cosmetic feedback
  /// while the first minute of the rolling window fills.
  func calibrate() throws -> [String: Any] {
    let baseline = noiseFloor.current()
    return [
      "baselineDb": baseline,
      "sampledMs": 0.0,
      "environment": classifyEnvironment(baseline),
    ]
  }

  private func classifyEnvironment(_ baseline: Double) -> String {
    if baseline < Self.quietUpperDb { return "quiet" }
    if baseline < Self.moderateUpperDb { return "moderate" }
    return "noisy"
  }

  /// - Parameter baselineDb: Ignored under ADR-23/-25. The parameter is retained so the
  ///   Expo module callsite stays stable; the noise floor is now maintained by the rolling
  ///   median instead.
  func start(sessionId: String, baselineDb: Double?) throws {
    if isRunning {
      throw NSError(domain: "SnoozePulseAudio", code: 2, userInfo: [
        NSLocalizedDescriptionKey: "Already recording",
      ])
    }
    self.sessionId = sessionId
    isPaused = false
    ring.clear()
    noiseFloor.reset()
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
    let session = AVAudioSession.sharedInstance()
    NSLog(
      "CaptureEngine capture source granted: mode=%@ category=%@",
      session.mode.rawValue,
      session.category.rawValue
    )
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
    try session.setCategory(
      .playAndRecord,
      mode: .measurement,
      options: [.mixWithOthers, .allowBluetooth, .allowBluetoothA2DP, .defaultToSpeaker]
    )
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

    // Update the rolling 60 s noise-floor median before emitting so this tick's value
    // reflects the sample we just captured (ADR-25).
    noiseFloor.push(db)
    let noiseFloorDb = noiseFloor.current()

    let now = Int64(Date().timeIntervalSince1970 * 1000)
    totalWindows += 1
    let classification = classifyIfReady(nowMs: now, db: db, noiseFloorDb: noiseFloorDb)
    let confidence = classification?.combined ?? 0

    // Detection is entirely classifier-driven now (ADR-23). Hysteresis state advances
    // regardless of dB; dB is kept only for display and for SnoreEvent.peakDb.
    updateSnoreState(now: now, peakDb: peakDb, classification: classification)

    maybeLogFilterStats(now: now)

    onLevel?([
      "sessionId": id,
      "timestamp": Double(now),
      "decibel": db,
      "rms": rms / 32768.0,
      "snoreDetected": snoreActive,
      "confidence": Double(confidence),
      "noiseFloorDb": noiseFloorDb,
    ])
  }

  /// Run YAMNet on the newest 15,600 ring samples if we have that many yet.
  ///
  /// Silence gate (Task battery-hardening §4): once the rolling noise-floor window has warmed
  /// up, skip inference entirely when the current dB is below `noiseFloor + margin`, unless
  /// `silenceGateMinIntervalMs` has elapsed since the last inference (keep-alive so we never
  /// miss the leading edge of a soft snore that begins below floor + margin).
  ///
  /// Returns nil during the first ~1 s of a session (ring not full enough), when the
  /// classifier is unavailable (warmup failed at module init), or when the silence gate
  /// suppresses this window.
  private func classifyIfReady(nowMs: Int64, db: Double, noiseFloorDb: Double) -> SnoreClassification? {
    guard let cls = classifier else { return nil }
    guard ring.length >= waveform.patchSamples else { return nil }

    // Silence gate: only engage after the noise-floor rolling window is warm. On cold start
    // `noiseFloorDb == 0` — do not compare a real dB against 0 or every window would run.
    let noiseFloorWarm = noiseFloorDb > 0
    if noiseFloorWarm {
      let elevated = db >= noiseFloorDb + Self.silenceGateMarginDb
      let keepAlive = nowMs - lastInferenceMonotonicMs >= Self.silenceGateMinIntervalMs
      if !elevated && !keepAlive {
        skippedByGate += 1
        return nil
      }
    }

    let read = ring.copyLatest(count: waveform.patchSamples, into: &patchScratch)
    guard read == waveform.patchSamples else { return nil }
    let patch = waveform.fill(patchScratch)
    do {
      let classification = try cls.classify(patch: patch)
      lastInferenceMonotonicMs = nowMs
      totalInferences += 1
      return classification
    } catch {
      NSLog("Classifier failure on capture path: %@", String(describing: error))
      return nil
    }
  }

  private func maybeLogFilterStats(now: Int64) {
    if lastFilterLogMs == 0 {
      lastFilterLogMs = now
      return
    }
    if now - lastFilterLogMs < Self.filterLogIntervalMs { return }
    NSLog(
      "SnoozePulse gate: windows=%d skipped=%d inferences=%d",
      totalWindows,
      skippedByGate,
      totalInferences
    )
    lastFilterLogMs = now
    totalWindows = 0
    skippedByGate = 0
    totalInferences = 0
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
    lastInferenceMonotonicMs = 0
    totalWindows = 0
    skippedByGate = 0
    totalInferences = 0
    lastFilterLogMs = 0
  }

  /// Rolling median of display dB over the last `capacity` emit ticks (ADR-25). Fixed
  /// pre-allocated storage, no allocations after construction. The median-per-query is an
  /// `O(n log n)` sort on ≈ 400 doubles — well under one millisecond and only runs on the
  /// emit timer, once per ~150 ms.
  private final class NoiseFloor {
    private let capacity: Int
    private var ring: [Double]
    private var scratch: [Double]
    private var writeIndex = 0
    private var filled = 0
    private let lock = NSLock()

    init(capacity: Int) {
      self.capacity = capacity
      ring = [Double](repeating: 0, count: capacity)
      scratch = [Double](repeating: 0, count: capacity)
    }

    func push(_ db: Double) {
      lock.lock()
      defer { lock.unlock() }
      ring[writeIndex] = db
      writeIndex = (writeIndex + 1) % capacity
      if filled < capacity { filled += 1 }
    }

    func current() -> Double {
      lock.lock()
      defer { lock.unlock() }
      guard filled > 0 else { return 0 }
      for i in 0..<filled { scratch[i] = ring[i] }
      // Sort only the filled prefix; the tail is stale storage we don't consult.
      scratch[0..<filled].sort()
      return scratch[filled / 2]
    }

    func reset() {
      lock.lock()
      defer { lock.unlock() }
      writeIndex = 0
      filled = 0
    }
  }
}
