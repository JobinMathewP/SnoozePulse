import type { SleepSession } from '@/types';

/**
 * Pure helpers for the calendar history view (ADR-30).
 *
 * All day math is local-time so a night started at 11pm lands on the day the user went to
 * bed. Kept dependency-free and side-effect-free so the grid, month spans, and the quiet-sleep
 * ring value are unit-testable without rendering.
 *
 * The grid is Monday-first (M T W T F S S) to match the reference history calendar.
 */

/** One day cell; `null` cells pad the leading week before the 1st. */
export type CalendarDay = {
  /** Local `YYYY-MM-DD`, used as a stable key and for day/aggregate lookups. */
  readonly iso: string;
  readonly day: number;
  /** How many sessions started on this day (drives the ring + multi-session picker). */
  readonly sessionCount: number;
};

export type CalendarCell = CalendarDay | null;

/** A `{year, month}` pair; `month` is 0-based like `Date`. */
export type YearMonth = {
  readonly year: number;
  readonly month: number;
};

/**
 * Per-day rollup of the night(s) started on a local day. Multiple sessions on one day are
 * summed so a single ring can represent the whole day (the picker still lists them all).
 */
export type DayAggregate = {
  readonly count: number;
  readonly snoringMs: number;
  readonly durationMs: number;
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** Monday-first weekday header, matching the reference layout. */
export const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

const pad2 = (n: number): string => (n < 10 ? `0${n}` : String(n));

/** Column index (0 = Monday … 6 = Sunday) for a JS weekday (0 = Sunday). */
function mondayFirstIndex(jsWeekday: number): number {
  return (jsWeekday + 6) % 7;
}

/** Local `YYYY-MM-DD` for a calendar position. */
export function isoLocal(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

/** Local `YYYY-MM-DD` for an epoch timestamp. Night identity is this bedtime day. */
export function isoLocalFromMs(ms: number): string {
  const d = new Date(ms);
  return isoLocal(d.getFullYear(), d.getMonth(), d.getDate());
}

/** `"August 2026"` for the sticky sheet title. */
export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

/** `"Aug"` for the inline month break above each month's first day. */
export function monthShortLabel(month: number): string {
  return MONTH_SHORT[month];
}

/** Count sessions per local day (drives the ring + picker without re-scanning). */
export function groupSessionCountsByDay(
  sessions: readonly SleepSession[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    const key = isoLocalFromMs(session.startedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * Roll up snoring and slept duration per local day so a single ring can score the day.
 * A still-running session (no `endedAt`) contributes no duration, so it never skews the ring.
 */
export function aggregateByDay(
  sessions: readonly SleepSession[],
): Map<string, DayAggregate> {
  const map = new Map<string, DayAggregate>();
  for (const session of sessions) {
    const key = isoLocalFromMs(session.startedAt);
    const prev = map.get(key) ?? { count: 0, snoringMs: 0, durationMs: 0 };
    const durationMs =
      session.endedAt !== null ? Math.max(0, session.endedAt - session.startedAt) : 0;
    map.set(key, {
      count: prev.count + 1,
      snoringMs: prev.snoringMs + session.totalSnoringMs,
      durationMs: prev.durationMs + durationMs,
    });
  }
  return map;
}

/**
 * "Quiet sleep" ring value in `[0, 1]`: the share of the night spent *not* snoring, so a
 * full ring rewards a quiet night (ADR-30). Returns `null` when there is no measurable
 * duration to score, so the caller can draw an empty track instead of a misleading full ring.
 */
export function quietFraction(agg: DayAggregate | undefined): number | null {
  if (agg === undefined || agg.durationMs <= 0) {
    return null;
  }
  const snore = Math.min(agg.snoringMs, agg.durationMs);
  const quiet = 1 - snore / agg.durationMs;
  return Math.max(0, Math.min(1, quiet));
}

/** Sessions started on a given local day, newest first. */
export function sessionsForDay(
  sessions: readonly SleepSession[],
  iso: string,
): readonly SleepSession[] {
  return sessions
    .filter((s) => isoLocalFromMs(s.startedAt) === iso)
    .sort((a, b) => b.startedAt - a.startedAt);
}

/**
 * Build a Monday-first grid for the month with leading blanks so the 1st lands under its
 * weekday. No trailing pad — the last partial week just ends early.
 */
export function buildMonthCells(
  year: number,
  month: number,
  countsByIso: Map<string, number>,
): CalendarCell[] {
  const leading = mondayFirstIndex(new Date(year, month, 1).getDay());
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: CalendarCell[] = [];
  for (let i = 0; i < leading; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = isoLocal(year, month, day);
    cells.push({ iso, day, sessionCount: countsByIso.get(iso) ?? 0 });
  }
  return cells;
}

/** How many empty months to render before the first recorded (or current) month. */
export const HISTORY_LEAD_MONTHS = 7;

/** Step a `{year, month}` by ±1 month, rolling the year over. */
export function shiftMonth(
  year: number,
  month: number,
  direction: -1 | 1,
): YearMonth {
  return addMonths({ year, month }, direction);
}

/** Step a `{year, month}` by any number of months, rolling the year over. */
export function addMonths(ym: YearMonth, delta: number): YearMonth {
  const next = new Date(ym.year, ym.month + delta, 1);
  return { year: next.getFullYear(), month: next.getMonth() };
}

/**
 * Visible history window: seven empty months before the first recorded night (or the
 * current month when there is no data), through next month after `current`. Next month
 * is always included so the list can overscroll past "now" the way Fitness history does.
 */
export function historyMonthRange(
  sessions: readonly { readonly startedAt: number }[],
  current: YearMonth,
): { start: YearMonth; end: YearMonth } {
  let first = current;
  for (const session of sessions) {
    const d = new Date(session.startedAt);
    if (d.getFullYear() * 12 + d.getMonth() < first.year * 12 + first.month) {
      first = { year: d.getFullYear(), month: d.getMonth() };
    }
  }
  return {
    start: addMonths(first, -HISTORY_LEAD_MONTHS),
    end: addMonths(current, 1),
  };
}

/**
 * Month whose vertical midpoint is closest to the viewport center. Backs the sticky title so
 * it names the month in the middle of the screen, not the one peeking at the top edge.
 */
export function monthIndexAtCenter(
  layouts: readonly { readonly y: number; readonly height: number }[],
  scrollY: number,
  viewportHeight: number,
): number {
  if (layouts.length === 0 || viewportHeight <= 0) {
    return -1;
  }
  const centerY = scrollY + viewportHeight / 2;
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < layouts.length; i += 1) {
    const layout = layouts[i];
    if (layout === undefined) {
      continue;
    }
    const mid = layout.y + layout.height / 2;
    const dist = Math.abs(mid - centerY);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

/**
 * Every `{year, month}` from `start` to `end` inclusive, ascending. Backs the continuous
 * scroll: months render oldest → newest with no gaps, so cell heights never shift. Returns
 * `[]` if `end` precedes `start`.
 */
export function monthsBetween(start: YearMonth, end: YearMonth): YearMonth[] {
  const startIdx = start.year * 12 + start.month;
  const endIdx = end.year * 12 + end.month;
  const months: YearMonth[] = [];
  for (let idx = startIdx; idx <= endIdx; idx += 1) {
    months.push({ year: Math.floor(idx / 12), month: idx % 12 });
  }
  return months;
}

export const calendarCopy = {
  title: 'Sleep history',
  closeAccessibilityLabel: 'Close calendar',
  emptyState: 'Your recorded nights will appear here.',
  multiTitle: 'Choose a night',
  multiClose: 'Close',
  dayAccessibilityLabel: (iso: string, count: number, quiet: number | null): string => {
    if (count === 0) {
      return `${iso}, no sessions`;
    }
    const nights = `${count} ${count === 1 ? 'session' : 'sessions'}`;
    if (quiet === null) {
      return `${iso}, ${nights}`;
    }
    return `${iso}, ${nights}, ${Math.round(quiet * 100)}% quiet sleep`;
  },
} as const;
