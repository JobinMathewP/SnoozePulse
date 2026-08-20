import type { Result } from './result';

/**
 * Persistence for the key-value `app_settings` table (ADR-30).
 *
 * SQL and row mapping only — no business rules (ADR-19). Callers are services such as
 * `ProfileService`, `ReviewService`, and `SleepScheduleService`; the store never talks
 * to this repository directly (ADR-12). Values are stored as opaque strings; typed
 * coercion belongs to the service.
 */
export interface ISettingsRepository {
  /** Read one setting by key. Resolves to `null` when the key has never been written. */
  get(key: string): Promise<Result<string | null>>;

  /** Insert or replace one setting. */
  set(key: string, value: string): Promise<Result<void>>;

  /** Remove one setting. Succeeds even when the key is absent. */
  remove(key: string): Promise<Result<void>>;
}
