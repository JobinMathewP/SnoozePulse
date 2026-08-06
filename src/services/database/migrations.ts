/**
 * Forward-only schema migrations driven by `PRAGMA user_version` (PRD §5 Storage).
 *
 * Version 1 creates the three-table schema. Later versions append `if (from === n)` blocks
 * only — never edit a prior migration body after it has shipped.
 */

import type { SQLiteDatabase } from 'expo-sqlite';

/** Latest schema version applied by this app build. */
export const DATABASE_VERSION = 1;

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
 * Apply any pending migrations. Safe to call on every open: already-applied versions are
 * skipped via `user_version`, so opening twice does not re-run DDL.
 */
export async function migrateDatabase(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let current = row?.user_version ?? 0;

  if (current >= DATABASE_VERSION) {
    return current;
  }

  if (current === 0) {
    await db.execAsync(MIGRATION_V1);
    current = 1;
  }

  // Future: if (current === 1) { ...; current = 2; }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  return DATABASE_VERSION;
}
