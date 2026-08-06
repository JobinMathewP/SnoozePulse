import { NativeModule, requireNativeModule } from 'expo';

import type {
  NativeCalibrationPayload,
  SnoozePulseAudioModuleEvents,
} from './SnoozePulseAudio.types';

/**
 * Typed binding to the Kotlin / Swift module. Application code must not import this —
 * go through `src/native/AudioEngine` (ADR-16).
 */
declare class SnoozePulseAudioModule extends NativeModule<SnoozePulseAudioModuleEvents> {
  readonly HEARTBEAT_INTERVAL_MS: number;

  startRecording(sessionId: string): Promise<void>;
  stopRecording(): Promise<void>;
  pauseRecording(): Promise<void>;
  resumeRecording(): Promise<void>;
  calibrate(): Promise<NativeCalibrationPayload>;
}

export default requireNativeModule<SnoozePulseAudioModule>('SnoozePulseAudio');
