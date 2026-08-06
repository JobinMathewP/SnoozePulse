import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';

import type {
  AmbientEnvironment,
  AudioInterruptionEvent,
  AudioLevelEvent,
  CalibrationResult,
  MicrophonePermissionStatus,
  SnoreEvent,
} from '@/types';

import type { IAudioEngine, Result } from './IAudioEngine';

/**
 * Import the local Expo module **only here** (ADR-16). Everything else depends on
 * {@link IAudioEngine}. Relative path keeps Metro from needing a package.json name entry.
 */
import SnoozePulseAudioModule from '../../modules/snoozepulse-audio';
import type {
  NativeAudioLevelPayload,
  NativeCalibrationPayload,
  NativeInterruptionPayload,
  NativeSnorePayload,
} from '../../modules/snoozepulse-audio';

type Listener<T> = (value: T) => void;

/**
 * JS-side adapter over `modules/snoozepulse-audio`.
 *
 * Responsibilities in Task 5.1:
 * - Map expo-audio permission APIs → domain `MicrophonePermissionStatus`
 * - Forward lifecycle calls to the native heartbeat stub (no DSP yet)
 * - Adapt native event payloads into domain events for store / Reanimated consumers
 *
 * Task 5.2 will keep this file's surface stable while Kotlin/Swift gain real capture.
 */
export class AudioEngine implements IAudioEngine {
  private readonly levelListeners = new Set<Listener<AudioLevelEvent>>();
  private readonly snoreListeners = new Set<Listener<SnoreEvent>>();
  private readonly interruptionListeners = new Set<Listener<AudioInterruptionEvent>>();

  private readonly levelSub = SnoozePulseAudioModule.addListener(
    'onAudioLevel',
    (payload: NativeAudioLevelPayload) => {
      const event = mapAudioLevel(payload);
      for (const listener of this.levelListeners) {
        listener(event);
      }
    },
  );

  private readonly snoreSub = SnoozePulseAudioModule.addListener(
    'onSnore',
    (payload: NativeSnorePayload) => {
      const event = mapSnore(payload);
      for (const listener of this.snoreListeners) {
        listener(event);
      }
    },
  );

  private readonly interruptionSub = SnoozePulseAudioModule.addListener(
    'onInterruption',
    (payload: NativeInterruptionPayload) => {
      const event = mapInterruption(payload);
      for (const listener of this.interruptionListeners) {
        listener(event);
      }
    },
  );

  /** Drop native subscriptions — call from tests / hot-reload teardown if needed. */
  dispose(): void {
    this.levelSub.remove();
    this.snoreSub.remove();
    this.interruptionSub.remove();
  }

  async getPermissionStatus(): Promise<MicrophonePermissionStatus> {
    const status = await getRecordingPermissionsAsync();
    return mapPermission(status.granted, status.canAskAgain, status.status);
  }

  async requestPermission(): Promise<Result<MicrophonePermissionStatus>> {
    const status = await requestRecordingPermissionsAsync();
    const mapped = mapPermission(status.granted, status.canAskAgain, status.status);
    if (mapped === 'granted') {
      // Configure the shared audio session for play-and-record; required before background
      // capture on iOS and before the microphone foreground service on Android 14+.
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      });
    }
    return { ok: true, value: mapped };
  }

  async startRecording(sessionId: string): Promise<Result<void>> {
    const permission = await this.getPermissionStatus();
    if (permission !== 'granted') {
      return {
        ok: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Microphone permission is required to start recording',
        },
      };
    }
    try {
      await SnoozePulseAudioModule.startRecording(sessionId);
      return { ok: true, value: undefined };
    } catch (cause) {
      return mapNativeFailure(cause, 'Failed to start recording');
    }
  }

  async stopRecording(): Promise<Result<void>> {
    try {
      await SnoozePulseAudioModule.stopRecording();
      return { ok: true, value: undefined };
    } catch (cause) {
      return mapNativeFailure(cause, 'Failed to stop recording');
    }
  }

  async pauseRecording(): Promise<Result<void>> {
    try {
      await SnoozePulseAudioModule.pauseRecording();
      return { ok: true, value: undefined };
    } catch (cause) {
      return mapNativeFailure(cause, 'Failed to pause recording');
    }
  }

  async resumeRecording(): Promise<Result<void>> {
    try {
      await SnoozePulseAudioModule.resumeRecording();
      return { ok: true, value: undefined };
    } catch (cause) {
      return mapNativeFailure(cause, 'Failed to resume recording');
    }
  }

  async calibrate(): Promise<Result<CalibrationResult>> {
    try {
      const payload = await SnoozePulseAudioModule.calibrate();
      return { ok: true, value: mapCalibration(payload) };
    } catch {
      return {
        ok: false,
        error: {
          code: 'CALIBRATION',
          message: 'Ambient calibration failed',
        },
      };
    }
  }

  subscribeAudioLevel(listener: Listener<AudioLevelEvent>): () => void {
    this.levelListeners.add(listener);
    return () => {
      this.levelListeners.delete(listener);
    };
  }

  subscribeSnore(listener: Listener<SnoreEvent>): () => void {
    this.snoreListeners.add(listener);
    return () => {
      this.snoreListeners.delete(listener);
    };
  }

  subscribeInterruption(listener: Listener<AudioInterruptionEvent>): () => void {
    this.interruptionListeners.add(listener);
    return () => {
      this.interruptionListeners.delete(listener);
    };
  }
}

function mapPermission(
  granted: boolean,
  canAskAgain: boolean,
  status: string,
): MicrophonePermissionStatus {
  if (granted) {
    return 'granted';
  }
  // expo-audio uses 'denied' | 'granted' | 'undetermined' — treat non-askable as denied.
  if (status === 'undetermined' || (canAskAgain && status !== 'denied')) {
    return 'undetermined';
  }
  return 'denied';
}

function mapAudioLevel(payload: NativeAudioLevelPayload): AudioLevelEvent {
  return {
    sessionId: payload.sessionId,
    timestamp: payload.timestamp,
    decibel: payload.decibel,
    rms: payload.rms,
    snoreDetected: payload.snoreDetected,
  };
}

function mapSnore(payload: NativeSnorePayload): SnoreEvent {
  return {
    id: payload.id,
    sessionId: payload.sessionId,
    timestamp: payload.timestamp,
    durationMs: payload.durationMs,
    peakDb: payload.peakDb,
    audioPath: payload.audioPath,
  };
}

function mapInterruption(payload: NativeInterruptionPayload): AudioInterruptionEvent {
  return {
    sessionId: payload.sessionId,
    timestamp: payload.timestamp,
    reason: payload.reason,
    resumed: payload.resumed,
  };
}

function mapCalibration(payload: NativeCalibrationPayload): CalibrationResult {
  const environment: AmbientEnvironment = payload.environment;
  return {
    baselineDb: payload.baselineDb,
    sampledMs: payload.sampledMs,
    environment,
  };
}

function mapNativeFailure(cause: unknown, message: string): Result<void> {
  const code =
    typeof cause === 'object' &&
    cause !== null &&
    'code' in cause &&
    typeof (cause as { code: unknown }).code === 'string'
      ? (cause as { code: string }).code
      : 'AUDIO_ENGINE';

  if (code === 'AUDIO_BUSY') {
    return { ok: false, error: { code: 'AUDIO_BUSY', message } };
  }
  if (code === 'PERMISSION_DENIED') {
    return { ok: false, error: { code: 'PERMISSION_DENIED', message } };
  }
  return {
    ok: false,
    error: { code: 'AUDIO_ENGINE', message, cause },
  };
}
