import Foundation
import TensorFlowLite

/**
 * YAMNet on-device inference (ADR-21).
 *
 * The public YAMNet TFLite classification model bundled at
 * `ios/Resources/yamnet.tflite` (ADR-28) takes a 15,600-sample float32 waveform at 16 kHz
 * mono and emits three outputs; only `scores` is consumed here. The AudioSet ontology
 * places `Snoring` at index 38 and `Snort` at index 41.
 *
 * Task 6.1 keeps this class off the capture path. `CaptureEngine` still runs the M5
 * loudness detector until ADR-23's deletion lands in Task 6.3.
 */
final class YamnetClassifier: SnoreClassifier {
  static let inputSamples = 15_600
  private static let numClasses = 521
  private static let classSnoring = 38
  private static let classSnort = 41
  private static let modelResource = "yamnet"
  private static let modelExtension = "tflite"
  private static let delegateCoreML = "CoreML"
  private static let delegateCPU = "CPU"

  enum ClassifierError: Error {
    case modelNotFound
    case notLoaded
    case inputSizeMismatch(expected: Int, actual: Int)
  }

  private var interpreter: Interpreter?
  private var scoresOutputIndex: Int = 0
  private var scoresFrames: Int = 1
  private var resolvedDelegate: String = YamnetClassifier.delegateCPU

  func load() throws {
    if interpreter != nil { return }
    guard
      let modelPath = Bundle.main.path(
        forResource: Self.modelResource,
        ofType: Self.modelExtension
      )
    else {
      throw ClassifierError.modelNotFound
    }
    let options = Interpreter.Options()
    options.threadCount = 2

    // Prefer Core ML on capable hardware; fall through to CPU on any failure.
    var delegates: [Delegate] = []
    if let coreML = CoreMLDelegate() {
      delegates.append(coreML)
      resolvedDelegate = Self.delegateCoreML
    } else {
      resolvedDelegate = Self.delegateCPU
    }

    do {
      let ip = try Interpreter(
        modelPath: modelPath,
        options: options,
        delegates: delegates.isEmpty ? nil : delegates
      )
      try ip.allocateTensors()
      interpreter = ip
    } catch {
      // Retry without the delegate. The Core ML build sometimes fails on older devices
      // even when the delegate instance itself constructed successfully.
      let ip = try Interpreter(modelPath: modelPath, options: options)
      try ip.allocateTensors()
      interpreter = ip
      resolvedDelegate = Self.delegateCPU
    }

    resolveTensorShapes()
  }

  @discardableResult
  func warm() throws -> String {
    try load()
    let silence = [Float](repeating: 0, count: Self.inputSamples)
    _ = try classify(patch: silence)
    NSLog("YAMNet warmed on delegate: %@", resolvedDelegate)
    return resolvedDelegate
  }

  func classify(patch: [Float]) throws -> SnoreClassification {
    guard let ip = interpreter else { throw ClassifierError.notLoaded }
    guard patch.count == Self.inputSamples else {
      throw ClassifierError.inputSizeMismatch(
        expected: Self.inputSamples,
        actual: patch.count
      )
    }
    let inputData = patch.withUnsafeBufferPointer { pointer -> Data in
      Data(buffer: pointer)
    }
    try ip.copy(inputData, toInputAt: 0)
    try ip.invoke()

    let output = try ip.output(at: scoresOutputIndex)
    let floatCount = output.data.count / MemoryLayout<Float>.size
    let scores = output.data.withUnsafeBytes { raw -> [Float] in
      let buffer = raw.bindMemory(to: Float.self)
      return Array(UnsafeBufferPointer(start: buffer.baseAddress, count: floatCount))
    }

    let framesInOutput = max(1, scoresFrames)
    var snoreSum: Float = 0
    var snortSum: Float = 0
    for frame in 0..<framesInOutput {
      let base = frame * Self.numClasses
      snoreSum += scores[base + Self.classSnoring]
      snortSum += scores[base + Self.classSnort]
    }
    let framesF = Float(framesInOutput)
    let snoring = min(1.0, max(0.0, snoreSum / framesF))
    let snort = min(1.0, max(0.0, snortSum / framesF))
    let combined = min(1.0, max(0.0, snoring + snort))
    return SnoreClassification(combined: combined, snoring: snoring, snort: snort)
  }

  func close() {
    interpreter = nil
  }

  private func resolveTensorShapes() {
    guard let ip = interpreter else { return }
    let outputCount = ip.outputTensorCount
    for i in 0..<outputCount {
      guard let tensor = try? ip.output(at: i) else { continue }
      let dims = tensor.shape.dimensions
      if dims.count == 2, dims[1] == Self.numClasses {
        scoresOutputIndex = i
        scoresFrames = max(1, dims[0])
        return
      }
    }
    NSLog(
      "YAMNet: could not locate a [N, %d] output tensor; defaulting to index 0.",
      Self.numClasses
    )
    scoresOutputIndex = 0
    scoresFrames = 1
  }
}
