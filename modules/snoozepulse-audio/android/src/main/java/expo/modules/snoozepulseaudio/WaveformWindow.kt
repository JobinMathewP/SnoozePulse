package expo.modules.snoozepulseaudio

/**
 * Prepares YAMNet's input tensor: [1, 15600] Float32 in [-1.0, 1.0].
 *
 * The shipped classifier variant (`lite-model/yamnet/classification/tflite/1`) has the
 * log-mel front-end baked into its graph (ADR-21), so this class only needs to:
 *
 *   1. Take 15,600 Int16 PCM samples at 16 kHz (mono).
 *   2. Normalise them via `sample / 32768.0f`.
 *   3. Return the same pre-allocated FloatArray every call — zero heap after warmup.
 *
 * Wired into the capture pipeline by Task 6.3. Task 6.2 only supplies the class and the
 * byte-parity harness.
 */
internal class WaveformWindow(
  val patchSamples: Int = DEFAULT_PATCH_SAMPLES,
  val hopSamples: Int = DEFAULT_HOP_SAMPLES,
) {
  companion object {
    /** 0.975 s @ 16 kHz — YAMNet's input length. */
    const val DEFAULT_PATCH_SAMPLES = 15_600

    /** 50 % overlap between consecutive patches. */
    const val DEFAULT_HOP_SAMPLES = 7_800

    /** Divide-by-32768 matches YAMNet's training normalisation (Int16 full-scale). */
    private const val INT16_FULL_SCALE = 32_768.0f
  }

  init {
    require(patchSamples > 0) { "patchSamples must be positive" }
    require(hopSamples > 0) { "hopSamples must be positive" }
  }

  private val patch = FloatArray(patchSamples)

  /**
   * Fill the reusable Float32 patch from [samples] (must supply exactly [patchSamples]
   * entries; [count] guards against short reads from the ring buffer). Returns the same
   * instance every call.
   */
  fun fill(samples: ShortArray, count: Int): FloatArray {
    require(count == patchSamples) {
      "WaveformWindow.fill expects $patchSamples samples but got $count"
    }
    require(samples.size >= count) {
      "WaveformWindow.fill: source buffer smaller than count ($count > ${samples.size})"
    }
    for (i in 0 until patchSamples) {
      patch[i] = samples[i].toFloat() / INT16_FULL_SCALE
    }
    return patch
  }

  /**
   * Slide over [mono16k] and invoke [onPatch] once per full window. The FloatArray passed
   * to the callback is the shared internal patch — copy it if you need to retain the data.
   * Trailing partial windows are discarded.
   */
  fun slidingWindows(
    mono16k: ShortArray,
    totalCount: Int,
    onPatch: (FloatArray) -> Unit,
  ) {
    require(totalCount >= 0) { "totalCount must be non-negative" }
    require(mono16k.size >= totalCount) { "mono16k shorter than totalCount" }
    if (totalCount < patchSamples) {
      return
    }
    var start = 0
    while (start + patchSamples <= totalCount) {
      for (i in 0 until patchSamples) {
        patch[i] = mono16k[start + i].toFloat() / INT16_FULL_SCALE
      }
      onPatch(patch)
      start += hopSamples
    }
  }
}
