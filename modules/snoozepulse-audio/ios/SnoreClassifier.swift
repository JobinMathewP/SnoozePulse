import Foundation

/**
 * Native-side abstraction over the on-device snore classifier (ADR-21, ADR-22).
 *
 * The runtime lives inside this module. JavaScript never sees tensors, log-mel patches,
 * or raw PCM (`docs/native-audio.md` Rules).
 *
 * Task 6.1 supplies exactly one implementation: `YamnetClassifier`, which loads a bundled
 * YAMNet TFLite model and returns the summed `P(Snoring) + P(Snort)` probability.
 * `CaptureEngine` is deliberately left untouched in this task; the wiring lands in Task 6.3.
 */
protocol SnoreClassifier: AnyObject {
  /// Load the model into memory and pick the best available hardware delegate.
  func load() throws

  /// Run one dummy inference so lazy delegate initialisation happens off the capture path.
  /// Returns the resolved delegate label (e.g. `"CoreML"`, `"CPU"`) for logging.
  @discardableResult
  func warm() throws -> String

  /// Classify one 0.975 s input (15,600 float32 samples of 16 kHz mono PCM in [-1, 1]).
  /// Returns `P(Snoring) + P(Snort)`, clamped to `[0, 1]`.
  ///
  /// The parameter label `patch` matches the interface documented in
  /// `docs/implementation-plan.md` Task 6.1 acceptance criteria.
  func classify(patch: [Float]) throws -> Float

  /// Release native resources. Safe to call multiple times.
  func close()
}
