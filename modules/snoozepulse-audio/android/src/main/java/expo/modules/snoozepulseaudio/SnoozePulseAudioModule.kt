package expo.modules.snoozepulseaudio

import android.util.Log
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Expo bridge for the native capture engine (Task 5.2).
 * JS receives only throttled levels / snore / interruption events — never PCM.
 *
 * Task 6.3 hands the warmed [SnoreClassifier] to [CaptureEngine] so the capture path
 * drives detection through YAMNet (ADR-21, ADR-23). When warmup fails, the engine is
 * still constructed with a null classifier; the pipeline degrades to "no episodes emitted"
 * rather than crashing capture.
 */
class SnoozePulseAudioModule : Module() {
  companion object {
    private const val TAG = "SnoozePulseAudioModule"
  }

  private var engine: CaptureEngine? = null
  private var classifier: SnoreClassifier? = null
  /** Last calibration baseline, applied on the next [startRecording]. */
  private var lastBaselineDb: Double? = null

  private fun ensureEngine(): CaptureEngine {
    engine?.let { return it }
    val ctx =
      appContext.reactContext
        ?: throw IllegalStateException("React context not ready")
    warmClassifierIfNeeded(ctx)
    val created =
      CaptureEngine(
        context = ctx,
        classifier = classifier,
        emitLevel = { payload -> sendEvent("onAudioLevel", payload) },
        emitSnore = { payload -> sendEvent("onSnore", payload) },
        emitInterruption = { payload -> sendEvent("onInterruption", payload) },
      )
    engine = created
    return created
  }

  private fun warmClassifierIfNeeded(ctx: android.content.Context) {
    if (classifier != null) return
    val created = YamnetClassifier(ctx)
    try {
      val delegate = created.warm()
      Log.i(TAG, "SnoreClassifier ready (delegate=$delegate)")
      classifier = created
    } catch (error: Exception) {
      Log.e(TAG, "SnoreClassifier warmup failed; running without ML detector", error)
      created.close()
    }
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
      classifier?.close()
      classifier = null
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
