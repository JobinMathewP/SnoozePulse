import type { SleepSession } from '@/types';

import {
  aggregateByDay,
  buildMonthCells,
  groupSessionCountsByDay,
  isoLocal,
  isoLocalFromMs,
  addMonths,
  historyMonthRange,
  monthIndexAtCenter,
  monthLabel,
  monthShortLabel,
  monthsBetween,
  quietFraction,
  sessionsForDay,
  shiftMonth,
} from '../models';

function sessionAt(
  id: string,
  ms: number,
  overrides: Partial<SleepSession> = {},
): SleepSession {
  return {
    id,
    startedAt: ms,
    endedAt: ms + 60_000,
    state: 'COMPLETED',
    ambientBaselineDb: 30,
    snoreCount: 0,
    totalSnoringMs: 0,
    peakDb: 0,
    peakAt: null,
    sleepScore: null,
    snoreScore: null,
    ...overrides,
  };
}

describe('isoLocal helpers', () => {
  it('formats a padded local date', () => {
    expect(isoLocal(2026, 0, 5)).toBe('2026-01-05');
    expect(isoLocal(2026, 11, 25)).toBe('2026-12-25');
  });

  it('derives the same local day from a timestamp', () => {
    const ms = new Date(2026, 7, 15, 23, 30).getTime();
    expect(isoLocalFromMs(ms)).toBe('2026-08-15');
  });
});

describe('monthLabel + monthShortLabel', () => {
  it('names the month and year', () => {
    expect(monthLabel(2026, 7)).toBe('August 2026');
  });

  it('abbreviates the month for inline breaks', () => {
    expect(monthShortLabel(7)).toBe('Aug');
    expect(monthShortLabel(3)).toBe('Apr');
  });
});

describe('buildMonthCells (Monday-first)', () => {
  it('pads the leading week and lists every day', () => {
    // August 2026: the 1st is a Saturday, which is column index 5 in a Monday-first grid.
    const cells = buildMonthCells(2026, 7, new Map());
    const leadingPad = cells.slice(0, 5).every((c) => c === null);
    expect(leadingPad).toBe(true);
    expect(cells[5]).toEqual({ iso: '2026-08-01', day: 1, sessionCount: 0 });
    const days = cells.filter((c) => c !== null);
    expect(days).toHaveLength(31);
  });

  it('places a Monday 1st with no leading blanks', () => {
    // June 2026: the 1st is a Monday, so it takes the first column with no pad.
    const cells = buildMonthCells(2026, 5, new Map());
    expect(cells[0]).toEqual({ iso: '2026-06-01', day: 1, sessionCount: 0 });
  });

  it('carries session counts onto the matching day', () => {
    const counts = new Map<string, number>([['2026-08-15', 2]]);
    const cells = buildMonthCells(2026, 7, counts);
    const target = cells.find((c) => c?.iso === '2026-08-15');
    expect(target?.sessionCount).toBe(2);
  });
});

describe('groupSessionCountsByDay + sessionsForDay', () => {
  it('counts multiple sessions on the same local day', () => {
    const day = new Date(2026, 7, 15, 22, 0).getTime();
    const later = new Date(2026, 7, 15, 23, 30).getTime();
    const other = new Date(2026, 7, 16, 1, 0).getTime();
    const sessions = [sessionAt('a', day), sessionAt('b', later), sessionAt('c', other)];

    const counts = groupSessionCountsByDay(sessions);
    expect(counts.get('2026-08-15')).toBe(2);
    expect(counts.get('2026-08-16')).toBe(1);
  });

  it('returns same-day sessions newest first', () => {
    const early = new Date(2026, 7, 15, 22, 0).getTime();
    const late = new Date(2026, 7, 15, 23, 30).getTime();
    const sessions = [sessionAt('early', early), sessionAt('late', late)];
    const forDay = sessionsForDay(sessions, '2026-08-15');
    expect(forDay.map((s) => s.id)).toEqual(['late', 'early']);
  });
});

