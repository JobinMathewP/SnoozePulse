import type { LocalTimeOfDay, SleepSession } from '@/types';

import { lastNightPresentation } from '../lastNightPresentation';

const bedtime: LocalTimeOfDay = { hours: 23, minutes: 30 };
const wakeTime: LocalTimeOfDay = { hours: 7, minutes: 0 };

function session(overrides: Partial<SleepSession>): SleepSession {
  return {
    id: 's1',
    startedAt: new Date(2026, 7, 20, 23, 40).getTime(),
    endedAt: new Date(2026, 7, 21, 7, 10).getTime(),
    state: 'COMPLETED',
    ambientBaselineDb: 30,
    snoreCount: 4,
    totalSnoringMs: 12_000,
    peakDb: 50,
    peakAt: null,
    sleepScore: 80,
    snoreScore: 42,
    ...overrides,
  };
}

const base = {
  sessions: [] as readonly SleepSession[],
  missedNight: null,
  automaticTrackingEnabled: true,
  bedtime,
  wakeTime,
  microphone: 'granted' as const,
  lastCompletedWasBatterySave: false,
  now: new Date(2026, 7, 21, 8, 0),
};

describe('lastNightPresentation', () => {
  it('shows a completed night with scores', () => {
    const completed = session({});
    const result = lastNightPresentation({ ...base, sessions: [completed] });
    expect(result.session).toBe(completed);
    expect(result.missedReason).toBeNull();
    expect(result.showBatterySavedCaption).toBe(false);
  });

  it('captions a battery save without treating it as failed', () => {
    const completed = session({});
    const result = lastNightPresentation({
      ...base,
      sessions: [completed],
      lastCompletedWasBatterySave: true,
    });
    expect(result.session).toBe(completed);
    expect(result.missedReason).toBeNull();
    expect(result.showBatterySavedCaption).toBe(true);
  });

  it('does not invent scores for an ERROR row from this night', () => {
    const failed = session({
      state: 'ERROR',
      sleepScore: 0,
      snoreScore: 0,
    });
    const result = lastNightPresentation({ ...base, sessions: [failed] });
    expect(result.session).toBeNull();
    expect(result.missedReason).toBe('engine');
  });

  it('surfaces a persisted miss for this night', () => {
    const result = lastNightPresentation({
      ...base,
      missedNight: { reason: 'battery', nightIso: '2026-08-21', atMs: 1 },
    });
    expect(result.session).toBeNull();
    expect(result.missedReason).toBe('battery');
  });

  it('asks for a schedule on an auto-enabled evening with no times set', () => {
    const result = lastNightPresentation({
      ...base,
      bedtime: null,
      wakeTime: null,
      now: new Date(2026, 7, 20, 21, 0),
    });
    expect(result.session).toBeNull();
    expect(result.missedReason).toBe('schedule');
  });

  it('surfaces a microphone miss near the window', () => {
    const result = lastNightPresentation({
      ...base,
      microphone: 'denied',
      now: new Date(2026, 7, 20, 23, 15),
    });
    expect(result.session).toBeNull();
    expect(result.missedReason).toBe('microphone');
  });

  it('falls back to an older completed night instead of showing a stale miss', () => {
    const older = session({
      id: 'older',
      startedAt: new Date(2026, 7, 18, 23, 40).getTime(),
      endedAt: new Date(2026, 7, 19, 7, 10).getTime(),
    });
    const result = lastNightPresentation({
      ...base,
      sessions: [older],
      missedNight: { reason: 'battery', nightIso: '2026-08-19', atMs: 1 },
      now: new Date(2026, 7, 21, 12, 0),
    });
    expect(result.session).toBe(older);
    expect(result.missedReason).toBeNull();
  });
});
