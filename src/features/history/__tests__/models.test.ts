import type { DailyScoreSummary } from '@/types';

import { toDayColumns } from '../models';

function scoredDay(date: string): DailyScoreSummary {
  return {
    date,
    sessionId: 'session-1',
    snoreScore: { value: 40, band: 'moderate', filledDots: 3 },
  };
}

describe('toDayColumns', () => {
  it('keeps the ISO calendar day (no UTC midnight shift)', () => {
    const columns = toDayColumns([scoredDay('2026-08-14')]);
    expect(columns).toHaveLength(1);
    expect(columns[0]?.dayNumberLabel).toBe('14');
  });
});
