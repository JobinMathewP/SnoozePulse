import { READINESS } from '../readinessConstants';
import { scheduleWindowFlags } from '../readinessWindows';

describe('scheduleWindowFlags', () => {
  const bedtime = { hours: 23, minutes: 30 };
  const wakeTime = { hours: 7, minutes: 0 };

  it('stays open until 2 hours before the wake window (11:00 PM → 4:30 AM)', () => {
    expect(READINESS.BEDTIME_LEAD_MINUTES).toBe(30);
    expect(READINESS.READINESS_CLOSE_BEFORE_WAKE_WINDOW_MINUTES).toBe(120);

    expect(scheduleWindowFlags(bedtime, wakeTime, { hours: 23, minutes: 0 }).inReadinessWindow).toBe(
      true,
    );
    expect(scheduleWindowFlags(bedtime, wakeTime, { hours: 23, minutes: 30 }).inReadinessWindow).toBe(
      true,
    );
    expect(scheduleWindowFlags(bedtime, wakeTime, { hours: 0, minutes: 30 }).inReadinessWindow).toBe(
      true,
    );
    expect(scheduleWindowFlags(bedtime, wakeTime, { hours: 2, minutes: 0 }).inReadinessWindow).toBe(
      true,
    );
    expect(scheduleWindowFlags(bedtime, wakeTime, { hours: 4, minutes: 30 }).inReadinessWindow).toBe(
      true,
    );
    expect(scheduleWindowFlags(bedtime, wakeTime, { hours: 4, minutes: 31 }).inReadinessWindow).toBe(
      false,
    );
    expect(scheduleWindowFlags(bedtime, wakeTime, { hours: 5, minutes: 0 }).inReadinessWindow).toBe(
      false,
    );
    expect(scheduleWindowFlags(bedtime, wakeTime, { hours: 22, minutes: 59 }).inReadinessWindow).toBe(
      false,
    );
  });

  it('matches a 11:00 PM → 7:00 AM night: 2 AM can start, 5 AM cannot', () => {
    const eleven = { hours: 23, minutes: 0 };
    expect(scheduleWindowFlags(eleven, wakeTime, { hours: 2, minutes: 0 }).inReadinessWindow).toBe(
      true,
    );
    expect(scheduleWindowFlags(eleven, wakeTime, { hours: 5, minutes: 0 }).inReadinessWindow).toBe(
      false,
    );
  });

  it('matches the PRD wake window 6:30 AM → 7:30 AM', () => {
    expect(scheduleWindowFlags(bedtime, wakeTime, { hours: 6, minutes: 30 }).inWakeWindow).toBe(true);
    expect(scheduleWindowFlags(bedtime, wakeTime, { hours: 7, minutes: 0 }).inWakeWindow).toBe(true);
    expect(scheduleWindowFlags(bedtime, wakeTime, { hours: 7, minutes: 30 }).inWakeWindow).toBe(true);
    expect(scheduleWindowFlags(bedtime, wakeTime, { hours: 7, minutes: 31 }).inWakeWindow).toBe(
      false,
    );
  });

  it('marks the morning after the wake window as ended, not 2 AM', () => {
    expect(scheduleWindowFlags(bedtime, wakeTime, { hours: 2, minutes: 0 }).wakeWindowEnded).toBe(
      false,
    );
    expect(scheduleWindowFlags(bedtime, wakeTime, { hours: 8, minutes: 0 }).wakeWindowEnded).toBe(
      true,
    );
  });

  it('does not wrap a too-short night into an all-day readiness window', () => {
    const flags = scheduleWindowFlags(
      { hours: 23, minutes: 0 },
      { hours: 0, minutes: 30 },
      { hours: 12, minutes: 0 },
    );
    expect(flags.inReadinessWindow).toBe(false);
  });

  it('returns no windows when the schedule is incomplete', () => {
    expect(
      scheduleWindowFlags(null, wakeTime, { hours: 23, minutes: 30 }).inReadinessWindow,
    ).toBe(false);
  });
});
