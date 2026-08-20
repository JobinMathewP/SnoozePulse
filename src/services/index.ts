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
export type { ISleepScheduleService } from './ISleepScheduleService';
export type { IReadinessService, ReadinessEvaluateInput } from './readiness';
export type {
  IEnvironmentMonitor,
  IInteractionMonitor,
  IMotionMonitor,
  IReadinessSignals,
} from './readiness';
export type { BatterySnapshot, IBatteryMonitor } from './battery/IBatteryMonitor';
export type {
  AnnounceCompletedSessionInput,
  INotificationService,
} from './notifications';

export { AudioService } from './AudioService';
export { SleepService } from './SleepService';
export { ExpoSnippetStorage } from './ExpoSnippetStorage';
export { FakeAudioEngine } from './fakes/FakeAudioEngine';
export { FakeBatteryMonitor } from './fakes/FakeBatteryMonitor';
export { FakeNotificationService } from './fakes/FakeNotificationService';
export { FakeReadinessSignals } from './fakes/FakeReadinessSignals';
export { ExpoBatteryMonitor } from './battery/ExpoBatteryMonitor';
export { ExpoNotificationService } from './notifications';
export { AnalyticsService } from './analytics';
export { ProfileService } from './ProfileService';
export { ReviewService, type ReviewPrompter } from './ReviewService';
export { SleepScheduleService } from './SleepScheduleService';
export {
  READINESS,
  ReadinessService,
  ReadinessSignals,
  StubMotionMonitor,
  UnknownEnvironmentMonitor,
  canTransitionReadiness,
  createReadinessSignals,
  reduceReadiness,
  toEvaluateFlags,
} from './readiness';

export {
  DATABASE_VERSION,
  ensureDatabase,
  getDatabaseClient,
  migrateDatabase,
  resetDatabaseClientForTests,
  type DatabaseClient,
} from './database';
