import type { EpochMs } from './common';

/**
 * The recording state machine (architecture.md §3).
 *
 *   IDLE → STARTING → RECORDING → PAUSED → STOPPING → COMPLETED
 *
 * Any unrecoverable failure transitions to ERROR. Transitions are guarded: the store
 * rejects an illegal transition rather than applying it silently.
 *
 * PAUSED is entered and left by the audio engine in response to a system interruption and
 * never by a user control (ADR-14).
 */
export type SessionState =
  | 'IDLE'
  | 'STARTING'
  | 'RECORDING'
  | 'PAUSED'
  | 'STOPPING'
  | 'COMPLETED'
  | 'ERROR';

/** The two states a session can come to rest in. A stored row eventually holds one of these. */
export type TerminalSessionState = Extract<SessionState, 'COMPLETED' | 'ERROR'>;

/** States in which the engine is holding the microphone. */
export type ActiveSessionState = Extract<SessionState, 'RECORDING' | 'PAUSED'>;

/**
 * Shape of the guard table the store consults before applying a transition. The table's
 * values are runtime data and belong to the store; only its type lives here.
 */
export type SessionTransitionMap = {
  readonly [S in SessionState]: readonly SessionState[];
};

/**
 * One night, one row in `sleep_sessions`.
 *
 * The row is created when recording starts, so the nullable fields are the ones that cannot
 * be known until it ends.
 */
export interface SleepSession {
  readonly id: string;
  readonly startedAt: EpochMs;
  /** Null while the session is still running. */
  readonly endedAt: EpochMs | null;
  /** Live state while running; a terminal state once finished. */
  readonly state: SessionState;
  /** Ambient noise floor measured during calibration, in dB. Snore detection is relative to it. */
  readonly ambientBaselineDb: number;
  readonly snoreCount: number;
  readonly totalSnoringMs: number;
  readonly peakDb: number;
  /** When `peakDb` occurred. Null until at least one snore is recorded. */
  readonly peakAt: EpochMs | null;
  /** Both scores are computed on completion, so both are null while the session runs (ADR-10). */
  readonly sleepScore: number | null;
  readonly snoreScore: number | null;
}

/** The fields known at creation time; everything else is accumulated or computed later. */
export interface NewSleepSession {
  readonly id: string;
  readonly startedAt: EpochMs;
  readonly ambientBaselineDb: number;
}

/** The totals written when a session finishes. */
export interface SleepSessionCompletion {
  readonly endedAt: EpochMs;
  readonly state: TerminalSessionState;
  readonly snoreCount: number;
  readonly totalSnoringMs: number;
  readonly peakDb: number;
  readonly peakAt: EpochMs | null;
  readonly sleepScore: number;
  readonly snoreScore: number;
}
