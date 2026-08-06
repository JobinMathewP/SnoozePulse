/**
 * Wire payloads from the native module. Domain mapping happens in `src/native/AudioEngine.ts`
 * — keep this file free of app types so the module stays publishable in isolation.
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
