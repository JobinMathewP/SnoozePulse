import type { ISettingsRepository, Result } from '@/repositories';
import { err, ok, persistenceError } from '@/repositories';
import type { LocalTimeOfDay, SleepSchedule } from '@/types';

import type { ISleepScheduleService } from './ISleepScheduleService';

/** `app_settings` keys owned by the sleep schedule (ADR-31). Kept private to this module. */
const KEY_BEDTIME = 'schedule.bedtime';
const KEY_WAKE_TIME = 'schedule.wakeTime';
const KEY_AUTOMATIC_TRACKING = 'schedule.automaticTrackingEnabled';

/**
 * Reads and writes the sleep schedule via the KV settings repository.
 *
 * Times are stored as local wall-clock `"HH:mm"` (see {@link LocalTimeOfDay}). Boolean
 * coercion for the opt-in lives here, not in the repository (ADR-19).
 */
export class SleepScheduleService implements ISleepScheduleService {
  constructor(private readonly settingsRepository: ISettingsRepository) {}

  async getSchedule(): Promise<Result<SleepSchedule>> {
    const bedtimeResult = await this.settingsRepository.get(KEY_BEDTIME);
    if (!bedtimeResult.ok) {
      return bedtimeResult;
    }
    const wakeResult = await this.settingsRepository.get(KEY_WAKE_TIME);
    if (!wakeResult.ok) {
      return wakeResult;
    }
    const autoResult = await this.settingsRepository.get(KEY_AUTOMATIC_TRACKING);
    if (!autoResult.ok) {
      return autoResult;
    }

    return ok({
      bedtime: parseLocalTime(bedtimeResult.value),
      wakeTime: parseLocalTime(wakeResult.value),
      automaticTrackingEnabled: autoResult.value === 'true',
    });
  }

  setBedtime(time: LocalTimeOfDay | null): Promise<Result<void>> {
    return this.writeTime(KEY_BEDTIME, time);
  }

  setWakeTime(time: LocalTimeOfDay | null): Promise<Result<void>> {
    return this.writeTime(KEY_WAKE_TIME, time);
  }

  setAutomaticTrackingEnabled(enabled: boolean): Promise<Result<void>> {
    return this.settingsRepository.set(KEY_AUTOMATIC_TRACKING, enabled ? 'true' : 'false');
  }

  private writeTime(key: string, time: LocalTimeOfDay | null): Promise<Result<void>> {
    if (time === null) {
      return this.settingsRepository.remove(key);
    }
    const encoded = encodeLocalTime(time);
    if (encoded === null) {
      return Promise.resolve(
        err(persistenceError('Sleep schedule time must be a local HH:mm on a 24-hour clock.')),
      );
    }
    return this.settingsRepository.set(key, encoded);
  }
}

/** Encode a valid local time as zero-padded `"HH:mm"`. `null` when out of range. */
function encodeLocalTime(time: LocalTimeOfDay): string | null {
  if (!isValidLocalTime(time.hours, time.minutes)) {
    return null;
  }
  const hours = String(time.hours).padStart(2, '0');
  const minutes = String(time.minutes).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** Parse a stored `"HH:mm"` string. Unknown or corrupt values are treated as unset. */
function parseLocalTime(raw: string | null): LocalTimeOfDay | null {
  if (raw === null) {
    return null;
  }
  const match = /^(\d{2}):(\d{2})$/.exec(raw);
  if (match === null) {
    return null;
  }
  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (!isValidLocalTime(hours, minutes)) {
    return null;
  }
  return { hours, minutes };
}

function isValidLocalTime(hours: number, minutes: number): boolean {
  return (
    Number.isInteger(hours) &&
    Number.isInteger(minutes) &&
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59
  );
}
