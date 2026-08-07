import type { SessionBucket, SnoreEvent } from '@/types';

/**
 * Build `session_buckets` rows from completed snore episodes (ADR-11).
 *
 * Pure: does not touch SQLite — the caller decides when to `saveBuckets`. Quiet gaps
 * between the first and last event bucket are filled with zero snoring so the Summary
 * timeline keeps a continuous bar strip (same shape as the Task 3.4 mock).
 *
 * `averageDb` / `peakDb` for a bucket with events are the mean and max of episode peaks;
 * we do not have the 10 Hz level stream here (that stays native / Reanimated).
 */
export function aggregateBucketsFromEvents(
  sessionId: string,
  events: readonly SnoreEvent[],
  bucketDurationMs: number,
): readonly SessionBucket[] {
  if (events.length === 0 || bucketDurationMs <= 0) {
    return [];
  }

  // Accumulate per bucket start, then expand to a contiguous range for the timeline.
  const tallies = new Map<
    number,
    { peakSum: number; peakMax: number; count: number; snoringMs: number }
  >();

  let minStart = Number.POSITIVE_INFINITY;
  let maxStart = Number.NEGATIVE_INFINITY;

  for (const event of events) {
    const bucketStart =
      Math.floor(event.timestamp / bucketDurationMs) * bucketDurationMs;
    minStart = Math.min(minStart, bucketStart);
    maxStart = Math.max(maxStart, bucketStart);

    const existing = tallies.get(bucketStart);
    if (!existing) {
      tallies.set(bucketStart, {
        peakSum: event.peakDb,
        peakMax: event.peakDb,
        count: 1,
        snoringMs: event.durationMs,
      });
      continue;
    }
    existing.peakSum += event.peakDb;
    existing.peakMax = Math.max(existing.peakMax, event.peakDb);
    existing.count += 1;
    existing.snoringMs += event.durationMs;
  }

  const buckets: SessionBucket[] = [];
  for (
    let bucketStart = minStart;
    bucketStart <= maxStart;
    bucketStart += bucketDurationMs
  ) {
    const tally = tallies.get(bucketStart);
    if (!tally) {
      buckets.push({
        sessionId,
        bucketStart,
        averageDb: 0,
        peakDb: 0,
        snoringMs: 0,
      });
      continue;
    }
    buckets.push({
      sessionId,
      bucketStart,
      averageDb: tally.peakSum / tally.count,
      peakDb: tally.peakMax,
      snoringMs: tally.snoringMs,
    });
  }

  return buckets;
}
