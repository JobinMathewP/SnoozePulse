import type {
  AppError,
  AudioInterruptionEvent,
  AudioLevelEvent,
  CalibrationResult,
  MicrophonePermissionStatus,
  SnoreEvent,
} from '@/types';

/**
 * Success / failure envelope for interface methods.
 *
 * Defined here (not in `src/types/`) because Task 1.6 owns the contracts that return it.
 * Structurally identical to the copy under `src/repositories/` so values remain assignable
 * across layers. Prefer returning this over throwing.
 */
export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: AppError };

/**
 * JavaScript-facing contract for the native audio engine (ADR-16).
 *
 * The Swift / Kotlin sources live in `modules/snoozepulse-audio/`. This interface is the
 * only thing the rest of the app may depend on; nothing imports the Expo module directly.
 *
 * Responsibilities: capture, DSP, snore detection, snippet writing, ambient calibration,
 * permission status, and system-triggered pause / resume (ADR-14). Never sends raw PCM
 * across the bridge — only throttled `AudioLevelEvent`s and completed `SnoreEvent`s.
 *
 * Pause and resume are system-only. There is no user-facing control that calls them.
 */
export interface IAudioEngine {
  /** Current microphone permission, without prompting. */
  getPermissionStatus(): Promise<MicrophonePermissionStatus>;

  /** Prompt if undetermined; returns the resulting status. */
  requestPermission(): Promise<Result<MicrophonePermissionStatus>>;

  /**
   * Begin capture for `sessionId`. Fails with `AUDIO_BUSY` or `PERMISSION_DENIED` when the
   * session cannot be acquired. On Android 14+ this must complete while the app is still
   * foregrounded so the microphone foreground service can start.
   */
  startRecording(sessionId: string): Promise<Result<void>>;

  /** End capture and flush any in-flight snippet. Safe to call when already stopped. */
  stopRecording(): Promise<Result<void>>;

  /**
   * Suspend capture because the system seized the audio session (incoming call, etc.).
   * Never invoked by UI (ADR-14).
   */
  pauseRecording(): Promise<Result<void>>;

  /** Resume after a system interruption. Never invoked by UI (ADR-14). */
  resumeRecording(): Promise<Result<void>>;

  /** Measure the ambient noise floor. Result becomes `SleepSession.ambientBaselineDb`. */
  calibrate(): Promise<Result<CalibrationResult>>;

  /**
   * Subscribe to native-throttled level events (100–200 ms). Returns an unsubscribe.
   * The waveform writes these into a Reanimated shared value; the store sees a throttled
   * subset only (ADR-13).
   */
  subscribeAudioLevel(listener: (event: AudioLevelEvent) => void): () => void;

  /** Subscribe to completed snore episodes. Returns an unsubscribe. */
  subscribeSnore(listener: (event: SnoreEvent) => void): () => void;

  /** Subscribe to system pause / resume. Returns an unsubscribe. */
  subscribeInterruption(listener: (event: AudioInterruptionEvent) => void): () => void;
}
