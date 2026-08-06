import Foundation

/// Fixed-capacity PCM ring — allocated once, never resized on the audio thread.
final class PcmRingBuffer {
  private let capacity: Int
  private var data: [Int16]
  private var writeIndex = 0
  private var filled = 0
  private let lock = NSLock()

  init(capacity: Int) {
    self.capacity = capacity
    self.data = [Int16](repeating: 0, count: capacity)
  }

  var length: Int {
    lock.lock()
    defer { lock.unlock() }
    return filled
  }

  func write(_ src: UnsafePointer<Int16>, count: Int) {
    lock.lock()
    defer { lock.unlock() }
    var remaining = count
    var srcPos = 0
    while remaining > 0 {
      let chunk = min(remaining, capacity - writeIndex)
      for i in 0..<chunk {
        data[writeIndex + i] = src[srcPos + i]
      }
      writeIndex = (writeIndex + chunk) % capacity
      srcPos += chunk
      remaining -= chunk
      filled = min(capacity, filled + chunk)
    }
  }

  /// Copy the newest `count` samples into `dest`. Returns samples copied.
  @discardableResult
  func copyLatest(count: Int, into dest: inout [Int16]) -> Int {
    lock.lock()
    defer { lock.unlock() }
    let n = min(count, min(filled, dest.count))
    if n == 0 { return 0 }
    let start = (writeIndex - n + capacity) % capacity
    for i in 0..<n {
      dest[i] = data[(start + i) % capacity]
    }
    return n
  }

  func clear() {
    lock.lock()
    defer { lock.unlock() }
    writeIndex = 0
    filled = 0
  }
}
