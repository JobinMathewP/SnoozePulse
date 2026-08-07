import type { SnippetPlaybackStatus } from '@/services';
import type { AppError, AudioLevelEvent, SnoreEvent, StorageQuotaError } from '@/types';

import type { StoreDependencies } from './container';
import type { Result } from './result';
import { ok } from './result';

const IDLE_PLAYBACK: SnippetPlaybackStatus = {
  eventId: null,
  audioPath: null,
  playing: false,
  positionMs: 0,
  durationMs: 0,
};

/**
 * Audio slice — throttled level, last snore, playback, and storage warnings (Task 5.5).
 *
 * Task 6.7 extends the throttled level fields so the record-screen UI can render the
 * classifier's confidence, its hysteretic snore state, and the rolling noise floor
 * without having to subscribe to raw `AudioLevelEvent`s. Every field mirrors data that
 * already arrives on `updateAudioLevel`; nothing new is fetched or computed here.
 */
export type AudioSlice = {
  readonly currentDecibel: number;
  /**
   * Mean classifier probability P(snoring) + P(snort) from the last throttled tick,
   * clamped to `[0, 1]`. Display-only (ADR-21). `0` before the first tick.
   */
  readonly currentConfidence: number;
  /**
   * Rolling 60 s median of display dB from the native side (ADR-25). `0` before the
   * first tick lands.
   */
  readonly currentNoiseFloorDb: number;
  /**
   * Classifier's hysteretic snore state (enter ≥ 0.55, exit < 0.35, ADR-24). Reflects
   * the last throttled tick; the per-episode `SnoreEvent` still arrives via
   * `addSnoreEvent`.
   */
  readonly currentSnoreDetected: boolean;
  readonly lastSnoreEvent: SnoreEvent | null;
  readonly playback: SnippetPlaybackStatus;
  /** Non-fatal: snippets may be skipped while capture continues (ADR-15). */
  readonly storageQuotaWarning: StorageQuotaError | null;

  updateAudioLevel: (event: AudioLevelEvent) => void;
  addSnoreEvent: (event: SnoreEvent) => void;
  setPlaybackStatus: (status: SnippetPlaybackStatus) => void;
  clearStorageQuotaWarning: () => void;
  playSnippet: (eventId: string, audioPath: string) => Promise<Result<void>>;
  pauseSnippet: () => Promise<Result<void>>;
  stopSnippet: () => Promise<Result<void>>;
};

type SetState = (partial: Partial<AudioSlice>) => void;

function isStorageQuota(error: AppError): error is StorageQuotaError {
  return error.code === 'STORAGE_QUOTA';
}

export function createAudioSlice(
  deps: StoreDependencies,
  set: SetState,
): AudioSlice {
  return {
    currentDecibel: 0,
    currentConfidence: 0,
    currentNoiseFloorDb: 0,
    currentSnoreDetected: false,
    lastSnoreEvent: null,
    playback: IDLE_PLAYBACK,
    storageQuotaWarning: null,

    updateAudioLevel(event) {
      set({
        currentDecibel: event.decibel,
        currentConfidence: event.confidence,
        currentNoiseFloorDb: event.noiseFloorDb,
        currentSnoreDetected: event.snoreDetected,
      });
    },

    addSnoreEvent(event) {
      set({ lastSnoreEvent: event });
      if (event.audioPath !== null) {
        return;
      }
      // Snippet write failed — probe quota so the UI can explain skipped audio (Task 5.5).
      void (async () => {
        const quota = await deps.sleepService.checkSnippetQuota();
        if (!quota.ok && isStorageQuota(quota.error)) {
          set({ storageQuotaWarning: quota.error });
        }
      })();
    },

    setPlaybackStatus(status) {
      set({ playback: status });
    },

    clearStorageQuotaWarning() {
      set({ storageQuotaWarning: null });
    },

    async playSnippet(eventId, audioPath) {
      const result = await deps.audioService.playSnippet(eventId, audioPath);
      if (result.ok) {
        set({ playback: deps.audioService.getPlaybackStatus() });
      }
      return result;
    },

    async pauseSnippet() {
      const result = await deps.audioService.pauseSnippet();
      if (result.ok) {
        set({ playback: deps.audioService.getPlaybackStatus() });
      }
      return result;
    },

    async stopSnippet() {
      const result = await deps.audioService.stopSnippet();
      set({ playback: IDLE_PLAYBACK });
      return result.ok ? ok(undefined) : result;
    },
  };
}
