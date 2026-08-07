package expo.modules.snoozepulseaudio

import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.abs

/**
 * Byte-parity test for WaveformWindow against the Python oracle in
 * __fixtures__/waveform/generate_fixtures.py (Task 6.2).
 *
 * The fixtures live at ../__fixtures__/{audio,waveform}/ and are surfaced on the JVM test
 * classpath by the sourceSets.test.resources.srcDirs entry in build.gradle.
 */
class WaveformWindowTest {
  @Test
  fun matchesPythonOracleWithinFloatTolerance() {
    val mono = readWavAsInt16("audio/reference_tone.wav")
    assertEquals("Reference tone must be 3.000 s @ 16 kHz", 48_000, mono.size)

    val expected = readFloat32LEResource("waveform/reference_tone_windows.bin")
    val window = WaveformWindow()
    val expectedWindows = expected.size / window.patchSamples
    assertEquals(
      "Oracle should contain a whole number of patches",
      0,
      expected.size % window.patchSamples,
    )
    assertTrue("Oracle must contain at least one patch", expectedWindows > 0)

    val actual = FloatArray(expected.size)
    var offset = 0
    window.slidingWindows(mono, mono.size) { patch ->
      System.arraycopy(patch, 0, actual, offset, patch.size)
      offset += patch.size
    }
    assertEquals(
      "WaveformWindow must emit the same window count as the oracle",
      expected.size,
      offset,
    )

    var maxAbs = 0.0
    var sumAbs = 0.0
    for (i in expected.indices) {
      val diff = abs(expected[i] - actual[i]).toDouble()
      if (diff > maxAbs) maxAbs = diff
      sumAbs += diff
    }
    val mae = sumAbs / expected.size
    assertTrue(
      "MAE=$mae maxAbs=$maxAbs exceeds 1e-6 vs Python oracle",
      mae <= 1e-6 && maxAbs <= 1e-6,
    )
  }

  @Test
  fun fillReturnsSameInstanceEveryCall() {
    val window = WaveformWindow()
    val zeros = ShortArray(window.patchSamples)
    val first = window.fill(zeros, zeros.size)
    val second = window.fill(zeros, zeros.size)
    assertSame("fill() must reuse the internal patch buffer", first, second)
    assertEquals(window.patchSamples, first.size)
  }

  @Test
  fun fillNormalisesInt16FullScaleToPlusMinusOne() {
    val window = WaveformWindow()
    val samples = ShortArray(window.patchSamples)
    samples[0] = Short.MAX_VALUE
    samples[1] = Short.MIN_VALUE
    samples[2] = 0
    val patch = window.fill(samples, samples.size)
    assertEquals(32767.0f / 32768.0f, patch[0], 0.0f)
    assertEquals(-1.0f, patch[1], 0.0f)
    assertEquals(0.0f, patch[2], 0.0f)
  }

  @Test
  fun slidingWindowsSkipsTrailingPartial() {
    val window = WaveformWindow()
    // One full window plus a leftover fragment shorter than the next hop-aligned window.
    val len = window.patchSamples + window.hopSamples - 1
    val mono = ShortArray(len)
    var invocations = 0
    window.slidingWindows(mono, len) { invocations += 1 }
    assertEquals(1, invocations)
  }

  @Test
  fun slidingWindowsEmitsExpectedCountOnReferenceLength() {
    val window = WaveformWindow()
    val len = 48_000  // 3.000 s @ 16 kHz — must yield 5 windows (matches oracle).
    val mono = ShortArray(len)
    var invocations = 0
    window.slidingWindows(mono, len) { invocations += 1 }
    assertEquals(5, invocations)
  }

  private fun readFloat32LEResource(path: String): FloatArray {
    val stream = requireNotNull(javaClass.classLoader?.getResourceAsStream(path)) {
      "Missing test resource: $path"
    }
    val bytes = stream.use { it.readAllBytes() }
    assertEquals("Fixture $path must be a whole number of float32s", 0, bytes.size % 4)
    val buf = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN)
    val out = FloatArray(bytes.size / 4)
    for (i in out.indices) {
      out[i] = buf.float
    }
    return out
  }

  private fun readWavAsInt16(path: String): ShortArray {
    val stream = requireNotNull(javaClass.classLoader?.getResourceAsStream(path)) {
      "Missing test resource: $path"
    }
    val bytes = stream.use { it.readAllBytes() }
    val header = parseWavHeader(bytes)
    assertEquals("Reference tone must be mono", 1, header.channels)
    assertEquals("Reference tone must be 16-bit PCM", 16, header.bitsPerSample)
    assertEquals("Reference tone must be 16 kHz", 16_000, header.sampleRate)

    val body = bytes.copyOfRange(header.dataOffset, header.dataOffset + header.dataLength)
    val buf = ByteBuffer.wrap(body).order(ByteOrder.LITTLE_ENDIAN)
    val samples = ShortArray(body.size / 2)
    for (i in samples.indices) {
      samples[i] = buf.short
    }
    return samples
  }

  private data class WavHeader(
    val channels: Int,
    val sampleRate: Int,
    val bitsPerSample: Int,
    val dataOffset: Int,
    val dataLength: Int,
  )

  private fun parseWavHeader(bytes: ByteArray): WavHeader {
    val buf = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN)
    require(bytes.size >= 44) { "WAV too short (${bytes.size} bytes)" }
    val riff = String(bytes, 0, 4)
    val wave = String(bytes, 8, 4)
    require(riff == "RIFF" && wave == "WAVE") { "Not a RIFF/WAVE file" }

    var pos = 12
    var channels = 0
    var sampleRate = 0
    var bitsPerSample = 0
    var dataOffset = -1
    var dataLength = 0
    while (pos + 8 <= bytes.size) {
      val chunkId = String(bytes, pos, 4)
      val chunkSize = buf.getInt(pos + 4)
      when (chunkId) {
        "fmt " -> {
          channels = buf.getShort(pos + 10).toInt()
          sampleRate = buf.getInt(pos + 12)
          bitsPerSample = buf.getShort(pos + 22).toInt()
        }
        "data" -> {
          dataOffset = pos + 8
          dataLength = chunkSize
        }
      }
      pos += 8 + chunkSize
      if (chunkSize % 2 != 0) pos += 1
    }
    require(dataOffset >= 0) { "WAV has no data chunk" }
    return WavHeader(channels, sampleRate, bitsPerSample, dataOffset, dataLength)
  }
}
