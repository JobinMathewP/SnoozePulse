import Foundation

/// Writes 16-bit mono PCM WAV under Documents/snippets (never Caches).
enum SnippetWriter {
  static func snippetsDirectory() throws -> URL {
    let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
    let dir = docs.appendingPathComponent("snippets", isDirectory: true)
    if !FileManager.default.fileExists(atPath: dir.path) {
      try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    }
    return dir
  }

  /// Returns absolute file path on success, nil on failure (caller still emits SnoreEvent).
  static func writeWav(
    sessionId: String,
    timestampMs: Int64,
    sampleRate: Int,
    samples: [Int16],
    sampleCount: Int
  ) -> String? {
    guard sampleCount > 0 else { return nil }
    do {
      let dir = try snippetsDirectory()
      let file = dir.appendingPathComponent("\(sessionId)_\(timestampMs).wav")
      var data = Data()
      let dataSize = sampleCount * 2
      data.append(contentsOf: makeHeader(sampleRate: sampleRate, dataSize: dataSize))
      for i in 0..<sampleCount {
        var little = samples[i].littleEndian
        withUnsafeBytes(of: &little) { data.append(contentsOf: $0) }
      }
      try data.write(to: file, options: .atomic)
      return file.path
    } catch {
      return nil
    }
  }

  private static func makeHeader(sampleRate: Int, dataSize: Int) -> [UInt8] {
    var header = [UInt8](repeating: 0, count: 44)
    let channels: UInt16 = 1
    let bitsPerSample: UInt16 = 16
    let byteRate = UInt32(sampleRate) * UInt32(channels) * UInt32(bitsPerSample / 8)
    let blockAlign = channels * bitsPerSample / 8

    func putString(_ s: String, at offset: Int) {
      for (i, b) in s.utf8.enumerated() { header[offset + i] = b }
    }
    func putUInt32(_ v: UInt32, at offset: Int) {
      var le = v.littleEndian
      withUnsafeBytes(of: &le) { buf in
        for i in 0..<4 { header[offset + i] = buf[i] }
      }
    }
    func putUInt16(_ v: UInt16, at offset: Int) {
      var le = v.littleEndian
      withUnsafeBytes(of: &le) { buf in
        for i in 0..<2 { header[offset + i] = buf[i] }
      }
    }

    putString("RIFF", at: 0)
    putUInt32(UInt32(36 + dataSize), at: 4)
    putString("WAVE", at: 8)
    putString("fmt ", at: 12)
    putUInt32(16, at: 16)
    putUInt16(1, at: 20)
    putUInt16(channels, at: 22)
    putUInt32(UInt32(sampleRate), at: 24)
    putUInt32(byteRate, at: 28)
    putUInt16(blockAlign, at: 32)
    putUInt16(bitsPerSample, at: 34)
    putString("data", at: 36)
    putUInt32(UInt32(dataSize), at: 40)
    return header
  }
}
