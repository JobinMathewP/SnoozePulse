import type { Result } from '@/repositories';
import type { LocalTimeOfDay, SleepSchedule } from '@/types';

/**
 * Bedtime, wake time, and the automatic-tracking opt-in (ADR-31).
 *
 * Wraps `ISettingsRepository` and owns the key names plus `"HH:mm"` coercion so
 * callers never see raw KV strings (ADR-19). Contains no SQL. Default automatic
 * tracking is off; missing keys are not written until the user sets them.
 */
export interface ISleepScheduleService {
  /** Load the schedule. Missing keys resolve to no times and automatic tracking off. */
  getSchedule(): Promise<Result<SleepSchedule>>;

  /**
   * Persist local bedtime. `null` clears the stored value so the schedule is
   * treated as unset.
   */
  setBedtime(time: LocalTimeOfDay | null): Promise<Result<void>>;

  /**
   * Persist local wake time. `null` clears the stored value so the schedule is
   * treated as unset.
   */
  setWakeTime(time: LocalTimeOfDay | null): Promise<Result<void>>;

  /**
   * Persist the explicit automatic-tracking opt-in. Passing `false` stores `"false"`
   * (or leaves the default-off read) — it never silently flips to `true`.
   */
  setAutomaticTrackingEnabled(enabled: boolean): Promise<Result<void>>;
}
