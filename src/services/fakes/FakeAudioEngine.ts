import type { IAudioEngine, Result } from '@/native';
import type {
  AudioInterruptionEvent,
  AudioLevelEvent,
  CalibrationResult,
  MicrophonePermissionStatus,
  SnoreEvent,
} from '@/types';

type Listener<T> = (value: T) => void;

/**
 * In-memory stand-in for `IAudioEngine` so AudioService can be exercised before the
 * native module exists (Task 4.3). Composition root in production wires the real engine.
 */
export class FakeAudioEngine implements IAudioEngine {
  private permission: MicrophonePermissionStatus = 'granted';
  private recording = false;
  private paused = false;
  private sessionId: string | null = null;

  private readonly levelListeners = new Set<Listener<AudioLevelEvent>>();
  private readonly snoreListeners = new Set<Listener<SnoreEvent>>();
  private readonly interruptionListeners = new Set<Listener<AudioInterruptionEvent>>();

  setPermission(status: MicrophonePermissionStatus): void {
    this.permission = status;
  }

  async getPermissionStatus(): Promise<MicrophonePermissionStatus> {
    return this.permission;
  }

  async requestPermission(): Promise<Result<MicrophonePermissionStatus>> {
    this.permission = 'granted';
    return { ok: true, value: this.permission };
  }

  async startRecording(sessionId: string): Promise<Result<void>> {
    if (this.permission !== 'granted') {
      return {
        ok: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Microphone permission denied',
        },
      };
    }
    if (this.recording) {
      return {
        ok: false,
        error: { code: 'AUDIO_BUSY', message: 'Already recording' },
      };
    }
    this.sessionId = sessionId;
    this.recording = true;
    this.paused = false;
    return { ok: true, value: undefined };
  }

  async stopRecording(): Promise<Result<void>> {
    this.recording = false;
    this.paused = false;
    this.sessionId = null;
    return { ok: true, value: undefined };
  }

  async pauseRecording(): Promise<Result<void>> {
    if (!this.recording) {
      return {
        ok: false,
        error: { code: 'AUDIO_ENGINE', message: 'Not recording' },
      };
    }
    this.paused = true;
    return { ok: true, value: undefined };
  }

  async resumeRecording(): Promise<Result<void>> {
    if (!this.recording || !this.paused) {
      return {
        ok: false,
        error: { code: 'AUDIO_ENGINE', message: 'Not paused' },
      };
    }
    this.paused = false;
    return { ok: true, value: undefined };
  }

  async calibrate(): Promise<Result<CalibrationResult>> {
    return {
      ok: true,
      value: {
        baselineDb: 32,
        sampledMs: 3_000,
        environment: 'quiet',
      },
    };
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

  /** Test helper: emit a level event to subscribers. */
  emitLevel(event: AudioLevelEvent): void {
    for (const listener of this.levelListeners) {
      listener(event);
    }
  }

  /** Test helper: emit a completed snore episode to subscribers. */
  emitSnore(event: SnoreEvent): void {
    for (const listener of this.snoreListeners) {
      listener(event);
    }
  }

  /** Test helper: emit a system interruption. */
  emitInterruption(event: AudioInterruptionEvent): void {
    for (const listener of this.interruptionListeners) {
      listener(event);
    }
  }
}
