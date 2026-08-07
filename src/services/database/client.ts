/**
 * Async singleton SQLite client (Task 4.1).
 *
 * Injectable for repositories and services — not accessed via `SQLiteProvider` /
 * `useSQLiteContext`, which would leak the database into the React tree (roadmap Phase 15,
 * ADR-12). Concrete construction of repositories stays in the composition root (Task 4.4).
 */

import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_VERSION, migrateDatabase } from './migrations';

const DATABASE_NAME = 'snoozepulse.db';

/** Opaque handle injected into repositories. Same surface as expo-sqlite's async API. */
export type DatabaseClient = SQLiteDatabase;

let clientPromise: Promise<DatabaseClient> | null = null;

async function configureConnection(db: DatabaseClient): Promise<void> {
  // WAL and foreign_keys are per-connection; set them on every open.
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');
}

async function openAndMigrate(): Promise<DatabaseClient> {
  const db = await openDatabaseAsync(DATABASE_NAME);
  await configureConnection(db);
  const userVersion = await migrateDatabase(db);
  await logSchema(db, userVersion);
  return db;
}

async function logSchema(db: DatabaseClient, userVersion: number): Promise<void> {
  const tables = await db.getAllAsync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
  );
  const names = tables.map((table) => table.name);
  console.log(
    `[database] ready user_version=${userVersion} (target=${DATABASE_VERSION}) tables=[${names.join(', ')}]`,
  );
}

/**
 * Open the app database once. Concurrent callers share the same promise, so migrations
 * never run twice for a process lifetime.
 */
export function ensureDatabase(): Promise<DatabaseClient> {
  if (clientPromise === null) {
    clientPromise = openAndMigrate();
  }
  return clientPromise;
}

/**
 * Alias for injection sites that want a getter named like other factories.
 * Identical to {@link ensureDatabase}.
 */
export function getDatabaseClient(): Promise<DatabaseClient> {
  return ensureDatabase();
}

/** Test-only: drop the cached promise so the next open re-runs configure + migrate checks. */
export function resetDatabaseClientForTests(): void {
  clientPromise = null;
}
