import type { LocalTimeOfDay } from '@/types';

/** Picker starting point when bedtime has never been set. Matches the PRD example. */
export const DEFAULT_BEDTIME: LocalTimeOfDay = { hours: 23, minutes: 30 };

/** Picker starting point when wake time has never been set. Matches the PRD example. */
export const DEFAULT_WAKE_TIME: LocalTimeOfDay = { hours: 7, minutes: 0 };

/**
 * Format a local wall-clock time for Settings, e.g. `11:30 PM`.
 * This is display-only — storage stays 24-hour {@link LocalTimeOfDay}.
 */
export function formatLocalTimeDisplay(time: LocalTimeOfDay): string {
  const period = time.hours >= 12 ? 'PM' : 'AM';
  const hour12 = time.hours % 12 === 0 ? 12 : time.hours % 12;
  const minutes = String(time.minutes).padStart(2, '0');
  return `${hour12}:${minutes} ${period}`;
}

export type DayPeriod = 'am' | 'pm';

export type TwelveHourTime = {
  readonly hour12: number;
  readonly minutes: number;
  readonly period: DayPeriod;
};

export function toTwelveHour(time: LocalTimeOfDay): TwelveHourTime {
  return {
    hour12: time.hours % 12 === 0 ? 12 : time.hours % 12,
    minutes: time.minutes,
    period: time.hours >= 12 ? 'pm' : 'am',
  };
}

export function toTwentyFour(time: TwelveHourTime): LocalTimeOfDay {
  const hour12 = time.hour12 === 12 ? 0 : time.hour12;
  return {
    hours: time.period === 'pm' ? hour12 + 12 : hour12,
    minutes: time.minutes,
  };
}
