import Foundation

/// Prepares YAMNet's input tensor: `[1, 15600]` Float32 in `[-1.0, 1.0]`.
///
/// The shipped classifier variant (`lite-model/yamnet/classification/tflite/1`) has the
/// log-mel front-end baked into its graph (ADR-21), so this class only needs to:
///
///   1. Take 15,600 Int16 PCM samples at 16 kHz (mono).
///   2. Normalise them via `Float(sample) / 32768.0`.
///   3. Return the same pre-allocated `[Float]` every call — zero heap after warmup.
///
/// Wired into the capture pipeline by Task 6.3. Task 6.2 only supplies the class and the
/// byte-parity harness.
final class WaveformWindow {
  /// 0.975 s @ 16 kHz — YAMNet's input length.
  static let defaultPatchSamples = 15_600

  /// 50 % overlap between consecutive patches.
  static let defaultHopSamples = 7_800

  /// Divide-by-32768 matches YAMNet's training normalisation (Int16 full-scale).
  private static let int16FullScale: Float = 32_768.0

  let patchSamples: Int
  let hopSamples: Int

  private var patch: [Float]

  init(patchSamples: Int = WaveformWindow.defaultPatchSamples,
       hopSamples: Int = WaveformWindow.defaultHopSamples) {
    precondition(patchSamples > 0, "patchSamples must be positive")
    precondition(hopSamples > 0, "hopSamples must be positive")
    self.patchSamples = patchSamples
    self.hopSamples = hopSamples
    self.patch = [Float](repeating: 0, count: patchSamples)
  }

  /// Fill the reusable Float32 patch from `samples` (must supply exactly `patchSamples`
  /// entries). Returns the internal buffer by reference — copy it if you need to retain
  /// the data past the next call.
  func fill(_ samples: UnsafePointer<Int16>, count: Int) -> [Float] {
    precondition(count == patchSamples,
                 "WaveformWindow.fill expects \(patchSamples) samples but got \(count)")
    patch.withUnsafeMutableBufferPointer { buf in
      guard let base = buf.baseAddress else { return }
      for i in 0..<patchSamples {
        base[i] = Float(samples[i]) / WaveformWindow.int16FullScale
      }
    }
    return patch
  }

  /// Convenience overload for tests / callers that hold PCM in a Swift `[Int16]`.
  func fill(_ samples: [Int16]) -> [Float] {
    precondition(samples.count == patchSamples,
                 "WaveformWindow.fill expects \(patchSamples) samples but got \(samples.count)")
    return samples.withUnsafeBufferPointer { buf -> [Float] in
      guard let base = buf.baseAddress else { return patch }
      return fill(base, count: buf.count)
    }
  }

  /// Slide over `mono16k` and invoke `onPatch` once per full window with a shared internal
  /// patch buffer. Trailing partial windows are discarded.
  func slidingWindows(_ mono16k: [Int16], totalCount: Int, onPatch: ([Float]) -> Void) {
    precondition(totalCount >= 0, "totalCount must be non-negative")
    precondition(mono16k.count >= totalCount, "mono16k shorter than totalCount")
    guard totalCount >= patchSamples else { return }
    mono16k.withUnsafeBufferPointer { buf in
      guard let base = buf.baseAddress else { return }
      var start = 0
      while start + patchSamples <= totalCount {
        let filled = fill(base.advanced(by: start), count: patchSamples)
        onPatch(filled)
        start += hopSamples
      }
    }
  }
}
