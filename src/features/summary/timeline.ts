import type { TimelineBarModel, TimelinePeakCallout } from '@/components/ui';
import type { SessionSummary, SnoreEvent } from '@/types';

/**
 * Timeline derivation for the Summary chart.
 *
 * The stored `session_buckets` rows are aggregated at a fixed 5-minute grain (ADR-11) which
 * collapses short sessions to a single bar and truncates long sessions to just the window
 * between the first and last snore event. Neither shape matches docs/summary-screen.jpg,
 * which plots ~60 thin bars spanning the entire session range.
 *
 * To honour the reference on any session length (30 s of test data or an 8 h night) without
 * changing the service or DB layer, the chart is rendered from `events + summary.range`
 * directly. The persisted buckets remain as a historical aggregate for other consumers.
 *
 * A snore event is credited to every bar whose window it overlaps, so a 10 s snore that
 * spans two 5 s buckets contributes to both bars. Bar height uses the peak dB of the
 * loudest overlapping event; empty windows render as the minimum bar height.
 */

/** ~60 bars from summary-screen.jpg. */
export const TIMELINE_TARGET_BARS = 60;

/**
 * Lower bound on bucket duration. Sessions shorter than `TIMELINE_TARGET_BARS × 1 s` still
 * render up to 60 bars because 1 s buckets stay above this floor.
 */
export const TIMELINE_MIN_BUCKET_MS = 1_000;

export type TimelineDerivation = {
  readonly bars: readonly TimelineBarModel[];
  /** Width of a single bar's time window. */
  readonly bucketDurationMs: number;
  /**
   * Absolute epoch of the first bar. `bars[i]` covers
   * `[firstBucketStart + i × bucketDurationMs, firstBucketStart + (i + 1) × bucketDurationMs)`.
   */
  readonly firstBucketStart: number;
  readonly peakCallout: TimelinePeakCallout | undefined;
};

/**
 * ~5 evenly-spaced tick indices, matching the reference's 11PM / 1AM / 3AM / 5AM / 7AM
 * cadence. The caller resolves each index to a `HHAM/HHPM` label and drops duplicates so a
 * tiny test session doesn't repeat the same word five times.
 */
function pickLabelIndices(barCount: number): ReadonlySet<number> {
  if (barCount <= 1) {
    return new Set([0]);
  }
  const last = barCount - 1;
  const candidates = [
    0,
    Math.round(last * 0.25),
    Math.round(last * 0.5),
    Math.round(last * 0.75),
    last,
  ];
  return new Set(candidates);
}

function formatHourLabel(epochMs: number): string {
  const d = new Date(epochMs);
  const hour24 = d.getHours();
  const period = hour24 >= 12 ? 'PM' : 'AM';
  let hour = hour24 % 12;
  if (hour === 0) {
    hour = 12;
  }
  return `${hour}${period}`;
}

/**
 * Build the chart data model directly from events + session range.
 *
 * Returns `bars = []` and `peakCallout = undefined` for a zero-length range so the caller
 * can hide the timeline card entirely.
 */
