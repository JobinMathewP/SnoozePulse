import type { SessionState } from '@/types';

/**
 * Allowed recording-lifecycle transitions (architecture.md §3).
 *
 * `PAUSED` is system-only (ADR-14). Terminal live states return to `IDLE` so a new night
 * can start; persisted session rows keep `COMPLETED` / `ERROR`.
 */
export const SESSION_TRANSITIONS: {
  readonly [S in SessionState]: readonly SessionState[];
} = {
  IDLE: ['STARTING'],
  STARTING: ['RECORDING', 'ERROR'],
  RECORDING: ['PAUSED', 'STOPPING', 'ERROR'],
  PAUSED: ['RECORDING', 'STOPPING', 'ERROR'],
  STOPPING: ['COMPLETED', 'ERROR'],
  COMPLETED: ['IDLE'],
  ERROR: ['IDLE', 'STARTING'],
};

/** True when `to` is listed as a legal successor of `from`. */
export function canTransition(from: SessionState, to: SessionState): boolean {
  return SESSION_TRANSITIONS[from].includes(to);
}
