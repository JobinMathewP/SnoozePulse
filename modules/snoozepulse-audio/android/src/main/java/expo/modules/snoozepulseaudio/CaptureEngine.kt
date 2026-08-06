package expo.modules.snoozepulseaudio

import android.content.Context
import android.content.Intent
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.media.AudioManager
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.Process
import java.util.UUID
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.max

/**
 * Owns AudioRecord, the ring buffer, metering, snore detection, and snippet writes.
 * All PCM stays on this class — nothing is sent to JS except throttled metrics / events.
 */
internal class CaptureEngine(
  private val context: Context,
  private val emitLevel: (Map<String, Any?>) -> Unit,
  private val emitSnore: (Map<String, Any?>) -> Unit,
  private val emitInterruption: (Map<String, Any?>) -> Unit,
) {
  companion object {
    const val SAMPLE_RATE = 16_000
    private const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
    private const val ENCODING = AudioFormat.ENCODING_PCM_16BIT
    /** Keep 5 s of PCM for snippets (acceptance: 5-second snippets). */
    private const val RING_SECONDS = 5
    private const val EMIT_INTERVAL_MS = 150L
    private const val CALIBRATION_MS = 3_000L
    /** Episode starts when level exceeds ambient by this margin (dB). */
    private const val SNORE_MARGIN_DB = 12.0
    private const val SNORE_MIN_MS = 450L
    private const val SNORE_END_HANG_MS = 700L
  }

  private val ringCapacity = SAMPLE_RATE * RING_SECONDS
  private val ring = PcmRingBuffer(ringCapacity)
  // Pre-allocated read / analysis windows — never new'd on the capture loop.
  private val readBuffer: ShortArray
  private val analysisWindow = ShortArray(SAMPLE_RATE / 10) // 100 ms worth
  private val snippetScratch = ShortArray(ringCapacity)

  private var audioRecord: AudioRecord? = null
  private var captureThread: HandlerThread? = null
  private var captureHandler: Handler? = null
  private var emitHandler: Handler? = null

  private val running = AtomicBoolean(false)
  private val paused = AtomicBoolean(false)

  @Volatile private var sessionId: String? = null
  @Volatile private var ambientBaselineDb: Double = 32.0

  private var snoreActive = false
  private var snoreStartedAt = 0L
  private var snorePeakDb = 0.0
  private var snoreLastAboveAt = 0L
  private var snoreEpisodeId: String? = null

  private var audioFocusChangeListener: AudioManager.OnAudioFocusChangeListener? = null

  init {
    val minBuf =
      AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, ENCODING).coerceAtLeast(SAMPLE_RATE / 5)
    readBuffer = ShortArray(minBuf / 2) // shorts
  }

  fun isRunning(): Boolean = running.get()

  /**
   * Measure ambient floor for [CALIBRATION_MS]. Stops an orphaned capture first so a
   * force-killed session cannot block the next Start.
   */
  fun calibrate(): Map<String, Any> {
    if (running.get()) {
      stop()
    }
    val record = buildRecorder()
    if (record.state != AudioRecord.STATE_INITIALIZED) {
      record.release()
      throw IllegalStateException("Microphone is unavailable — close other apps using the mic and try again")
    }
    record.startRecording()
    val deadline = System.currentTimeMillis() + CALIBRATION_MS
    var sumDb = 0.0
    var samples = 0
    try {
      while (System.currentTimeMillis() < deadline) {
        val n = record.read(readBuffer, 0, readBuffer.size)
        if (n > 0) {
          val window = minOf(n, analysisWindow.size)
          System.arraycopy(readBuffer, 0, analysisWindow, 0, window)
          val rms = AudioDsp.rms(analysisWindow, window)
          sumDb += AudioDsp.rmsToDb(rms)
          samples += 1
        }
      }
    } finally {
      try {
        record.stop()
      } catch (_: Exception) {
      }
      record.release()
    }
    if (samples == 0) {
      throw IllegalStateException("No ambient samples captured — check microphone access and try again")
    }
    val baseline = sumDb / samples
    ambientBaselineDb = baseline
    val environment =
      when {
        baseline < 35.0 -> "quiet"
        baseline < 48.0 -> "moderate"
        else -> "noisy"
      }
    return mapOf(
      "baselineDb" to baseline,
      "sampledMs" to CALIBRATION_MS.toDouble(),
      "environment" to environment,
    )
  }

  fun start(sessionId: String, baselineDb: Double?) {
    if (!running.compareAndSet(false, true)) {
      throw IllegalStateException("Already recording")
    }
    this.sessionId = sessionId
    if (baselineDb != null) {
      ambientBaselineDb = baselineDb
    }
    paused.set(false)
    ring.clear()
    resetSnoreState()

    startForegroundService()
    requestAudioFocus()

    val record = buildRecorder()
    audioRecord = record
    record.startRecording()

    val thread = HandlerThread("SnoozePulseCapture", Process.THREAD_PRIORITY_AUDIO)
    thread.start()
    captureThread = thread
    captureHandler = Handler(thread.looper)
    emitHandler = Handler(context.mainLooper)

    captureHandler?.post(captureLoop)
    scheduleEmit()
  }

  fun stop() {
    if (!running.compareAndSet(true, false)) {
      return
    }
    finalizeSnoreIfNeeded(System.currentTimeMillis())
    captureHandler?.removeCallbacksAndMessages(null)
    emitHandler?.removeCallbacksAndMessages(null)
    try {
      audioRecord?.stop()
    } catch (_: Exception) {
    }
    audioRecord?.release()
    audioRecord = null
    captureThread?.quitSafely()
    captureThread = null
    captureHandler = null
    abandonAudioFocus()
    stopForegroundService()
    sessionId = null
  }

  fun pause() {
    if (!running.get() || !paused.compareAndSet(false, true)) {
      return
    }
    try {
      audioRecord?.stop()
    } catch (_: Exception) {
    }
    val id = sessionId ?: return
    emitInterruption(
      mapOf(
        "sessionId" to id,
        "timestamp" to System.currentTimeMillis().toDouble(),
        "reason" to "audioSessionSeized",
        "resumed" to false,
      ),
    )
  }

  fun resume() {
    if (!running.get() || !paused.compareAndSet(true, false)) {
      return
    }
    try {
      audioRecord?.startRecording()
    } catch (_: Exception) {
    }
    val id = sessionId ?: return
    emitInterruption(
      mapOf(
        "sessionId" to id,
        "timestamp" to System.currentTimeMillis().toDouble(),
        "reason" to "audioSessionSeized",
        "resumed" to true,
      ),
    )
  }

  private val captureLoop =
    object : Runnable {
      override fun run() {
        if (!running.get()) {
          return
        }
        val record = audioRecord
        if (record != null && !paused.get()) {
          val n = record.read(readBuffer, 0, readBuffer.size)
          if (n > 0) {
            ring.write(readBuffer, 0, n)
          }
        }
        captureHandler?.post(this)
      }
    }

  private fun scheduleEmit() {
    emitHandler?.post(
      object : Runnable {
        override fun run() {
          if (!running.get()) {
            return
          }
          if (!paused.get()) {
            emitMeterAndDetect()
          }
          emitHandler?.postDelayed(this, EMIT_INTERVAL_MS)
        }
      },
    )
  }

  private fun emitMeterAndDetect() {
    val id = sessionId ?: return
    val count = ring.copyLatest(analysisWindow.size, analysisWindow)
    if (count <= 0) {
      return
    }
    val rms = AudioDsp.rms(analysisWindow, count)
    val peak = AudioDsp.peak(analysisWindow, count)
    val db = AudioDsp.rmsToDb(rms)
    val peakDb = AudioDsp.rmsToDb(peak.toDouble())
    val snoreDetected = db >= ambientBaselineDb + SNORE_MARGIN_DB
    val now = System.currentTimeMillis()

    emitLevel(
      mapOf(
        "sessionId" to id,
        "timestamp" to now.toDouble(),
        "decibel" to db,
        "rms" to rms / 32768.0,
        "snoreDetected" to snoreDetected,
      ),
    )

    updateSnoreState(now, peakDb, snoreDetected)
  }

  private fun updateSnoreState(now: Long, peakDb: Double, above: Boolean) {
    if (above) {
      snoreLastAboveAt = now
      if (!snoreActive) {
        snoreActive = true
        snoreStartedAt = now
        snorePeakDb = peakDb
        snoreEpisodeId = UUID.randomUUID().toString()
      } else {
        snorePeakDb = max(snorePeakDb, peakDb)
      }
      return
    }
    if (snoreActive && now - snoreLastAboveAt >= SNORE_END_HANG_MS) {
      finalizeSnoreIfNeeded(now)
    }
  }

  private fun finalizeSnoreIfNeeded(now: Long) {
    if (!snoreActive) {
      return
    }
    val duration = now - snoreStartedAt
    val id = sessionId
    val episodeId = snoreEpisodeId
    snoreActive = false
    if (id == null || episodeId == null || duration < SNORE_MIN_MS) {
      resetSnoreState()
      return
    }
    val sampleCount = ring.copyLatest(ringCapacity, snippetScratch)
    val path =
      SnippetWriter.writeWav(
        context.filesDir,
        id,
        snoreStartedAt,
        SAMPLE_RATE,
        snippetScratch,
        sampleCount,
      )
    emitSnore(
      mapOf(
        "id" to episodeId,
        "sessionId" to id,
        "timestamp" to snoreStartedAt.toDouble(),
        "durationMs" to duration.toDouble(),
        "peakDb" to snorePeakDb,
        "audioPath" to path,
      ),
    )
    resetSnoreState()
  }

  private fun resetSnoreState() {
    snoreActive = false
    snoreStartedAt = 0L
    snorePeakDb = 0.0
    snoreLastAboveAt = 0L
    snoreEpisodeId = null
  }

  private fun buildRecorder(): AudioRecord {
    val minBuf = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, ENCODING)
    val bufferSize = max(minBuf, readBuffer.size * 2)
    return AudioRecord(
      MediaRecorder.AudioSource.MIC,
      SAMPLE_RATE,
      CHANNEL_CONFIG,
      ENCODING,
      bufferSize,
    )
  }

  private fun startForegroundService() {
    val intent = Intent(context, MicrophoneForegroundService::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      context.startForegroundService(intent)
    } else {
      context.startService(intent)
    }
  }

  private fun stopForegroundService() {
    context.stopService(Intent(context, MicrophoneForegroundService::class.java))
  }

  private fun requestAudioFocus() {
    val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    val listener =
      AudioManager.OnAudioFocusChangeListener { change ->
        when (change) {
          AudioManager.AUDIOFOCUS_LOSS,
          AudioManager.AUDIOFOCUS_LOSS_TRANSIENT,
          AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK,
          -> {
            if (running.get() && !paused.get()) {
              pause()
            }
          }
          AudioManager.AUDIOFOCUS_GAIN -> {
            if (running.get() && paused.get()) {
              resume()
            }
          }
        }
      }
    audioFocusChangeListener = listener
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      // Legacy request keeps API simple across OEM versions for V1.
      @Suppress("DEPRECATION")
      am.requestAudioFocus(listener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
    } else {
      @Suppress("DEPRECATION")
      am.requestAudioFocus(listener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
    }
  }

  private fun abandonAudioFocus() {
    val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    val listener = audioFocusChangeListener ?: return
    @Suppress("DEPRECATION")
    am.abandonAudioFocus(listener)
    audioFocusChangeListener = null
  }
}
