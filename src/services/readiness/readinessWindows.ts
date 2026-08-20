import type { LocalTimeOfDay } from '@/types';

import { READINESS } from './readinessConstants';

const MINUTES_PER_DAY = 24 * 60;

export function minutesFromMidnight(time: LocalTimeOfDay): number {
  return time.hours * 60 + time.minutes;
}

export function addMinutesToClock(baseMinutes: number, delta: number): number {
  return ((baseMinutes + delta) % MINUTES_PER_DAY + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

export function localTimeOfDayFromDate(date: Date): LocalTimeOfDay {
  return { hours: date.getHours(), minutes: date.getMinutes() };
}

/** Minutes walking forward from `from` to `to` on a 24h clock (0 when equal). */
export function forwardMinutes(from: number, to: number): number {
  return (to - from + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

/**
 * Inclusive circular window on a 24h clock. When `start === end` the window is a
 * single minute. When start > end the window wraps midnight (e.g. 23:00–00:30).
 */
export function isInClosedWindow(nowMinutes: number, start: number, end: number): boolean {
  if (start <= end) {
    return nowMinutes >= start && nowMinutes <= end;
  }
  return nowMinutes >= start || nowMinutes <= end;
}

/**
 * Inclusive arc walking forward from `start` to `end`. Unlike {@link isInClosedWindow},
 * this never treats an inverted short span as "almost the whole day".
 */
export function isOnForwardArc(nowMinutes: number, start: number, end: number): boolean {
  const span = forwardMinutes(start, end);
  if (span === 0) {
    return nowMinutes === start;
  }
  return forwardMinutes(start, nowMinutes) <= span;
}

export type ScheduleWindowFlags = {
  readonly inReadinessWindow: boolean;
  readonly inWakeWindow: boolean;
  readonly wakeWindowEnded: boolean;
};

/**
 * Map local wall-clock `now` onto the configured sleep schedule using {@link READINESS}
 * offsets. Returns all-false when bedtime or wake is missing.
 */
export function scheduleWindowFlags(
  bedtime: LocalTimeOfDay | null,
  wakeTime: LocalTimeOfDay | null,
  now: LocalTimeOfDay,
): ScheduleWindowFlags {
  if (bedtime === null || wakeTime === null) {
    return {
      inReadinessWindow: false,
      inWakeWindow: false,
      wakeWindowEnded: false,
    };
  }

  const nowM = minutesFromMidnight(now);
  const bedtimeM = minutesFromMidnight(bedtime);
  const wakeM = minutesFromMidnight(wakeTime);

  const readinessStart = addMinutesToClock(bedtimeM, -READINESS.BEDTIME_LEAD_MINUTES);
  const wakeStart = addMinutesToClock(wakeM, -READINESS.WAKE_LEAD_MINUTES);
  const wakeEnd = addMinutesToClock(wakeM, READINESS.WAKE_LAG_MINUTES);
  const readinessEnd = addMinutesToClock(
    wakeStart,
    -READINESS.READINESS_CLOSE_BEFORE_WAKE_WINDOW_MINUTES,
  );

  // Empty the window when 2h-before-wake is not strictly before the wake window
  // on the sleep arc (e.g. a 2-hour night would otherwise wrap ~24h).
  const toWake = forwardMinutes(readinessStart, wakeStart);
  const toEnd = forwardMinutes(readinessStart, readinessEnd);
  const windowOpen = toEnd < toWake;
  const inReadinessWindow = windowOpen && isOnForwardArc(nowM, readinessStart, readinessEnd);

  const inWakeWindow = isInClosedWindow(nowM, wakeStart, wakeEnd);
  const afterWakeBeforeReadiness = isOnForwardArc(
    nowM,
    addMinutesToClock(wakeEnd, 1),
    addMinutesToClock(readinessStart, -1),
  );

  return {
    inReadinessWindow,
    inWakeWindow,
    wakeWindowEnded: afterWakeBeforeReadiness && !inReadinessWindow && !inWakeWindow,
  };
}
