package expo.modules.snoozepulseaudio

/**
 * Fixed-capacity PCM ring — allocated once, never resized.
 * Capture thread writes; DSP / snippet path reads the most recent samples without allocating.
 */
internal class PcmRingBuffer(private val capacity: Int) {
  private val data = ShortArray(capacity)
  private var writeIndex = 0
  private var filled = 0

  val length: Int
    get() = filled

  /** Copy [src] into the ring. Caller must not pass a newly allocated buffer each frame. */
  @Synchronized
  fun write(src: ShortArray, offset: Int, count: Int) {
    var remaining = count
    var srcPos = offset
    while (remaining > 0) {
      val chunk = minOf(remaining, capacity - writeIndex)
      System.arraycopy(src, srcPos, data, writeIndex, chunk)
      writeIndex = (writeIndex + chunk) % capacity
      srcPos += chunk
      remaining -= chunk
      filled = minOf(capacity, filled + chunk)
    }
  }

  /**
   * Copy the newest [count] samples into [dest] (must be pre-sized).
   * Returns how many samples were copied.
   */
  @Synchronized
  fun copyLatest(count: Int, dest: ShortArray): Int {
    val n = minOf(count, filled, dest.size)
    if (n == 0) {
      return 0
    }
    val start = (writeIndex - n + capacity) % capacity
    val first = minOf(n, capacity - start)
    System.arraycopy(data, start, dest, 0, first)
    if (first < n) {
      System.arraycopy(data, 0, dest, first, n - first)
    }
    return n
  }

  @Synchronized
  fun clear() {
    writeIndex = 0
    filled = 0
  }
}
