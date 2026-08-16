import type {
  EpochMs,
  NewSleepSession,
  Page,
  PageRequest,
  SessionBucket,
  SleepSession,
  SleepSessionCompletion,
} from '@/types';

import type { Result } from './result';

/**
 * Persistence for `sleep_sessions` and `session_buckets`.
 *
 * SQL and row-to-model mapping only — no scoring, retention policy, or state-machine rules
 * (ADR-19). `deleteSession` cascades rows via FK and returns orphaned snippet paths so a
 * service can delete files; the repository never touches the filesystem.
 */
export interface ISleepRepository {
  /** Insert a row at session start. Accumulated fields begin at their zero defaults. */
  createSession(session: NewSleepSession): Promise<Result<SleepSession>>;

  /** Write completion totals and the terminal state when recording ends. */
  finishSession(
    id: string,
    completion: SleepSessionCompletion,
  ): Promise<Result<SleepSession>>;

  /** Fetch one session by id. Returns `NOT_FOUND` when missing. */
  getSession(id: string): Promise<Result<SleepSession>>;

  /**
   * Paginated history listing, newest first.
   * Required because a year of nights is several hundred rows (api-contracts.md).
   */
  listSessions(request: PageRequest): Promise<Result<Page<SleepSession>>>;

  /**
   * Sessions whose `started_at` falls in the half-open range `[fromMs, toMs)`, newest
   * first. Backs the calendar month view without paging the whole table (ADR-30).
   */
  listSessionsInRange(
    fromMs: EpochMs,
    toMs: EpochMs,
  ): Promise<Result<readonly SleepSession[]>>;

  /**
   * Delete a session (FK cascade removes events and buckets). Returns the non-null
   * `audio_path` values that belonged to the session so a service can unlink files.
   * Returns `NOT_FOUND` when the id does not exist.
   */
  deleteSession(id: string): Promise<Result<readonly string[]>>;

  /**
   * Delete every session (FK cascade removes all events and buckets). Returns all non-null
   * `audio_path` values so a service can unlink the snippet files. Backs Settings
   * "Delete all sleep data" (ADR-30).
   */
  deleteAllSessions(): Promise<Result<readonly string[]>>;

  /** Upsert pre-aggregated timeline buckets for a session (ADR-11). */
  saveBuckets(buckets: readonly SessionBucket[]): Promise<Result<void>>;

  /** Read all buckets for a session, ordered by `bucketStart` ascending. */
  getBuckets(sessionId: string): Promise<Result<readonly SessionBucket[]>>;
}
