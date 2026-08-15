/**
 * Business-logic contracts, SQLite client, and service implementations (Tasks 4.1–4.3).
 *
 * Services own orchestration, scoring, retention, and the recording lifecycle. They never
 * contain query SQL (ADR-19) — schema DDL lives only under `database/` for migrations.
 * The store depends on service interfaces only — never on repositories or the native engine
 * directly (ADR-12, ADR-18).
 */

export type { IAudioService, SnippetPlaybackStatus } from './IAudioService';
export type { ISleepService, RetentionCleanup, SessionReadiness } from './ISleepService';
export type { IAnalyticsService } from './IAnalyticsService';
export type { ISnippetStorage } from './ISnippetStorage';
export type { IProfileService } from './IProfileService';
export type { IReviewService } from './IReviewService';

export { AudioService } from './AudioService';
export { SleepService } from './SleepService';
export { ExpoSnippetStorage } from './ExpoSnippetStorage';
export { FakeAudioEngine } from './fakes/FakeAudioEngine';
export { AnalyticsService } from './analytics';
export { ProfileService } from './ProfileService';
export { ReviewService, type ReviewPrompter } from './ReviewService';

export {
  DATABASE_VERSION,
  ensureDatabase,
  getDatabaseClient,
  migrateDatabase,
  resetDatabaseClientForTests,
  type DatabaseClient,
} from './database';
