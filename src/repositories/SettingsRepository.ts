import type { SQLiteDatabase } from 'expo-sqlite';

import type { ISettingsRepository } from './ISettingsRepository';
import type { Result } from './result';
import { mapPersistence } from './resultHelpers';

/**
 * SQLite implementation of {@link ISettingsRepository} over the `app_settings` KV table.
 * Constructed at the composition root with an injected database client (ADR-18).
 */
export class SettingsRepository implements ISettingsRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async get(key: string): Promise<Result<string | null>> {
    return mapPersistence(async () => {
      const row = await this.db.getFirstAsync<{ value: string | null }>(
        'SELECT value FROM app_settings WHERE key = ?',
        key,
      );
      return row?.value ?? null;
    });
  }

  async set(key: string, value: string): Promise<Result<void>> {
    return mapPersistence(async () => {
      // Upsert so callers never have to distinguish first-write from overwrite.
      await this.db.runAsync(
        `INSERT INTO app_settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        key,
        value,
      );
    });
  }

  async remove(key: string): Promise<Result<void>> {
    return mapPersistence(async () => {
      await this.db.runAsync('DELETE FROM app_settings WHERE key = ?', key);
    });
  }
}
