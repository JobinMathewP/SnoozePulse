import type {
  AudioInterruptionEvent,
  AudioLevelEvent,
  MicrophonePermissionStatus,
  SleepSession,
  SnoreEvent,
} from '@/types';

import type { Result } from '@/repositories';

/** Live snippet playback progress for Summary (Task 5.4). */
export type SnippetPlaybackStatus = {
  readonly eventId: string | null;
  readonly audioPath: string | null;
  readonly playing: boolean;
  /** Current position in milliseconds. */
  readonly positionMs: number;
  /** Total duration in milliseconds (0 until loaded). */
  readonly durationMs: number;
};

/**
 * Recording lifecycle and state-machine orchestration.
 *
 * Mediates between the store and `IAudioEngine`. Batches snore events before handing them
 * to `ISnoreRepository`. Owns transition guards in coordination with the store, but never
 * executes SQL itself (ADR-12, ADR-19).
 *
 * Pause / resume are system-only entry points (ADR-14): the store calls them when the
 * engine emits an interruption, never when a user taps a control.
 *
 * Snippet playback uses `expo-audio` and is refused while capture owns the session.
 */
export interface IAudioService {
  getPermissionStatus(): Promise<MicrophonePermissionStatus>;

  requestPermission(): Promise<Result<MicrophonePermissionStatus>>;

  /**
   * Create the session row, start the engine, and enter RECORDING.
   * Fails if readiness is incomplete or the engine cannot acquire the session.
   */
  startSession(): Promise<Result<SleepSession>>;

  /**
   * Stop the engine, flush batched snore events and buckets, finish the session row, and
   * enter COMPLETED (or ERROR on unrecoverable failure).
   */
  stopSession(): Promise<Result<SleepSession>>;

  /**
   * Tear down capture after JS state was reset (Fast Refresh / remount) while the native
   * engine or an in-memory session may still be live. Always stops the engine.
   * Returns the completed session when one could be finalised; otherwise `null`.
   */
  forceStopRecording(): Promise<Result<SleepSession | null>>;

  /** System-only. Enter PAUSED in response to an audio interruption (ADR-14). */
  pauseSession(): Promise<Result<void>>;

  /** System-only. Leave PAUSED when the interruption ends (ADR-14). */
  resumeSession(): Promise<Result<void>>;

  /**
   * Play a snippet file. Refused with `AUDIO_BUSY` while capture is active.
   * `eventId` is echoed in {@link SnippetPlaybackStatus} for UI highlighting.
   */
  playSnippet(eventId: string, audioPath: string): Promise<Result<void>>;

  /** Pause the current snippet without releasing the player. */
  pauseSnippet(): Promise<Result<void>>;

  /** Stop and release the snippet player. */
  stopSnippet(): Promise<Result<void>>;

  getPlaybackStatus(): SnippetPlaybackStatus;

  subscribePlaybackStatus(
    listener: (status: SnippetPlaybackStatus) => void,
  ): () => void;

  /**
   * Throttled level stream for the store's `currentDecibel`. The waveform does not use
   * this subscription — it reads the Reanimated shared value fed from the engine (ADR-13).
   */
  subscribeAudioLevel(listener: (event: AudioLevelEvent) => void): () => void;

  /** Completed snore episodes after batching boundaries. */
  subscribeSnore(listener: (event: SnoreEvent) => void): () => void;

  /** System pause / resume signals, forwarded from the engine. */
  subscribeInterruption(listener: (event: AudioInterruptionEvent) => void): () => void;
}
