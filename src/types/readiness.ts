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
  /**
   * Phone is relatively stationary. `null` means no motion sample (denied, missing,
   * or stub) — auto-start then relies on the other signals. `false` means we know
   * the phone is moving and must delay. Never interpreted as "user is in bed".
   */
  readonly phoneSettled: boolean | null;
  readonly interacting: boolean;
  /**
   * Pre-start environment is acceptable. `null` means no sample yet — do not block
   * auto-start. `false` means we sampled and it is not acceptable.
   */
  readonly environmentAcceptable: boolean | null;
  readonly settleElapsedMs: number;
}

export interface ReadinessStep {
  readonly state: ReadinessState;
  readonly intent: ReadinessIntent;
}

/**
 * Live device signals for Sleep Readiness (Task 7.4). `null` means the adapter
 * has no sample. Missing motion or environment does not block auto-start; a
 * known `false` (phone moving / room too loud) does.
 *
 * `phoneSettled` is the **phone**, not the person. It must never be read as
 * "user is in bed" (ADR-31).
 */
export interface ReadinessSignalsSnapshot {
  readonly charging: boolean;
  /** 0–1, or `< 0` when unknown. */
  readonly batteryLevel: number;
  /** True while SnoozePulse is in the foreground (`active` / `inactive`). */
  readonly interacting: boolean;
  readonly phoneSettled: boolean | null;
  readonly environmentAcceptable: boolean | null;
}
