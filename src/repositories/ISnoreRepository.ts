import type { SnoreEvent } from '@/types';

import type { Result } from './result';

/**
 * Persistence for `snore_events`.
 *
 * SQL only (ADR-19). Writes are expected to be batched by `IAudioService` into
 * `saveSnoreEvents` on a size or time trigger, with a guaranteed flush on `STOPPING`.
 */
export interface ISnoreRepository {
  /** Insert a single episode. Prefer `saveSnoreEvents` during an active session. */
  saveSnoreEvent(event: SnoreEvent): Promise<Result<void>>;

  /** Insert many episodes in one transaction. */
  saveSnoreEvents(events: readonly SnoreEvent[]): Promise<Result<void>>;

  /** All episodes for a session, ordered by `timestamp` ascending. */
  getEvents(sessionId: string): Promise<Result<readonly SnoreEvent[]>>;

  /** Delete every episode for a session. Used by cascade and by tests. */
  deleteEvents(sessionId: string): Promise<Result<void>>;
}
