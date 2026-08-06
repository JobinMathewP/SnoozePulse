import {
  eachIsoDateInclusive,
  inRange,
  metricDelta,
  periodWindows,
  startOfLocalDay,
  toIsoDateLocal,
} from '@/utils';

describe('trendPeriods', () => {
  it('builds equal current and previous windows for 7d', () => {
    const now = Date.UTC(2026, 7, 7, 12, 0, 0);
    const { current, previous } = periodWindows('7d', now);
    expect(current.endedAt - current.startedAt).toBe(7 * 24 * 60 * 60 * 1000);
    expect(previous.endedAt).toBe(current.startedAt);
    expect(previous.endedAt - previous.startedAt).toBe(current.endedAt - current.startedAt);
  });

  it('returns null changeRatio when previous is zero', () => {
    expect(metricDelta(10, 0)).toEqual({ current: 10, previous: 0, changeRatio: null });
  });

  it('computes signed fractional change', () => {
    expect(metricDelta(86, 100).changeRatio).toBeCloseTo(-0.14);
  });

  it('formats local ISO dates and day starts', () => {
    const noon = new Date(2026, 7, 7, 12, 30, 0).getTime();
    expect(toIsoDateLocal(noon)).toBe('2026-08-07');
    const start = startOfLocalDay(noon);
    expect(new Date(start).getHours()).toBe(0);
  });

  it('lists inclusive local dates', () => {
    const from = new Date(2026, 7, 5, 23, 0, 0).getTime();
    const to = new Date(2026, 7, 7, 1, 0, 0).getTime();
    expect(eachIsoDateInclusive(from, to)).toEqual([
      '2026-08-05',
      '2026-08-06',
      '2026-08-07',
    ]);
  });

  it('uses half-open ranges', () => {
    const range = { startedAt: 100, endedAt: 200 };
    expect(inRange(100, range)).toBe(true);
    expect(inRange(199, range)).toBe(true);
    expect(inRange(200, range)).toBe(false);
  });
});
