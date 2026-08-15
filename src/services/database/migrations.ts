/**
 * Forward-only schema migrations driven by `PRAGMA user_version` (PRD §5 Storage).
 *
 * Version 1 creates the three-table schema. Version 2 (Task 6.5 / ADR-26) adds the
 * classifier-driven columns to `snore_events`, adds `score_version` to `sleep_sessions`,
 * and destructively wipes every V1 row — pre-M6 sessions cannot be re-scored with the V2
 * signals, so keeping them would silently mix incompatible scores. Version 3 (ADR-30) adds
 * a key-value `app_settings` table for the display name, onboarding flag, and rating-prompt
 * bookkeeping — additive only, so it never disturbs recorded nights.
 *
 * Later versions append `if (current === n)` blocks only — never edit a prior migration
 * body after it has shipped.
 */

import type { SQLiteDatabase } from 'expo-sqlite';

/** Latest schema version applied by this app build. */
export const DATABASE_VERSION = 3;

const MIGRATION_V1 = `
CREATE TABLE IF NOT EXISTS sleep_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  state TEXT NOT NULL,
  ambient_baseline_db REAL NOT NULL,
  snore_count INTEGER NOT NULL DEFAULT 0,
  total_snoring_ms INTEGER NOT NULL DEFAULT 0,
  peak_db REAL NOT NULL DEFAULT 0,
  peak_at INTEGER,
  sleep_score REAL,
  snore_score REAL
);

CREATE TABLE IF NOT EXISTS snore_events (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  peak_db REAL NOT NULL,
  audio_path TEXT,
  FOREIGN KEY (session_id) REFERENCES sleep_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS snore_events_session_timestamp
  ON snore_events(session_id, timestamp);

CREATE TABLE IF NOT EXISTS session_buckets (
  session_id TEXT NOT NULL,
  bucket_start INTEGER NOT NULL,
  average_db REAL NOT NULL,
  peak_db REAL NOT NULL,
  snoring_ms INTEGER NOT NULL,
  PRIMARY KEY (session_id, bucket_start),
  FOREIGN KEY (session_id) REFERENCES sleep_sessions(id) ON DELETE CASCADE
);
`;

/**
 * V2 migration — classifier-driven schema and destructive wipe (ADR-26).
 *
 * SQLite does not allow multiple ADD COLUMNs in one ALTER TABLE, so each column ships as
 * its own statement. The DELETE order respects foreign keys even though ON DELETE CASCADE
 * would collapse dependents automatically — explicit deletes keep the migration diffable.
 *
 * Snippet files under the documents directory are reclaimed by the boot-time
 * `SleepService.reclaimOrphanedSnippets()` sweep immediately after this migration runs
 * (see `createContainer`): every event row is gone, so every snippet becomes an orphan
 * and gets deleted on the first launch after upgrade.
 */
const MIGRATION_V2 = `
ALTER TABLE snore_events ADD COLUMN confidence REAL NOT NULL DEFAULT 0;
ALTER TABLE snore_events ADD COLUMN class_label TEXT NOT NULL DEFAULT 'snoring';
ALTER TABLE snore_events ADD COLUMN spectral_peak_hz REAL;
ALTER TABLE sleep_sessions ADD COLUMN score_version INTEGER NOT NULL DEFAULT 2;

DELETE FROM session_buckets;
DELETE FROM snore_events;
DELETE FROM sleep_sessions;
`;

/**
 * V3 migration — key-value app settings (ADR-30).
 *
 * Additive: a single new table for small scalar preferences (display name, onboarding
 * flag, rating-prompt bookkeeping). Unlike V2 this migration is non-destructive — recorded
 * sessions are preserved across the public-release upgrade so a user's history survives.
 */
const MIGRATION_V3 = `
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT
);
`;

/**
 * Apply any pending migrations. Safe to call on every open: already-applied versions are
 * skipped via `user_version`, so opening twice does not re-run DDL.
 *
 * Each version's DDL is wrapped in `withTransactionAsync` so a partial upgrade cannot
 * leave the database with new columns but unmoved data.
 */
export async function migrateDatabase(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let current = row?.user_version ?? 0;

  if (current >= DATABASE_VERSION) {
    return current;
  }

  if (current === 0) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATION_V1);
    });
    current = 1;
  }

  if (current === 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATION_V2);
    });
    current = 2;
  }

  if (current === 2) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATION_V3);
    });
    current = 3;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  return DATABASE_VERSION;
}
