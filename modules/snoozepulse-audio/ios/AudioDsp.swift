import Foundation

/// Pure DSP helpers — RMS / peak / dB. No heap traffic in the hot path beyond the window.
enum AudioDsp {
  private static let fullScale = 32768.0

  static func rms(samples: [Int16], count: Int) -> Double {
    if count <= 0 { return 0 }
    var sumSquares = 0.0
    for i in 0..<count {
      let v = Double(samples[i])
      sumSquares += v * v
    }
    return sqrt(sumSquares / Double(count))
  }

  static func peak(samples: [Int16], count: Int) -> Int {
    var maxValue = 0
    for i in 0..<count {
      let a = abs(Int(samples[i]))
      if a > maxValue { maxValue = a }
    }
    return maxValue
  }

  /// Display-style dB (0–100), relative — used against the ambient baseline for snore detect.
  static func rmsToDb(_ rms: Double) -> Double {
    if rms < 1e-6 { return 0 }
    let db = 20.0 * log10(rms / fullScale) + 90.0
    return min(100.0, max(0.0, db))
  }
}
