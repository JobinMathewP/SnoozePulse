import type { ReadinessSignalsSnapshot } from '@/types';

/**
 * Combined charging / interaction / motion / environment port for Sleep Readiness.
 * Constructed at the composition root (or in tests via fakes) — never in the store or UI.
 */
export interface IReadinessSignals {
  getSnapshot(): Promise<ReadinessSignalsSnapshot>;
  subscribe(listener: (snapshot: ReadinessSignalsSnapshot) => void): () => void;
  /** Pause the accelerometer while a session is recording (battery). */
  setMotionSamplingEnabled(enabled: boolean): void;
}

/** Foreground vs background. Does not know about other apps or screen-on. */
export interface IInteractionMonitor {
  getInteracting(): boolean;
  subscribe(listener: (interacting: boolean) => void): () => void;
}

/**
 * Phone-settled motion. `null` until a motion adapter is live, or when sampling
 * fails. Missing data does not block auto-start; `false` (moving) does.
 * Measures the phone, never "the user is in bed".
 */
export interface IMotionMonitor {
  getPhoneSettled(): boolean | null;
  subscribe(listener: (phoneSettled: boolean | null) => void): () => void;
  setSamplingEnabled(enabled: boolean): void;
}

/** Environmental audio before `START SESSION`. `null` until a short sample exists. */
export interface IEnvironmentMonitor {
  getAcceptable(): boolean | null;
  subscribe(listener: (acceptable: boolean | null) => void): () => void;
}
