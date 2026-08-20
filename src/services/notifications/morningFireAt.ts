import type { LocalTimeOfDay } from '@/types';

import { READINESS } from '@/services/readiness/readinessConstants';
import {
  addMinutesToClock,
  localTimeOfDayFromDate,
  minutesFromMidnight,
  scheduleWindowFlags,
} from '@/services/readiness/readinessWindows';

/**
 * When the morning Summary notification should fire for a session saved at `now`.
 *
 * During or after the wake window, fire immediately. Earlier (battery save, manual
 * end before morning) waits until the end of that window so the banner is actually
 * a morning notification.
 */
export function morningFireAt(
  bedtime: LocalTimeOfDay | null,
  wakeTime: LocalTimeOfDay | null,
  now: Date,
): Date {
  if (wakeTime === null) {
    return now;
  }

  const flags = scheduleWindowFlags(bedtime, wakeTime, localTimeOfDayFromDate(now));
  if (flags.inWakeWindow || flags.wakeWindowEnded) {
    return now;
  }

  const wakeEndMinutes = addMinutesToClock(
    minutesFromMidnight(wakeTime),
    READINESS.WAKE_LAG_MINUTES,
  );
  const candidate = dateAtClock(now, wakeEndMinutes);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate;
}

/** `null` means present now; otherwise fire once at `date` (exact alarm on Android). */
export type SummaryNotificationTrigger = { readonly type: 'date'; readonly date: Date } | null;

export function summaryNotificationTrigger(
  fireAt: Date,
  now: Date,
): SummaryNotificationTrigger {
  if (fireAt.getTime() <= now.getTime()) {
    return null;
  }
  return { type: 'date', date: fireAt };
}

export function sessionIdFromNotificationData(
  data: Record<string, unknown> | undefined,
): string | null {
  const value = data?.sessionId;
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function dateAtClock(base: Date, minutesFromMidnightValue: number): Date {
  const next = new Date(base.getTime());
  next.setHours(Math.floor(minutesFromMidnightValue / 60), minutesFromMidnightValue % 60, 0, 0);
  return next;
}
