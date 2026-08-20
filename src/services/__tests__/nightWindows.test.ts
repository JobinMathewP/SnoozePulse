import {
  CHARGER_REMINDER_LEAD_MINUTES,
  missedReasonFromStartError,
  shouldShowChargerReminder,
  sleepNightIso,
} from '@/services/nightWindows';
import type { AppError, LocalTimeOfDay } from '@/types';

const bedtime: LocalTimeOfDay = { hours: 23, minutes: 30 };
const wakeTime: LocalTimeOfDay = { hours: 7, minutes: 0 };

describe('sleepNightIso', () => {
  it('uses the wake-morning date late in the readiness window', () => {
    const now = new Date(2026, 7, 20, 23, 30, 0, 0);
    expect(sleepNightIso(now, bedtime, wakeTime)).toBe('2026-08-21');
  });

  it('uses the wake-morning date after midnight', () => {
    const now = new Date(2026, 7, 21, 2, 0, 0, 0);
    expect(sleepNightIso(now, bedtime, wakeTime)).toBe('2026-08-21');
  });

  it('falls back to the calendar date when the schedule is missing', () => {
    const now = new Date(2026, 7, 20, 23, 30, 0, 0);
    expect(sleepNightIso(now, null, null)).toBe('2026-08-20');
  });
});

describe('missedReasonFromStartError', () => {
  it('maps permission denial to microphone', () => {
    const error: AppError = { code: 'PERMISSION_DENIED', message: 'denied' };
    expect(missedReasonFromStartError(error)).toBe('microphone');
  });

  it('maps other engine failures to engine', () => {
    const error: AppError = { code: 'AUDIO_ENGINE', message: 'failed' };
    expect(missedReasonFromStartError(error)).toBe('engine');
  });
});

describe('shouldShowChargerReminder', () => {
  const base = {
    automaticTrackingEnabled: true,
    charging: false,
    isRecording: false,
    bedtime,
    wakeTime,
  };

  it('shows in the three-hour lead before readiness', () => {
    expect(CHARGER_REMINDER_LEAD_MINUTES).toBe(180);
    const now = new Date(2026, 7, 20, 20, 30, 0, 0);
    expect(shouldShowChargerReminder({ ...base, now })).toBe(true);
  });

  it('shows inside the readiness window', () => {
    const now = new Date(2026, 7, 20, 23, 15, 0, 0);
    expect(shouldShowChargerReminder({ ...base, now })).toBe(true);
  });

  it('does not show in the afternoon', () => {
    const now = new Date(2026, 7, 20, 15, 0, 0, 0);
    expect(shouldShowChargerReminder({ ...base, now })).toBe(false);
  });

  it('does not show while charging or recording', () => {
    const now = new Date(2026, 7, 20, 23, 15, 0, 0);
    expect(shouldShowChargerReminder({ ...base, now, charging: true })).toBe(false);
    expect(shouldShowChargerReminder({ ...base, now, isRecording: true })).toBe(false);
  });

  it('does not show when automatic tracking is off or the schedule is missing', () => {
    const now = new Date(2026, 7, 20, 23, 15, 0, 0);
    expect(
      shouldShowChargerReminder({ ...base, now, automaticTrackingEnabled: false }),
    ).toBe(false);
    expect(shouldShowChargerReminder({ ...base, now, bedtime: null })).toBe(false);
  });
});
