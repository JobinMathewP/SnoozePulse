import type { EpochMs } from '@/types';

import { MIN_SESSION_DURATION_MS } from './constants';

/**
 * Session-length policy helpers (ADR-30).
 *
 * Pure and dependency-free so the slide-to-end guard and its tests share one source of
 * truth. Wall-clock based: `PAUSED` gaps still count as elapsed time, which is the honest
 * measure of "how long did we watch the room".
 */

/** Elapsed wall-clock milliseconds for a session, clamped to non-negative. */
export function sessionDurationMs(startedAt: EpochMs, endedAt: EpochMs): number {
  return Math.max(0, endedAt - startedAt);
}

/**
 * True when a session is too short to be worth saving and should be discarded on end.
 * Uses `>= MIN` as the keep threshold so an exactly-5-minute night is kept.
 */
export function isSessionTooShort(startedAt: EpochMs, endedAt: EpochMs): boolean {
  return sessionDurationMs(startedAt, endedAt) < MIN_SESSION_DURATION_MS;
}
