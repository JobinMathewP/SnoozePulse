import type { AppError, IsoDate, LocalTimeOfDay, MissedNightReason } from '@/types';
import { BATTERY_OVERNIGHT_READY_THRESHOLD, BATTERY_SAVE_THRESHOLD, toIsoDateLocal } from '@/utils';

import { READINESS } from './readiness/readinessConstants';
import {
  addMinutesToClock,
  isOnForwardArc,
  localTimeOfDayFromDate,
  minutesFromMidnight,
  scheduleWindowFlags,
} from './readiness/readinessWindows';

/** Hours before bedtime (on top of the 30-minute readiness lead) to surface the charger reminder. */
export const CHARGER_REMINDER_LEAD_MINUTES = 180;

/**
 * Highest charge that still warrants the unplugged reminder. Above this, Battery Ready
 * is already the honest story. At or below {@link BATTERY_SAVE_THRESHOLD} the Battery
 * Low card owns the plug-in message.
 */
export const CHARGER_REMINDER_MAX_LEVEL = BATTERY_OVERNIGHT_READY_THRESHOLD;

/**
 * Wake-morning calendar date for the sleep night that contains `now`.
 * Example: 11:30 PM Aug 20 / 2:00 AM Aug 21 with a 7:00 AM wake → `2026-08-21`.
 */
export function sleepNightIso(
  now: Date,
  bedtime: LocalTimeOfDay | null,
  wakeTime: LocalTimeOfDay | null,
): IsoDate {
  const today = toIsoDateLocal(now.getTime());
  if (bedtime === null || wakeTime === null) {
    return today;
  }
  const clock = localTimeOfDayFromDate(now);
  const flags = scheduleWindowFlags(bedtime, wakeTime, clock);
  const nowM = minutesFromMidnight(clock);
  const wakeEnd = addMinutesToClock(
    minutesFromMidnight(wakeTime),
    READINESS.WAKE_LAG_MINUTES,
  );
  if (flags.inReadinessWindow && nowM > wakeEnd) {
    return addCalendarDays(today, 1);
  }
  return today;
}

export function missedReasonFromStartError(error: AppError): MissedNightReason {
  if (error.code === 'PERMISSION_DENIED') {
    return 'microphone';
  }
  return 'engine';
}

export function shouldShowChargerReminder(args: {
  readonly automaticTrackingEnabled: boolean;
  readonly charging: boolean;
  readonly isRecording: boolean;
  readonly batteryLevel: number;
  readonly bedtime: LocalTimeOfDay | null;
  readonly wakeTime: LocalTimeOfDay | null;
  readonly now: Date;
}): boolean {
  const {
    automaticTrackingEnabled,
    charging,
    isRecording,
    batteryLevel,
    bedtime,
    wakeTime,
    now,
  } = args;
  if (!automaticTrackingEnabled || charging || isRecording) {
    return false;
  }
  if (batteryLevel < 0 || batteryLevel <= BATTERY_SAVE_THRESHOLD) {
    return false;
  }
  if (batteryLevel > CHARGER_REMINDER_MAX_LEVEL) {
    return false;
  }
  if (bedtime === null || wakeTime === null) {
    return false;
  }
  const clock = localTimeOfDayFromDate(now);
  const flags = scheduleWindowFlags(bedtime, wakeTime, clock);
  if (flags.inReadinessWindow || flags.inWakeWindow) {
    return true;
  }
  const nowM = minutesFromMidnight(clock);
  const bedtimeM = minutesFromMidnight(bedtime);
  const readinessStart = addMinutesToClock(bedtimeM, -READINESS.BEDTIME_LEAD_MINUTES);
  const reminderStart = addMinutesToClock(
    readinessStart,
    -CHARGER_REMINDER_LEAD_MINUTES,
  );
  const reminderEnd = addMinutesToClock(readinessStart, -1);
  return isOnForwardArc(nowM, reminderStart, reminderEnd);
}

function addCalendarDays(iso: IsoDate, days: number): IsoDate {
  const [year, month, day] = iso.split('-').map((part) => Number.parseInt(part, 10));
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toIsoDateLocal(date.getTime());
}
