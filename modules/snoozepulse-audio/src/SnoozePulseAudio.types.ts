/**
 * Wire payloads from the native module. Domain mapping happens in `src/native/AudioEngine.ts`
 * — keep this file free of app types so the module stays publishable in isolation.
 *
 * Task 5.2: levels / snore / interruption are produced by real capture + DSP on both
 * platforms. PCM never appears in these payloads.
 *
 * Task 6.3 (ADR-24): payloads grow classifier-driven fields. `snoreDetected` now reflects
 * the hysteretic classifier state, not a dB comparison (ADR-23).
 */

export type NativeAudioLevelPayload = {
  sessionId: string;
  timestamp: number;
  decibel: number;
  rms: number;
  snoreDetected: boolean;
  /** P(Snoring) + P(Snort) for the latest 0.975 s window, clamped [0, 1] (ADR-21). */
  confidence: number;
  /** Rolling 60 s median of display dB; 0 until the estimator warms up (ADR-25). */
  noiseFloorDb: number;
};

export type NativeSnorePayload = {
  id: string;
  sessionId: string;
  timestamp: number;
  durationMs: number;
  peakDb: number;
  /** Mean classifier probability across the episode. */
  confidence: number;
  /** Class with the higher summed probability across the episode. */
  classLabel: 'snoring' | 'snort';
  /** Dominant frequency at the loudest frame, or null when spectral analysis is unavailable. */
  spectralPeakHz: number | null;
  /** Absolute path under documents/snippets, or null when write failed. */
  audioPath: string | null;
};

export type NativeInterruptionPayload = {
  sessionId: string;
  timestamp: number;
  reason: 'incomingCall' | 'audioSessionSeized';
  resumed: boolean;
};

export type NativeCalibrationPayload = {
  baselineDb: number;
  sampledMs: number;
  environment: 'quiet' | 'moderate' | 'noisy';
};

export type SnoozePulseAudioModuleEvents = {
  onAudioLevel: (params: NativeAudioLevelPayload) => void;
  onSnore: (params: NativeSnorePayload) => void;
  onInterruption: (params: NativeInterruptionPayload) => void;
};
