import type { DateRange, EpochMs, IsoDate, MetricDelta, TrendPeriod } from '@/types';

/** Length of the History comparison window for each period control. */
export const TREND_PERIOD_MS: Record<TrendPeriod, number> = {
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

/**
 * Split “now” into current + previous equal-length windows.
 *
 * Baseline (documented for History % deltas):
 * - `current` ends at `nowMs` (exclusive end for half-open ranges) and starts `periodMs` earlier.
 * - `previous` is the immediately preceding window of the same length, ending where
 *   `current` starts. That matches the mock’s “May 7–13 vs May 14–20” style pairing.
 */
export function periodWindows(
  period: TrendPeriod,
  nowMs: EpochMs,
): { readonly current: DateRange; readonly previous: DateRange } {
  const periodMs = TREND_PERIOD_MS[period];
  const currentEnd = nowMs;
  const currentStart = currentEnd - periodMs;
  const previousEnd = currentStart;
  const previousStart = previousEnd - periodMs;
  return {
    current: { startedAt: currentStart, endedAt: currentEnd },
    previous: { startedAt: previousStart, endedAt: previousEnd },
  };
}

/**
 * Signed fractional change `(current - previous) / previous`.
 * Null when `previous` is 0 so UI can show an em dash instead of ∞%.
 * A snore-score drop of 14% is `changeRatio ≈ -0.14` (improvement on History).
 */
export function metricDelta(current: number, previous: number): MetricDelta {
  if (previous === 0) {
    return { current, previous, changeRatio: null };
  }
  return {
    current,
    previous,
    changeRatio: (current - previous) / previous,
  };
}

/** Local calendar day `YYYY-MM-DD` for a session start (History column key). */
export function toIsoDateLocal(epochMs: EpochMs): IsoDate {
  const date = new Date(epochMs);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Start of local calendar day containing `epochMs`. */
export function startOfLocalDay(epochMs: EpochMs): EpochMs {
  const date = new Date(epochMs);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** Inclusive list of local ISO dates from `fromMs` through `toMs` (by calendar day). */
export function eachIsoDateInclusive(fromMs: EpochMs, toMs: EpochMs): readonly IsoDate[] {
  const dates: IsoDate[] = [];
  let cursor = startOfLocalDay(fromMs);
  const end = startOfLocalDay(toMs);
  while (cursor <= end) {
    dates.push(toIsoDateLocal(cursor));
    cursor += 24 * 60 * 60 * 1000;
  }
  return dates;
}

/** True when `instant` lies in the half-open range `[startedAt, endedAt)`. */
export function inRange(instant: EpochMs, range: DateRange): boolean {
  return instant >= range.startedAt && instant < range.endedAt;
}
