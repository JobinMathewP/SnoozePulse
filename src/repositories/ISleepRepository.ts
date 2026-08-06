import type {
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
 * (ADR-19). `deleteSession` is expected to cascade to snore events, buckets, and snippet
 * files at the storage layer; the repository does not decide *when* to delete.
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
   * Delete a session and cascade to snore events, buckets, and snippet files.
   * Returns `NOT_FOUND` when the id does not exist.
   */
  deleteSession(id: string): Promise<Result<void>>;

  /** Upsert pre-aggregated timeline buckets for a session (ADR-11). */
  saveBuckets(buckets: readonly SessionBucket[]): Promise<Result<void>>;

  /** Read all buckets for a session, ordered by `bucketStart` ascending. */
  getBuckets(sessionId: string): Promise<Result<readonly SessionBucket[]>>;
}
