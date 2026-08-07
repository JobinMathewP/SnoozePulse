import XCTest
@testable import SnoozePulseAudio

/// Byte-parity test for WaveformWindow against the Python oracle in
/// `__fixtures__/waveform/generate_fixtures.py` (Task 6.2).
///
/// Execution is deferred to a Mac host (Windows dev machines skip iOS unit tests). The
/// bundled fixtures at `../__fixtures__/audio/reference_tone.wav` and
/// `../__fixtures__/waveform/reference_tone_windows.bin` are shared with the Android
/// JUnit suite so both platforms assert against the same bytes.
final class WaveformWindowTests: XCTestCase {

  func testMatchesPythonOracleWithinFloatTolerance() throws {
    let mono = try readWavAsInt16("reference_tone")
    XCTAssertEqual(mono.count, 48_000, "Reference tone must be 3.000 s @ 16 kHz")

    let expected = try readFloat32LEResource("reference_tone_windows", ext: "bin")
    let window = WaveformWindow()
    XCTAssertEqual(expected.count % window.patchSamples, 0,
                   "Oracle should contain a whole number of patches")

    var actual = [Float]()
    actual.reserveCapacity(expected.count)
    window.slidingWindows(mono, totalCount: mono.count) { patch in
      actual.append(contentsOf: patch)
    }
    XCTAssertEqual(actual.count, expected.count)

    var maxAbs: Double = 0
    var sumAbs: Double = 0
    for i in 0..<expected.count {
      let diff = abs(Double(expected[i]) - Double(actual[i]))
      if diff > maxAbs { maxAbs = diff }
      sumAbs += diff
    }
    let mae = sumAbs / Double(expected.count)
    XCTAssertLessThanOrEqual(mae, 1e-6, "MAE=\(mae) maxAbs=\(maxAbs) exceeds 1e-6")
    XCTAssertLessThanOrEqual(maxAbs, 1e-6, "MAE=\(mae) maxAbs=\(maxAbs) exceeds 1e-6")
  }

  func testFillReturnsMatchingBufferSizeEveryCall() {
    let window = WaveformWindow()
    let zeros = [Int16](repeating: 0, count: window.patchSamples)
    let first = window.fill(zeros)
    let second = window.fill(zeros)
    XCTAssertEqual(first.count, window.patchSamples)
    XCTAssertEqual(second.count, window.patchSamples)
    XCTAssertEqual(first, second)
  }

  func testFillNormalisesInt16FullScaleToPlusMinusOne() {
    let window = WaveformWindow()
    var samples = [Int16](repeating: 0, count: window.patchSamples)
    samples[0] = Int16.max
    samples[1] = Int16.min
    samples[2] = 0
    let patch = window.fill(samples)
    XCTAssertEqual(patch[0], Float(32767) / 32768.0)
    XCTAssertEqual(patch[1], -1.0)
    XCTAssertEqual(patch[2], 0.0)
  }

  func testSlidingWindowsSkipsTrailingPartial() {
    let window = WaveformWindow()
    let len = window.patchSamples + window.hopSamples - 1
    let mono = [Int16](repeating: 0, count: len)
    var invocations = 0
    window.slidingWindows(mono, totalCount: len) { _ in invocations += 1 }
    XCTAssertEqual(invocations, 1)
  }

  func testSlidingWindowsEmitsExpectedCountOnReferenceLength() {
    let window = WaveformWindow()
    let len = 48_000
    let mono = [Int16](repeating: 0, count: len)
    var invocations = 0
    window.slidingWindows(mono, totalCount: len) { _ in invocations += 1 }
    XCTAssertEqual(invocations, 5)
  }

  private func readFloat32LEResource(_ name: String, ext: String) throws -> [Float] {
    let url = try fixtureURL(name: name, ext: ext, subdir: "waveform")
    let bytes = try Data(contentsOf: url)
    XCTAssertEqual(bytes.count % 4, 0, "Fixture must be a whole number of float32s")
    return bytes.withUnsafeBytes { raw -> [Float] in
      let ptr = raw.bindMemory(to: Float32.self)
      return Array(ptr)
    }
  }

  private func readWavAsInt16(_ name: String) throws -> [Int16] {
    let url = try fixtureURL(name: name, ext: "wav", subdir: "audio")
    let bytes = try Data(contentsOf: url)
    return try parseInt16PCM(from: bytes)
  }

  private func fixtureURL(name: String, ext: String, subdir: String) throws -> URL {
    if let bundled = Bundle(for: type(of: self)).url(forResource: name, withExtension: ext) {
      return bundled
    }
    // Fallback: walk up from this source file to locate __fixtures__/{subdir}/{name}.{ext}
    // when the test target didn't copy fixtures into the bundle.
    let here = URL(fileURLWithPath: #filePath)
    let candidate = here
      .deletingLastPathComponent()  // Tests/
      .deletingLastPathComponent()  // ios/
      .deletingLastPathComponent()  // snoozepulse-audio/
      .appendingPathComponent("__fixtures__")
      .appendingPathComponent(subdir)
      .appendingPathComponent("\(name).\(ext)")
    if FileManager.default.fileExists(atPath: candidate.path) {
      return candidate
    }
    throw NSError(domain: "WaveformWindowTests", code: 404, userInfo: [
      NSLocalizedDescriptionKey: "Fixture not found: \(name).\(ext)",
    ])
  }

  private func parseInt16PCM(from data: Data) throws -> [Int16] {
    guard data.count >= 44,
          data[0..<4] == Data("RIFF".utf8),
          data[8..<12] == Data("WAVE".utf8) else {
      throw NSError(domain: "WaveformWindowTests", code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "Not a RIFF/WAVE file"])
    }
    var channels = 0
    var sampleRate = 0
    var bitsPerSample = 0
    var dataOffset = -1
    var dataLength = 0
    var pos = 12
    while pos + 8 <= data.count {
      let chunkId = data[pos..<pos+4]
      let chunkSize = Int(data[pos+4]) |
                      (Int(data[pos+5]) << 8) |
                      (Int(data[pos+6]) << 16) |
                      (Int(data[pos+7]) << 24)
      if chunkId == Data("fmt ".utf8) {
        channels = Int(data[pos+10]) | (Int(data[pos+11]) << 8)
        sampleRate = Int(data[pos+12]) |
                     (Int(data[pos+13]) << 8) |
                     (Int(data[pos+14]) << 16) |
                     (Int(data[pos+15]) << 24)
        bitsPerSample = Int(data[pos+22]) | (Int(data[pos+23]) << 8)
      } else if chunkId == Data("data".utf8) {
        dataOffset = pos + 8
        dataLength = chunkSize
      }
      pos += 8 + chunkSize
      if chunkSize % 2 != 0 { pos += 1 }
    }
    XCTAssertEqual(channels, 1, "Reference tone must be mono")
    XCTAssertEqual(bitsPerSample, 16, "Reference tone must be 16-bit PCM")
    XCTAssertEqual(sampleRate, 16_000, "Reference tone must be 16 kHz")
    guard dataOffset >= 0 else {
      throw NSError(domain: "WaveformWindowTests", code: 2,
                    userInfo: [NSLocalizedDescriptionKey: "WAV has no data chunk"])
    }
    let body = data.subdata(in: dataOffset..<(dataOffset + dataLength))
    return body.withUnsafeBytes { raw -> [Int16] in
      let ptr = raw.bindMemory(to: Int16.self)
      return Array(ptr)
    }
  }
}
