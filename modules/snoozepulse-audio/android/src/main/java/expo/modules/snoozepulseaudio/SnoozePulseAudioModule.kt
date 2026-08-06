package expo.modules.snoozepulseaudio

import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.math.sin

/**
 * Task 5.1 scaffold — lifecycle + heartbeat events only. No AudioRecord / DSP yet (Task 5.2).
 *
 * Emits `onAudioLevel` every ~150 ms while "recording" so the JS bridge and waveform path
 * can be wired before real capture lands. Never sends PCM across the bridge.
 */
class SnoozePulseAudioModule : Module() {
  private var sessionId: String? = null
  private var isRecording = false
  private var isPaused = false
  private var tick: Long = 0
  private val mainHandler = Handler(Looper.getMainLooper())
  private var heartbeatRunnable: Runnable? = null

  override fun definition() = ModuleDefinition {
    Name("SnoozePulseAudio")

    Events("onAudioLevel", "onSnore", "onInterruption")

    Constant("HEARTBEAT_INTERVAL_MS") {
      HEARTBEAT_INTERVAL_MS
    }

    AsyncFunction("startRecording") { id: String, promise: Promise ->
      if (isRecording) {
        promise.reject("AUDIO_BUSY", "Already recording", null)
        return@AsyncFunction
      }
      sessionId = id
      isRecording = true
      isPaused = false
      tick = 0
      startHeartbeat()
      promise.resolve(null)
    }

    AsyncFunction("stopRecording") { promise: Promise ->
      stopHeartbeat()
      isRecording = false
      isPaused = false
      sessionId = null
      promise.resolve(null)
    }

    AsyncFunction("pauseRecording") { promise: Promise ->
      if (!isRecording) {
        promise.reject("AUDIO_ENGINE", "Not recording", null)
        return@AsyncFunction
      }
      isPaused = true
      val id = sessionId
      if (id != null) {
        sendEvent(
          "onInterruption",
          mapOf(
            "sessionId" to id,
            "timestamp" to System.currentTimeMillis().toDouble(),
            "reason" to "audioSessionSeized",
            "resumed" to false,
          ),
        )
      }
      promise.resolve(null)
    }

    AsyncFunction("resumeRecording") { promise: Promise ->
      if (!isRecording || !isPaused) {
        promise.reject("AUDIO_ENGINE", "Not paused", null)
        return@AsyncFunction
      }
      isPaused = false
      val id = sessionId
      if (id != null) {
        sendEvent(
          "onInterruption",
          mapOf(
            "sessionId" to id,
            "timestamp" to System.currentTimeMillis().toDouble(),
            "reason" to "audioSessionSeized",
            "resumed" to true,
          ),
        )
      }
      promise.resolve(null)
    }

    /**
     * Stub calibration — returns a quiet baseline until Task 5.2 measures the room.
     * Kept async so the JS contract stays stable when real sampling lands.
     */
    AsyncFunction("calibrate") { promise: Promise ->
      promise.resolve(
        mapOf(
          "baselineDb" to 32.0,
          "sampledMs" to 3_000.0,
          "environment" to "quiet",
        ),
      )
    }
  }

  private fun startHeartbeat() {
    stopHeartbeat()
    val runnable = object : Runnable {
      override fun run() {
        if (!isRecording) {
          return
        }
        if (!isPaused) {
          val id = sessionId ?: return
          // Synthetic level: gentle sine so the Active Session waveform / store path move.
          val wave = sin(tick / 8.0) * 8.0
          val decibel = 38.0 + wave
          sendEvent(
            "onAudioLevel",
            mapOf(
              "sessionId" to id,
              "timestamp" to System.currentTimeMillis().toDouble(),
              "decibel" to decibel,
              "rms" to 0.02,
              "snoreDetected" to false,
            ),
          )
          tick += 1
        }
        mainHandler.postDelayed(this, HEARTBEAT_INTERVAL_MS)
      }
    }
    heartbeatRunnable = runnable
    mainHandler.post(runnable)
  }

  private fun stopHeartbeat() {
    heartbeatRunnable?.let { mainHandler.removeCallbacks(it) }
    heartbeatRunnable = null
  }

  companion object {
    private const val HEARTBEAT_INTERVAL_MS = 150L
  }
}
