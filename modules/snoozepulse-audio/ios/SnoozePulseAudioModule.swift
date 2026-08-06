import ExpoModulesCore
import Foundation

/**
 * Task 5.1 scaffold — lifecycle + heartbeat events only. No AVAudioEngine / DSP yet (Task 5.2).
 *
 * Emits `onAudioLevel` every ~150 ms while "recording" so the JS bridge can be exercised
 * before real capture. Never sends PCM across the bridge.
 */
public class SnoozePulseAudioModule: Module {
  private var sessionId: String?
  private var isRecording = false
  private var isPaused = false
  private var tick: Int64 = 0
  private var heartbeatTimer: Timer?

  public func definition() -> ModuleDefinition {
    Name("SnoozePulseAudio")

    Events("onAudioLevel", "onSnore", "onInterruption")

    Constant("HEARTBEAT_INTERVAL_MS") {
      Self.heartbeatIntervalMs
    }

    AsyncFunction("startRecording") { (id: String, promise: Promise) in
      if self.isRecording {
        promise.reject("AUDIO_BUSY", "Already recording")
        return
      }
      self.sessionId = id
      self.isRecording = true
      self.isPaused = false
      self.tick = 0
      self.startHeartbeat()
      promise.resolve(nil)
    }

    AsyncFunction("stopRecording") { (promise: Promise) in
      self.stopHeartbeat()
      self.isRecording = false
      self.isPaused = false
      self.sessionId = nil
      promise.resolve(nil)
    }

    AsyncFunction("pauseRecording") { (promise: Promise) in
      if !self.isRecording {
        promise.reject("AUDIO_ENGINE", "Not recording")
        return
      }
      self.isPaused = true
      if let id = self.sessionId {
        self.sendEvent("onInterruption", [
          "sessionId": id,
          "timestamp": Date().timeIntervalSince1970 * 1000,
          "reason": "audioSessionSeized",
          "resumed": false,
        ])
      }
      promise.resolve(nil)
    }

    AsyncFunction("resumeRecording") { (promise: Promise) in
      if !self.isRecording || !self.isPaused {
        promise.reject("AUDIO_ENGINE", "Not paused")
        return
      }
      self.isPaused = false
      if let id = self.sessionId {
        self.sendEvent("onInterruption", [
          "sessionId": id,
          "timestamp": Date().timeIntervalSince1970 * 1000,
          "reason": "audioSessionSeized",
          "resumed": true,
        ])
      }
      promise.resolve(nil)
    }

    /// Stub calibration — quiet baseline until Task 5.2 measures the room.
    AsyncFunction("calibrate") { (promise: Promise) in
      promise.resolve([
        "baselineDb": 32.0,
        "sampledMs": 3000.0,
        "environment": "quiet",
      ])
    }
  }

  private func startHeartbeat() {
    stopHeartbeat()
    // Timers must be scheduled on the main run loop for Expo module event delivery.
    DispatchQueue.main.async {
      self.heartbeatTimer = Timer.scheduledTimer(
        withTimeInterval: Self.heartbeatIntervalMs / 1000.0,
        repeats: true
      ) { [weak self] _ in
        guard let self, self.isRecording else { return }
        guard !self.isPaused, let id = self.sessionId else { return }
        let wave = sin(Double(self.tick) / 8.0) * 8.0
        let decibel = 38.0 + wave
        self.sendEvent("onAudioLevel", [
          "sessionId": id,
          "timestamp": Date().timeIntervalSince1970 * 1000,
          "decibel": decibel,
          "rms": 0.02,
          "snoreDetected": false,
        ])
        self.tick += 1
      }
    }
  }

  private func stopHeartbeat() {
    heartbeatTimer?.invalidate()
    heartbeatTimer = nil
  }

  private static let heartbeatIntervalMs: Double = 150
}
