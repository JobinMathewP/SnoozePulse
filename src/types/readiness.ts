/**
 * Sleep Readiness machine (ADR-31). Separate from the recording session states.
 *
 * MONITORING means "emit start_session". COMPLETED means "emit stop_session".
 * This module is types only — no runtime tables.
 */

export type ReadinessState =
  | 'SCHEDULED'
  | 'READINESS_WINDOW'
  | 'SETTLING'
  | 'MONITORING'
  | 'WAKE_WINDOW'
  | 'COMPLETED'
  | 'ERROR';

export type ReadinessIntent = 'none' | 'start_session' | 'stop_session';

export type ReadinessTransitionMap = {
  readonly [S in ReadinessState]: readonly ReadinessState[];
};

/**
 * Injected snapshot for one evaluate tick. The reducer must not read the clock,
 * sensors, or microphone — callers supply these booleans (ADR-32).
 */
export interface ReadinessSnapshot {
  readonly automaticTrackingEnabled: boolean;
  readonly scheduleConfigured: boolean;
  readonly inReadinessWindow: boolean;
  readonly inWakeWindow: boolean;
  readonly wakeWindowEnded: boolean;
  /** Phone is relatively stationary. Never interpreted as "user is in bed". */
  readonly phoneSettled: boolean;
  readonly interacting: boolean;
  readonly environmentAcceptable: boolean;
  readonly settleElapsedMs: number;
}

export interface ReadinessStep {
  readonly state: ReadinessState;
  readonly intent: ReadinessIntent;
}
