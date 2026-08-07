import ExpoModulesCore
import Foundation

/**
 * Expo bridge for iOS capture (Task 5.2). Same event names / method surface as Android.
 * Swift is written for later macOS compile/verify — not runtime-validated on Windows (ADR-17).
 *
 * Task 6.3 hands the warmed `SnoreClassifier` to `CaptureEngine` so the capture path
 * drives detection through YAMNet (ADR-21, ADR-23). When warmup fails, the engine is
 * still constructed with a nil classifier; the pipeline degrades to "no episodes emitted"
 * rather than crashing capture.
 */
public class SnoozePulseAudioModule: Module {
  private var engine: CaptureEngine?
  private var classifier: SnoreClassifier?
  private var lastBaselineDb: Double?

  private func ensureEngine() -> CaptureEngine {
    if let engine { return engine }
    warmClassifierIfNeeded()
    let capture = CaptureEngine(classifier: classifier)
    capture.onLevel = { [weak self] payload in
      self?.sendEvent("onAudioLevel", payload)
    }
    capture.onSnore = { [weak self] payload in
      self?.sendEvent("onSnore", payload)
    }
    capture.onInterruption = { [weak self] payload in
      self?.sendEvent("onInterruption", payload)
    }
    engine = capture
    return capture
  }

  private func warmClassifierIfNeeded() {
    if classifier != nil { return }
    let created = YamnetClassifier()
    do {
      let delegate = try created.warm()
      NSLog("SnoreClassifier ready (delegate=%@)", delegate)
      classifier = created
    } catch {
      NSLog("SnoreClassifier warmup failed; running without ML detector: %@",
            String(describing: error))
      created.close()
    }
  }

  public func definition() -> ModuleDefinition {
    Name("SnoozePulseAudio")

    Events("onAudioLevel", "onSnore", "onInterruption")

    Constant("HEARTBEAT_INTERVAL_MS") {
      150
    }

    OnDestroy {
      self.engine?.stop()
      self.engine = nil
      self.classifier?.close()
      self.classifier = nil
    }

    AsyncFunction("startRecording") { (id: String, promise: Promise) in
      do {
        try self.ensureEngine().start(sessionId: id, baselineDb: self.lastBaselineDb)
        promise.resolve(nil)
      } catch {
        promise.reject("AUDIO_BUSY", error.localizedDescription)
      }
    }

    AsyncFunction("stopRecording") { (promise: Promise) in
      self.engine?.stop()
      promise.resolve(nil)
    }

    AsyncFunction("pauseRecording") { (promise: Promise) in
      guard let capture = self.engine, capture.running() else {
        promise.reject("AUDIO_ENGINE", "Not recording")
        return
      }
      capture.pause()
      promise.resolve(nil)
    }

    AsyncFunction("resumeRecording") { (promise: Promise) in
      guard let capture = self.engine, capture.running() else {
        promise.reject("AUDIO_ENGINE", "Not paused")
        return
      }
      capture.resume()
      promise.resolve(nil)
    }

    AsyncFunction("calibrate") { (promise: Promise) in
      do {
        let result = try self.ensureEngine().calibrate()
        self.lastBaselineDb = result["baselineDb"] as? Double
        promise.resolve(result)
      } catch {
        promise.reject("CALIBRATION", error.localizedDescription)
      }
    }
  }
}
