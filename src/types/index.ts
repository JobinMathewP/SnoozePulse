/**
 * Domain vocabulary for SnoozePulse.
 *
 * This folder is types only: no enums, no const objects, no helper functions, no runtime
 * values of any kind. Everything here erases completely at compile time, which is why
 * unions of string literals are used where an enum would otherwise be natural.
 *
 * The barrel re-exports exclusively via `export type`, so even under `isolatedModules` /
 * `verbatimModuleSyntax` an importer that writes `import { SleepSession } from '@/types'`
 * pulls in a type and never a value. Implementations live elsewhere:
 *
 *   src/native/        — IAudioEngine (Task 1.6)
 *   src/repositories/  — ISleepRepository, ISnoreRepository
 *   src/services/      — IAudioService, ISleepService, IAnalyticsService
 *   src/store/         — Zustand store and composition root
 *
 * Module map:
 *
 *   common.ts     — shared primitives (EpochMs, Page, DateRange)
 *   session.ts    — state machine and sleep_sessions row shape
 *   audio.ts      — native events, calibration, interruptions
 *   analytics.ts  — session_buckets, scores, Summary / History models
 *   errors.ts     — discriminated AppError union
 *   sqlite.ts     — SQLite row shapes (repository boundary only)
 */

export type {
  DateRange,
  EpochMs,
  IsoDate,
  Page,
  PageRequest,
} from './common';

export type {
  ActiveSessionState,
  NewSleepSession,
  SessionState,
  SessionTransitionMap,
  SleepSession,
  SleepSessionCompletion,
  TerminalSessionState,
} from './session';

export type {
  AmbientEnvironment,
  AudioInterruptionEvent,
  AudioInterruptionReason,
  AudioLevelEvent,
  CalibrationResult,
  MicrophonePermissionStatus,
  SnoreEvent,
} from './audio';

export type {
  DailyScoreSummary,
  MetricDelta,
  PeriodComparison,
  ScoreInputs,
  SessionBucket,
  SessionSummary,
  SleepScore,
  SnoreScore,
  SnoreScoreBand,
  TrendPeriod,
} from './analytics';

export type {
  AppError,
  AppErrorCode,
  AudioBusyError,
  AudioEngineError,
  CalibrationError,
  IllegalTransitionError,
  NotFoundError,
  PermissionError,
  PersistenceError,
  StorageQuotaError,
} from './errors';

export type { SessionBucketRow, SleepSessionRow, SnoreEventRow } from './sqlite';
