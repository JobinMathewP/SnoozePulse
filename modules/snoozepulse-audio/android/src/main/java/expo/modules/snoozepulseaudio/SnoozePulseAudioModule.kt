package expo.modules.snoozepulseaudio

import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Expo bridge for the native capture engine (Task 5.2).
 * JS receives only throttled levels / snore / interruption events — never PCM.
 */
class SnoozePulseAudioModule : Module() {
  private var engine: CaptureEngine? = null
  /** Last calibration baseline, applied on the next [startRecording]. */
  private var lastBaselineDb: Double? = null

  private fun ensureEngine(): CaptureEngine {
    engine?.let { return it }
    val ctx =
      appContext.reactContext
        ?: throw IllegalStateException("React context not ready")
    val created =
      CaptureEngine(
        context = ctx,
        emitLevel = { payload -> sendEvent("onAudioLevel", payload) },
        emitSnore = { payload -> sendEvent("onSnore", payload) },
        emitInterruption = { payload -> sendEvent("onInterruption", payload) },
      )
    engine = created
    return created
  }

  override fun definition() = ModuleDefinition {
    Name("SnoozePulseAudio")

    Events("onAudioLevel", "onSnore", "onInterruption")

    Constant("HEARTBEAT_INTERVAL_MS") {
      150
    }

    OnDestroy {
      engine?.stop()
      engine = null
    }

    AsyncFunction("startRecording") { id: String, promise: Promise ->
      try {
        ensureEngine().start(id, lastBaselineDb)
        promise.resolve(null)
      } catch (error: IllegalStateException) {
        promise.reject("AUDIO_BUSY", error.message, error)
      } catch (error: SecurityException) {
        promise.reject("PERMISSION_DENIED", error.message, error)
      } catch (error: Exception) {
        promise.reject("AUDIO_ENGINE", error.message, error)
      }
    }

    AsyncFunction("stopRecording") { promise: Promise ->
      engine?.stop()
      promise.resolve(null)
    }

    AsyncFunction("pauseRecording") { promise: Promise ->
      val capture = engine
      if (capture == null || !capture.isRunning()) {
        promise.reject("AUDIO_ENGINE", "Not recording", null)
        return@AsyncFunction
      }
      capture.pause()
      promise.resolve(null)
    }

    AsyncFunction("resumeRecording") { promise: Promise ->
      val capture = engine
      if (capture == null || !capture.isRunning()) {
        promise.reject("AUDIO_ENGINE", "Not paused", null)
        return@AsyncFunction
      }
      capture.resume()
      promise.resolve(null)
    }

    AsyncFunction("calibrate") { promise: Promise ->
      try {
        val result = ensureEngine().calibrate()
        lastBaselineDb = result["baselineDb"] as? Double
        promise.resolve(result)
      } catch (error: Exception) {
        promise.reject("CALIBRATION", error.message, error)
      }
    }
  }
}
