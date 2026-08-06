package expo.modules.snoozepulseaudio

import kotlin.math.ln
import kotlin.math.sqrt

/**
 * Pure DSP helpers shared by calibration, metering, and snore detection.
 * No allocation inside hot paths that receive a reusable sample window.
 */
internal object AudioDsp {
  /** Full-scale short peak for 16-bit PCM. */
  private const val FULL_SCALE = 32768.0

  /**
   * RMS of [samples][0, count). Uses a running sum — no intermediate arrays.
   */
  fun rms(samples: ShortArray, count: Int): Double {
    if (count <= 0) {
      return 0.0
    }
    var sumSquares = 0.0
    for (i in 0 until count) {
      val v = samples[i].toDouble()
      sumSquares += v * v
    }
    return sqrt(sumSquares / count)
  }

  /** Absolute peak magnitude in the window. */
  fun peak(samples: ShortArray, count: Int): Int {
    var max = 0
    for (i in 0 until count) {
      val a = kotlin.math.abs(samples[i].toInt())
      if (a > max) {
        max = a
      }
    }
    return max
  }

  /**
   * Approximate dB SPL-style display level from RMS (0–~90).
   * Not a calibrated SPL meter — relative for snore detection vs ambient baseline.
   */
  fun rmsToDb(rms: Double): Double {
    if (rms < 1e-6) {
      return 0.0
    }
    // 20 * log10(rms / fullScale) + 90 → positive meter range used by the UI mocks.
    return (20.0 * (ln(rms / FULL_SCALE) / LN10) + 90.0).coerceIn(0.0, 100.0)
  }

  private val LN10 = ln(10.0)
}
