import type { LocalTimeOfDay, SleepSession } from '@/types';

import { homeCopy, missedNightCopy, tonightCopy } from '../copy';
import type { LastNightPresentation } from '../lastNightPresentation';
import { tonightStatus } from '../tonightStatus';

const bedtime: LocalTimeOfDay = { hours: 23, minutes: 30 };
const wakeTime: LocalTimeOfDay = { hours: 7, minutes: 0 };

const emptyNight: LastNightPresentation = {
  session: null,
  missedReason: null,
  showBatterySavedCaption: false,
  belongsToCurrentNight: false,
};

const completedNight: LastNightPresentation = {
  session: { id: 's1' } as SleepSession,
  missedReason: null,
  showBatterySavedCaption: false,
  belongsToCurrentNight: true,
};

describe('tonightStatus', () => {
  it('keeps product-v1 Start copy when automatic tracking is off', () => {
    const result = tonightStatus({
      automaticTrackingEnabled: false,
      sessionState: 'IDLE',
      bedtime,
      wakeTime,
      lastNight: emptyNight,
      now: new Date(2026, 7, 20, 21, 0),
    });
    expect(result.kind).toBe('manual');
    expect(result.headline).toBe(homeCopy.headline);
    expect(result.subhead).toBe(homeCopy.subhead);
    expect(result.heroCaption).toBeNull();
    expect(result.heroAccessibilityLabel).toBe(homeCopy.heroAccessibilityLabel);
    expect(result.openActiveOnPress).toBe(false);
  });

  it('is armed before the readiness window', () => {
    const result = tonightStatus({
      automaticTrackingEnabled: true,
      sessionState: 'IDLE',
      bedtime,
      wakeTime,
      lastNight: emptyNight,
      now: new Date(2026, 7, 20, 18, 0),
    });
    expect(result.kind).toBe('armed');
    expect(result.headline).toBe(tonightCopy.armedHeadline);
    expect(result.subhead).toContain('11:30 PM');
    expect(result.heroCaption).toBe(tonightCopy.overrideCaption);
    expect(result.heroAccessibilityLabel).toBe(tonightCopy.overrideAccessibilityLabel);
  });

  it('is waiting inside the readiness window', () => {
    const result = tonightStatus({
      automaticTrackingEnabled: true,
      sessionState: 'IDLE',
      bedtime,
      wakeTime,
      lastNight: emptyNight,
      now: new Date(2026, 7, 20, 23, 15),
    });
    expect(result.kind).toBe('waiting');
    expect(result.headline).toBe(tonightCopy.waitingHeadline);
  });

  it('is monitoring while a session is live', () => {
    const result = tonightStatus({
      automaticTrackingEnabled: true,
      sessionState: 'RECORDING',
      bedtime,
      wakeTime,
      lastNight: emptyNight,
      now: new Date(2026, 7, 21, 2, 0),
    });
    expect(result.kind).toBe('monitoring');
    expect(result.headline).toBe(tonightCopy.monitoringHeadline);
    expect(result.heroCaption).toBe(tonightCopy.inProgressCaption);
    expect(result.openActiveOnPress).toBe(true);
  });

  it('is failed when last night missed and does not invent scores', () => {
    const result = tonightStatus({
      automaticTrackingEnabled: true,
      sessionState: 'IDLE',
      bedtime,
      wakeTime,
      lastNight: {
        ...emptyNight,
        missedReason: 'battery',
        belongsToCurrentNight: true,
      },
      now: new Date(2026, 7, 21, 8, 0),
    });
    expect(result.kind).toBe('failed');
    expect(result.headline).toBe(missedNightCopy.battery.title);
    expect(result.subhead).toBe(missedNightCopy.battery.body);
  });

  it('is ready after a completed night once the wake window has ended', () => {
    const result = tonightStatus({
      automaticTrackingEnabled: true,
      sessionState: 'IDLE',
      bedtime,
      wakeTime,
      lastNight: completedNight,
      now: new Date(2026, 7, 21, 8, 0),
    });
    expect(result.kind).toBe('ready');
    expect(result.headline).toBe(tonightCopy.readyHeadline);
    expect(result.heroCaption).toBe(tonightCopy.overrideCaption);
  });

  it('asks for a schedule when auto is on without bedtime', () => {
    const result = tonightStatus({
      automaticTrackingEnabled: true,
      sessionState: 'IDLE',
      bedtime: null,
      wakeTime: null,
      lastNight: emptyNight,
      now: new Date(2026, 7, 20, 15, 0),
    });
    expect(result.kind).toBe('failed');
    expect(result.headline).toBe(tonightCopy.unarmedHeadline);
    expect(result.subhead).toBe(tonightCopy.unarmedSubhead);
  });
});