export function deriveTimelineFromSession(
  events: readonly SnoreEvent[],
  summary: Pick<SessionSummary, 'range' | 'peakAt' | 'peakDb'>,
  options: {
    readonly targetBars?: number;
    readonly minBucketMs?: number;
  } = {},
): TimelineDerivation {
  const targetBars = options.targetBars ?? TIMELINE_TARGET_BARS;
  const minBucketMs = options.minBucketMs ?? TIMELINE_MIN_BUCKET_MS;

  const start = summary.range.startedAt;
  const end = summary.range.endedAt ?? start;
  const durationMs = Math.max(0, end - start);

  if (durationMs <= 0 || targetBars <= 0) {
    return {
      bars: [],
      bucketDurationMs: minBucketMs,
      firstBucketStart: start,
      peakCallout: undefined,
    };
  }

  const bucketDurationMs = Math.max(
    minBucketMs,
    Math.ceil(durationMs / targetBars),
  );
  const barCount = Math.max(1, Math.ceil(durationMs / bucketDurationMs));
  const labelIndices = pickLabelIndices(barCount);

  // Labels are always 12 h `HHAM/HHPM` per summary-screen.jpg. The first tick uses the
  // bar's start (session start), the last tick uses the session's *end* time so an 8 h
  // 11 PM → 7 AM session bookends on `11PM` / `7AM` even though the last bar begins ~7 min
  // before 7 AM. Interior ticks dedupe against the endpoints and their previous neighbour
  // so short sessions don't repeat the same hour word five times.
  const renderedLabelByIndex = new Map<number, string>();
  {
    const firstIdx = 0;
    const lastIdx = Math.max(0, barCount - 1);
    const firstLabel = formatHourLabel(start);
    const lastLabel = formatHourLabel(end);

    renderedLabelByIndex.set(firstIdx, firstLabel);
    if (lastIdx !== firstIdx) {
      renderedLabelByIndex.set(lastIdx, lastLabel);
    }

    const interior = Array.from(labelIndices)
      .filter((i) => i !== firstIdx && i !== lastIdx)
      .sort((a, b) => a - b);
    let previous = firstLabel;
    for (const i of interior) {
      const label = formatHourLabel(start + i * bucketDurationMs);
      if (label === previous || label === lastLabel) {
        continue;
      }
      renderedLabelByIndex.set(i, label);
      previous = label;
    }
  }

  const bars: TimelineBarModel[] = [];
  for (let i = 0; i < barCount; i += 1) {
    const bucketStart = start + i * bucketDurationMs;
    const bucketEnd = bucketStart + bucketDurationMs;

    let peakDb = 0;
    let peakSum = 0;
    let peakCount = 0;
    for (const event of events) {
      const evStart = event.timestamp;
      const evEnd = event.timestamp + event.durationMs;
      if (evEnd <= bucketStart || evStart >= bucketEnd) {
        continue;
      }
      peakDb = Math.max(peakDb, event.peakDb);
      peakSum += event.peakDb;
      peakCount += 1;
    }

    bars.push({
      id: `bar-${i}`,
      timeLabel: renderedLabelByIndex.get(i) ?? '',
      averageDb: peakCount > 0 ? peakSum / peakCount : 0,
      peakDb,
    });
  }

  let peakCallout: TimelinePeakCallout | undefined;
  if (summary.peakAt !== null && summary.peakDb > 0) {
    const index = Math.min(
      barCount - 1,
      Math.max(0, Math.floor((summary.peakAt - start) / bucketDurationMs)),
    );
    peakCallout = {
      barId: `bar-${index}`,
      label: `${Math.round(summary.peakDb)} dB`,
    };
  }

  return { bars, bucketDurationMs, firstBucketStart: start, peakCallout };
}

/** Parse `bar-${index}` ids back to a bar index. */
export function barIndexFromBarId(barId: string): number | null {
  const prefix = 'bar-';
  if (!barId.startsWith(prefix)) {
    return null;
  }
  const value = Number(barId.slice(prefix.length));
  return Number.isInteger(value) && value >= 0 ? value : null;
}

/**
 * Loudest event overlapping bar `index`. Uses the same overlap rule as the bar-height
 * pass so tap targets stay in sync with what the user sees.
 */
export function loudestEventInBar(
  events: readonly SnoreEvent[],
  firstBucketStart: number,
  bucketDurationMs: number,
  index: number,
): SnoreEvent | null {
  const bucketStart = firstBucketStart + index * bucketDurationMs;
  const bucketEnd = bucketStart + bucketDurationMs;
  let best: SnoreEvent | null = null;
  for (const event of events) {
    const evStart = event.timestamp;
    const evEnd = event.timestamp + event.durationMs;
    if (evEnd <= bucketStart || evStart >= bucketEnd) {
      continue;
    }
    if (best === null || event.peakDb > best.peakDb) {
      best = event;
    }
  }
  return best;
}
