/**
 * Wire payloads from the native module. Domain mapping happens in `src/native/AudioEngine.ts`
 * — keep this file free of app types so the module stays publishable in isolation.
 *
 * Task 5.2: levels / snore / interruption are produced by real capture + DSP on both
 * platforms. PCM never appears in these payloads.
 */

export type NativeAudioLevelPayload = {
  sessionId: string;
  timestamp: number;
  decibel: number;
  rms: number;
  snoreDetected: boolean;
};

export type NativeSnorePayload = {
  id: string;
  sessionId: string;
  timestamp: number;
  durationMs: number;
  peakDb: number;
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
