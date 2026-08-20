/**
 * Sleep schedule preferences for automatic tracking (ADR-31).
 *
 * Times are **local wall-clock**, not UTC instants. `23:30` means 11:30 PM on the
 * device's current local calendar, including after travel or DST. Serialised to
 * `app_settings` as zero-padded `"HH:mm"`.
 */

/**
 * A time of day on the device's local clock.
 *
 * `hours` is 0–23, `minutes` is 0–59. This is not an epoch and must never be
 * converted through `Date.UTC` for storage.
 */
export interface LocalTimeOfDay {
  readonly hours: number;
  readonly minutes: number;
}

/**
 * Persisted sleep schedule. Missing keys mean "not configured yet" / automatic
 * tracking off — never an implicit opt-in.
 */
export interface SleepSchedule {
  /** Expected bedtime, or `null` when the user has not set one. */
  readonly bedtime: LocalTimeOfDay | null;
  /** Expected wake time, or `null` when the user has not set one. */
  readonly wakeTime: LocalTimeOfDay | null;
  /** Explicit opt-in. `false` when the key is missing. */
  readonly automaticTrackingEnabled: boolean;
}
