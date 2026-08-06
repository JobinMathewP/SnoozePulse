package expo.modules.snoozepulseaudio

import java.io.File
import java.io.RandomAccessFile
import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * Writes 16-bit mono PCM WAV files under the app documents/snippets directory.
 * On failure returns null so the caller can still emit a SnoreEvent with audioPath=null.
 */
internal object SnippetWriter {
  private const val BITS_PER_SAMPLE = 16
  private const val CHANNELS = 1

  fun snippetsDirectory(filesDir: File): File {
    val dir = File(filesDir, "snippets")
    if (!dir.exists()) {
      dir.mkdirs()
    }
    return dir
  }

  /**
   * Persist [samples] as a WAV. Returns absolute file path on success, null on I/O failure.
   */
  fun writeWav(
    filesDir: File,
    sessionId: String,
    timestampMs: Long,
    sampleRate: Int,
    samples: ShortArray,
    sampleCount: Int,
  ): String? {
    if (sampleCount <= 0) {
      return null
    }
    return try {
      val dir = snippetsDirectory(filesDir)
      val file = File(dir, "${sessionId}_${timestampMs}.wav")
      RandomAccessFile(file, "rw").use { raf ->
        // Placeholder header — filled after PCM bytes are known.
        raf.write(ByteArray(44))
        val pcm = ByteBuffer.allocate(sampleCount * 2).order(ByteOrder.LITTLE_ENDIAN)
        for (i in 0 until sampleCount) {
          pcm.putShort(samples[i])
        }
        raf.write(pcm.array())
        val dataSize = sampleCount * 2
        raf.seek(0)
        raf.write(buildHeader(sampleRate, dataSize))
      }
      file.absolutePath
    } catch (_: Exception) {
      null
    }
  }

  private fun buildHeader(sampleRate: Int, dataSize: Int): ByteArray {
    val byteRate = sampleRate * CHANNELS * BITS_PER_SAMPLE / 8
    val blockAlign = (CHANNELS * BITS_PER_SAMPLE / 8).toShort()
    val buffer = ByteBuffer.allocate(44).order(ByteOrder.LITTLE_ENDIAN)
    buffer.put("RIFF".toByteArray(Charsets.US_ASCII))
    buffer.putInt(36 + dataSize)
    buffer.put("WAVE".toByteArray(Charsets.US_ASCII))
    buffer.put("fmt ".toByteArray(Charsets.US_ASCII))
    buffer.putInt(16) // PCM chunk size
    buffer.putShort(1) // PCM format
    buffer.putShort(CHANNELS.toShort())
    buffer.putInt(sampleRate)
    buffer.putInt(byteRate)
    buffer.putShort(blockAlign)
    buffer.putShort(BITS_PER_SAMPLE.toShort())
    buffer.put("data".toByteArray(Charsets.US_ASCII))
    buffer.putInt(dataSize)
    return buffer.array()
  }
}
