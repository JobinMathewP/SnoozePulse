import {
  morningFireAt,
  sessionIdFromNotificationData,
  summaryNotificationTrigger,
} from '@/services/notifications/morningFireAt';

const BEDTIME = { hours: 23, minutes: 30 };
const WAKE = { hours: 7, minutes: 0 };

function at(hours: number, minutes: number): Date {
  const now = new Date(2026, 7, 21, hours, minutes, 0, 0);
  return now;
}

describe('morningFireAt', () => {
  it('fires immediately at the end of the wake window', () => {
    const now = at(8, 0);
    expect(morningFireAt(BEDTIME, WAKE, now).getTime()).toBe(now.getTime());
  });

  it('fires immediately during the wake window', () => {
    const now = at(7, 0);
    expect(morningFireAt(BEDTIME, WAKE, now).getTime()).toBe(now.getTime());
  });

  it('schedules the wake-window end later the same morning', () => {
    const now = at(2, 0);
    const fireAt = morningFireAt(BEDTIME, WAKE, now);
    expect(fireAt.getHours()).toBe(7);
    expect(fireAt.getMinutes()).toBe(30);
    expect(fireAt.getDate()).toBe(now.getDate());
  });

  it('schedules the next morning when saved before midnight', () => {
    const now = at(23, 50);
    const fireAt = morningFireAt(BEDTIME, WAKE, now);
    expect(fireAt.getHours()).toBe(7);
    expect(fireAt.getMinutes()).toBe(30);
    expect(fireAt.getDate()).toBe(now.getDate() + 1);
  });

  it('fires immediately when no wake time is configured', () => {
    const now = at(2, 0);
    expect(morningFireAt(BEDTIME, null, now).getTime()).toBe(now.getTime());
  });
});

describe('summaryNotificationTrigger', () => {
  it('presents immediately when fireAt is now', () => {
    const now = at(8, 0);
    expect(summaryNotificationTrigger(now, now)).toBeNull();
  });

  it('uses a DATE trigger when fireAt is in the future', () => {
    const now = at(2, 0);
    const fireAt = at(7, 30);
    expect(summaryNotificationTrigger(fireAt, now)).toEqual({ type: 'date', date: fireAt });
  });
});

describe('sessionIdFromNotificationData', () => {
  it('reads a string session id', () => {
    expect(sessionIdFromNotificationData({ sessionId: 'abc' })).toBe('abc');
  });

  it('rejects missing or non-string ids', () => {
    expect(sessionIdFromNotificationData(undefined)).toBeNull();
    expect(sessionIdFromNotificationData({ sessionId: 1 })).toBeNull();
    expect(sessionIdFromNotificationData({ sessionId: '' })).toBeNull();
  });
});