describe('aggregateByDay + quietFraction', () => {
  it('sums snoring and slept duration across same-day sessions', () => {
    const start = new Date(2026, 7, 15, 22, 0).getTime();
    const sessions = [
      sessionAt('a', start, { endedAt: start + 60 * 60_000, totalSnoringMs: 15 * 60_000 }),
      sessionAt('b', start + 90 * 60_000, {
        endedAt: start + 90 * 60_000 + 60 * 60_000,
        totalSnoringMs: 45 * 60_000,
      }),
    ];
    const agg = aggregateByDay(sessions).get('2026-08-15');
    expect(agg).toEqual({
      count: 2,
      snoringMs: 60 * 60_000,
      durationMs: 120 * 60_000,
    });
    // Half the combined night was snoring, so quiet sleep is 0.5.
    expect(quietFraction(agg)).toBeCloseTo(0.5);
  });

  it('ignores a still-running session in the duration', () => {
    const start = new Date(2026, 7, 15, 22, 0).getTime();
    const agg = aggregateByDay([
      sessionAt('running', start, { endedAt: null, totalSnoringMs: 0 }),
    ]).get('2026-08-15');
    expect(agg?.durationMs).toBe(0);
    // No measurable duration → no ring value (empty track), not a misleading full ring.
    expect(quietFraction(agg)).toBeNull();
  });

  it('clamps quiet sleep into [0, 1]', () => {
    expect(quietFraction({ count: 1, snoringMs: 200, durationMs: 100 })).toBe(0);
    expect(quietFraction({ count: 1, snoringMs: 0, durationMs: 100 })).toBe(1);
    expect(quietFraction(undefined)).toBeNull();
  });
});

describe('monthsBetween', () => {
  it('lists every month inclusive, ascending, across a year boundary', () => {
    const months = monthsBetween({ year: 2025, month: 10 }, { year: 2026, month: 1 });
    expect(months).toEqual([
      { year: 2025, month: 10 },
      { year: 2025, month: 11 },
      { year: 2026, month: 0 },
      { year: 2026, month: 1 },
    ]);
  });

  it('returns a single month when start equals end', () => {
    expect(monthsBetween({ year: 2026, month: 7 }, { year: 2026, month: 7 })).toEqual([
      { year: 2026, month: 7 },
    ]);
  });

  it('returns empty when end precedes start', () => {
    expect(monthsBetween({ year: 2026, month: 7 }, { year: 2026, month: 5 })).toEqual([]);
  });
});

describe('shiftMonth + addMonths', () => {
  it('rolls forward across the year boundary', () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
  });

  it('rolls backward across the year boundary', () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
  });

  it('steps by more than one month', () => {
    expect(addMonths({ year: 2026, month: 7 }, -7)).toEqual({ year: 2026, month: 0 });
    expect(addMonths({ year: 2026, month: 1 }, 1)).toEqual({ year: 2026, month: 2 });
  });
});

describe('historyMonthRange', () => {
  const august = { year: 2026, month: 7 };

  it('pads seven empty months before the current month when there is no data', () => {
    expect(historyMonthRange([], august)).toEqual({
      start: { year: 2026, month: 0 },
      end: { year: 2026, month: 8 },
    });
  });

  it('pads seven months before the first recorded night, and ends at next month', () => {
    const first = new Date(2026, 5, 10).getTime();
    expect(historyMonthRange([sessionAt('a', first)], august)).toEqual({
      start: { year: 2025, month: 10 },
      end: { year: 2026, month: 8 },
    });
  });
});

describe('monthIndexAtCenter', () => {
  const layouts = [
    { y: 0, height: 200 },
    { y: 200, height: 200 },
    { y: 400, height: 200 },
  ];

  it('picks the month whose midpoint is nearest the viewport center', () => {
    // Viewport 200px tall, scrolled so center sits in the middle of month 1.
    expect(monthIndexAtCenter(layouts, 200, 200)).toBe(1);
  });

  it('stays on the first month while the top of the next month is only peeking', () => {
    // Viewport center is still inside month 0 (centerY = 100).
    expect(monthIndexAtCenter(layouts, 0, 200)).toBe(0);
  });

  it('returns -1 when there is nothing to measure', () => {
    expect(monthIndexAtCenter([], 0, 200)).toBe(-1);
    expect(monthIndexAtCenter(layouts, 0, 0)).toBe(-1);
  });
});
