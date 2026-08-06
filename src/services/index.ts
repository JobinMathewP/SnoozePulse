/**
 * Business-logic contracts and the SQLite client (Task 4.1).
 *
 * Services own orchestration, scoring, retention, and the recording lifecycle. They never
 * contain query SQL (ADR-19) — schema DDL lives only under `database/` for migrations.
 * The store depends on service interfaces only — never on repositories or the native engine
 * directly (ADR-12, ADR-18).
 */

export type { IAudioService } from './IAudioService';
export type { ISleepService, RetentionCleanup, SessionReadiness } from './ISleepService';
export type { IAnalyticsService } from './IAnalyticsService';

export {
  DATABASE_VERSION,
  ensureDatabase,
  getDatabaseClient,
  migrateDatabase,
  resetDatabaseClientForTests,
  type DatabaseClient,
} from './database';
