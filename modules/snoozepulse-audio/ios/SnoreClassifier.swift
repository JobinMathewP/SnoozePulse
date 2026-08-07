import Foundation

/**
 * Native-side abstraction over the on-device snore classifier (ADR-21, ADR-22).
 *
 * The runtime lives inside this module. JavaScript never sees tensors, log-mel patches,
 * or raw PCM (`docs/native-audio.md` Rules).
 *
 * Task 6.1 supplies exactly one implementation: `YamnetClassifier`. Task 6.3 widened the
 * `classify()` return type so the episode builder can label each episode as `snoring` or
 * `snort` based on which class dominated (`docs/api-contracts.md` — `SnoreEvent.classLabel`).
 */
protocol SnoreClassifier: AnyObject {
  /// Load the model into memory and pick the best available hardware delegate.
  func load() throws

  /// Run one dummy inference so lazy delegate initialisation happens off the capture path.
  /// Returns the resolved delegate label (e.g. `"CoreML"`, `"CPU"`) for logging.
  @discardableResult
  func warm() throws -> String

  /// Classify one 0.975 s input (15,600 float32 samples of 16 kHz mono PCM in [-1, 1]).
  /// Returns a `SnoreClassification`, all fields clamped to `[0, 1]`.
  ///
  /// The parameter label `patch` matches the interface documented in
  /// `docs/implementation-plan.md` Task 6.1 acceptance criteria.
  func classify(patch: [Float]) throws -> SnoreClassification

  /// Release native resources. Safe to call multiple times.
  func close()
}

/// Per-class snore probabilities for a single 0.975 s window.
///
/// `combined` = `snoring + snort`, clamped to `[0, 1]`. It is what the episode builder
/// hysteresis compares against. `snoring` and `snort` are surfaced individually so the
/// builder can attach a `classLabel` when it finalises an episode.
struct SnoreClassification {
  let combined: Float
  let snoring: Float
  let snort: Float
}
