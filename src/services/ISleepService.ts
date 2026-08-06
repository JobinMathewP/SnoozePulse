import type {
  CalibrationResult,
  MicrophonePermissionStatus,
  Page,
  PageRequest,
  SleepSession,
} from '@/types';

import type { Result } from '@/repositories';

/**
 * Whether Home may offer "Start sleep session".
 *
 * Battery is observed by the UI via `expo-battery` later; this contract covers the two
 * checks `ISleepService` owns: microphone permission and ambient calibration.
 */
export interface SessionReadiness {
  readonly microphone: MicrophonePermissionStatus;
  /** Null until the user has run calibration at least once this launch. */
  readonly calibration: CalibrationResult | null;
  /** True only when microphone is granted and a calibration result exists. */
  readonly ready: boolean;
}

/** Outcome of applying the 30-day / 500 MB retention policy (ADR-15). */
export interface RetentionCleanup {
  /** Snippet files deleted because they were older than 30 days. */
  readonly deletedExpiredCount: number;
  /** Snippet files deleted to bring total size under 500 MB. */
  readonly deletedOverQuotaCount: number;
  /** Bytes occupied by remaining snippets after cleanup. */
  readonly remainingBytes: number;
}

/**
 * Session CRUD, readiness, and snippet retention.
 *
 * Orchestrates repositories and the audio engine's calibration entry point. Contains no
 * SQL (ADR-19). Retention is 30 days or 500 MB, whichever comes first (ADR-15).
 */
export interface ISleepService {
  /** Current readiness for starting a session. Does not prompt or calibrate. */
  checkReadiness(): Promise<Result<SessionReadiness>>;

  /** Run ambient calibration via the engine and remember the result for this launch. */
  calibrateAmbient(): Promise<Result<CalibrationResult>>;

  getSession(id: string): Promise<Result<SleepSession>>;

  /** Paginated history, newest first. */
  listSessions(request: PageRequest): Promise<Result<Page<SleepSession>>>;

  /**
   * Delete a session and everything that belongs to it (events, buckets, snippets).
   * Cascades through the repository; this method decides *that* deletion is allowed.
   */
  deleteSession(id: string): Promise<Result<void>>;

  /**
   * Enforce snippet retention: 30 days or 500 MB, whichever limit is hit first (ADR-15).
   * Safe to call at app start and after each completed session.
   */
  enforceRetention(): Promise<Result<RetentionCleanup>>;

  /**
   * Delete snippet files on disk that no longer have a matching session or event row.
   * Returns the number of files removed. Called at app start after a possible crash.
   */
  reclaimOrphanedSnippets(): Promise<Result<number>>;
}
