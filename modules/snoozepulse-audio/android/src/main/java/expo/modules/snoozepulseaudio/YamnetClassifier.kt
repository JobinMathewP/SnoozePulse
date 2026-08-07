package expo.modules.snoozepulseaudio

import android.content.Context
import android.util.Log
import java.io.FileInputStream
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.nnapi.NnApiDelegate

/**
 * YAMNet on-device inference (ADR-21).
 *
 * The public YAMNet TFLite classification model bundled at
 * `android/src/main/assets/yamnet.tflite` (ADR-28) takes a 15,600-sample float32 waveform
 * at 16 kHz mono and emits three outputs; only `scores` is consumed here. The AudioSet
 * ontology places `Snoring` at index 38 and `Snort` at index 41.
 *
 * Task 6.1 keeps this class off the capture path. `CaptureEngine` still runs the M5
 * loudness detector until ADR-23's deletion lands in Task 6.3.
 */
internal class YamnetClassifier(private val context: Context) : SnoreClassifier {
  companion object {
    private const val TAG = "YamnetClassifier"
    private const val MODEL_ASSET = "yamnet.tflite"
    /** 0.975 s of 16 kHz mono PCM — YAMNet's fixed input length. */
    const val INPUT_SAMPLES = 15_600
    private const val NUM_CLASSES = 521
    private const val CLASS_SNORING = 38
    private const val CLASS_SNORT = 41
    private const val DELEGATE_NNAPI = "NNAPI"
    private const val DELEGATE_CPU = "CPU"
    private const val WARM_SILENCE_LEVEL = 0f
  }

  private var interpreter: Interpreter? = null
  private var nnApiDelegate: NnApiDelegate? = null
  private var resolvedDelegate: String = DELEGATE_CPU
  private var scoresOutputIndex: Int = 0
  private var scoresFrames: Int = 1
  private var inputWantsBatchDim: Boolean = false
  // Reused across calls — capture path is single-threaded (`CaptureEngine.captureLoop`).
  private var outputBuffers: MutableMap<Int, Any> = mutableMapOf()
  private var batchedInputScratch: Array<FloatArray>? = null

  override fun load() {
    if (interpreter != null) {
      return
    }
    val model = loadModelFile()
    interpreter =
      try {
        val delegate = NnApiDelegate()
        val options = Interpreter.Options().setNumThreads(2).addDelegate(delegate)
        val ip = Interpreter(model, options)
        nnApiDelegate = delegate
        resolvedDelegate = DELEGATE_NNAPI
        ip
      } catch (error: Exception) {
        Log.w(TAG, "NNAPI delegate unavailable, falling back to CPU: ${error.message}")
        nnApiDelegate?.close()
        nnApiDelegate = null
        val ip = Interpreter(model, Interpreter.Options().setNumThreads(2))
        resolvedDelegate = DELEGATE_CPU
        ip
      }
    resolveTensorShapes()
    allocateOutputBuffers()
  }

  override fun warm(): String {
    load()
    // Silence input so the first inference never fires the snore path even if the caller
    // is already forwarding results anywhere.
    val silence = FloatArray(INPUT_SAMPLES) { WARM_SILENCE_LEVEL }
    classify(silence)
    Log.i(TAG, "YAMNet warmed on delegate: $resolvedDelegate")
    return resolvedDelegate
  }

  override fun classify(patch: FloatArray): Float {
    val ip = interpreter ?: throw IllegalStateException("YamnetClassifier not loaded")
    require(patch.size == INPUT_SAMPLES) {
      "YAMNet expects $INPUT_SAMPLES samples, received ${patch.size}"
    }
    val inputTensor: Any =
      if (inputWantsBatchDim) {
        val scratch = batchedInputScratch ?: Array(1) { FloatArray(INPUT_SAMPLES) }
        batchedInputScratch = scratch
        System.arraycopy(patch, 0, scratch[0], 0, INPUT_SAMPLES)
        scratch
      } else {
        patch
      }
    ip.runForMultipleInputsOutputs(arrayOf(inputTensor), outputBuffers)
    @Suppress("UNCHECKED_CAST")
    val scores = outputBuffers[scoresOutputIndex] as Array<FloatArray>
    var snoreSum = 0f
    var snortSum = 0f
    for (frame in scores) {
      snoreSum += frame[CLASS_SNORING]
      snortSum += frame[CLASS_SNORT]
    }
    val frames = scores.size.coerceAtLeast(1).toFloat()
    val combined = (snoreSum + snortSum) / frames
    return combined.coerceIn(0f, 1f)
  }

  override fun close() {
    interpreter?.close()
    interpreter = null
    nnApiDelegate?.close()
    nnApiDelegate = null
    outputBuffers.clear()
    batchedInputScratch = null
  }

  private fun resolveTensorShapes() {
    val ip = interpreter ?: return
    val inputShape = ip.getInputTensor(0).shape()
    inputWantsBatchDim =
      when {
        inputShape.size == 1 && inputShape[0] == INPUT_SAMPLES -> false
        inputShape.size == 2 && inputShape[1] == INPUT_SAMPLES -> true
        else -> {
          Log.w(TAG, "Unexpected YAMNet input shape: ${inputShape.joinToString()}")
          inputShape.size == 2
        }
      }
    for (i in 0 until ip.outputTensorCount) {
      val shape = ip.getOutputTensor(i).shape()
      if (shape.size == 2 && shape[1] == NUM_CLASSES) {
        scoresOutputIndex = i
        scoresFrames = shape[0].coerceAtLeast(1)
        return
      }
    }
    Log.w(TAG, "Could not locate a [N, $NUM_CLASSES] output; defaulting to index 0.")
  }

  private fun allocateOutputBuffers() {
    val ip = interpreter ?: return
    outputBuffers.clear()
    for (i in 0 until ip.outputTensorCount) {
      val shape = ip.getOutputTensor(i).shape()
      outputBuffers[i] = allocateFloatBufferForShape(shape)
    }
  }

  private fun allocateFloatBufferForShape(shape: IntArray): Any =
    when (shape.size) {
      1 -> FloatArray(shape[0].coerceAtLeast(1))
      2 -> Array(shape[0].coerceAtLeast(1)) { FloatArray(shape[1].coerceAtLeast(1)) }
      3 -> Array(shape[0].coerceAtLeast(1)) {
        Array(shape[1].coerceAtLeast(1)) { FloatArray(shape[2].coerceAtLeast(1)) }
      }
      else -> {
        // YAMNet only produces 1D–3D outputs; keep a defensive fallback anyway.
        Log.w(TAG, "Unexpected output rank ${shape.size}, allocating flat float array.")
        FloatArray(shape.fold(1) { acc, dim -> acc * dim.coerceAtLeast(1) })
      }
    }

  private fun loadModelFile(): MappedByteBuffer {
    val fd = context.assets.openFd(MODEL_ASSET)
    FileInputStream(fd.fileDescriptor).use { stream ->
      return stream.channel.map(
        FileChannel.MapMode.READ_ONLY,
        fd.startOffset,
        fd.declaredLength,
      )
    }
  }
}
