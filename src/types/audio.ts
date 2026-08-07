import type { EpochMs } from './common';

/**
 * Emitted continuously while recording, throttled natively to a 100–200 ms interval.
 *
 * This event drives a Reanimated shared value directly and reaches the store only in
 * throttled form, because an eight-hour night produces on the order of 288,000 of them and
 * they must not drive React reconciliation (ADR-13).
 *
 * `snoreDetected` reflects the classifier's current hysteretic state (enter ≥ 0.55,
 * exit < 0.35). It does **not** compare `decibel` or `rms` against any threshold (ADR-23).
 */
export interface AudioLevelEvent {
  /**
   * Required so an event that arrives after its session has ended can be discarded rather
   * than misattributed to the next one.
   */
  readonly sessionId: string;
  readonly timestamp: EpochMs;
  /** Display-only; produced by `AudioDsp.rmsToDb` (ADR-23). Never used for detection. */
  readonly decibel: number;
  /** Raw root-mean-square amplitude, before conversion to dB. Display-only. */
  readonly rms: number;
  readonly snoreDetected: boolean;
  /** P(Snoring) + P(Snort) for the latest 0.975 s window, clamped [0, 1] (ADR-21). */
  readonly confidence: number;
  /** Rolling 60 s median of display dB; 0 until the estimator warms up (ADR-25). */
  readonly noiseFloorDb: number;
}

/** Emitted once per completed snore episode. */
export interface SnoreEvent {
  readonly id: string;
  readonly sessionId: string;
  readonly timestamp: EpochMs;
  readonly durationMs: number;
  /**
   * Display-only; retained for legacy Summary metric cards. Does not affect scoring
   * after M6 (ADR-26); V2 weights episodes by `confidence` and duration, not peak dB.
   */
  readonly peakDb: number;
  /** Mean classifier probability across the episode. */
  readonly confidence: number;
  /** Class with the higher summed probability across the episode. */
  readonly classLabel: 'snoring' | 'snort';
  /** Dominant frequency at the loudest frame, or null when spectral analysis is unavailable. */
  readonly spectralPeakHz: number | null;
  /**
   * Null when the episode was detected but no snippet could be written, because storage was
   * full or the retention cap had been reached. Detection must still report the episode
   * rather than drop it.
   */
  readonly audioPath: string | null;
}

/** Microphone permission as reported by the platform. */
export type MicrophonePermissionStatus = 'granted' | 'denied' | 'undetermined';

/** How loud the room is once calibration finishes. Surfaced on Home as a readiness check. */
export type AmbientEnvironment = 'quiet' | 'moderate' | 'noisy';

/** Result of an ambient noise calibration pass. */
export interface CalibrationResult {
  /** The measured noise floor, in dB. Becomes `SleepSession.ambientBaselineDb`. */
  readonly baselineDb: number;
  readonly sampledMs: number;
  readonly environment: AmbientEnvironment;
}

/**
 * Why the engine paused itself. Pause is system-only (ADR-14), so every value here
 * describes something that happened to the app rather than something the user pressed.
 */
export type AudioInterruptionReason = 'incomingCall' | 'audioSessionSeized';

/** Emitted when the engine suspends or resumes capture on its own. */
export interface AudioInterruptionEvent {
  readonly sessionId: string;
  readonly timestamp: EpochMs;
  readonly reason: AudioInterruptionReason;
  /** True when capture has resumed, false when it has just been suspended. */
  readonly resumed: boolean;
}
