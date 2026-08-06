import type { SnippetPlaybackStatus } from '@/services';
import type { AudioLevelEvent, SnoreEvent } from '@/types';

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

/** Audio slice — throttled level, last snore, and snippet playback (ADR-13 / Task 5.4). */
export type AudioSlice = {
  readonly currentDecibel: number;
  readonly lastSnoreEvent: SnoreEvent | null;
  readonly playback: SnippetPlaybackStatus;

  updateAudioLevel: (event: AudioLevelEvent) => void;
  addSnoreEvent: (event: SnoreEvent) => void;
  setPlaybackStatus: (status: SnippetPlaybackStatus) => void;
  playSnippet: (eventId: string, audioPath: string) => Promise<Result<void>>;
  pauseSnippet: () => Promise<Result<void>>;
  stopSnippet: () => Promise<Result<void>>;
};

type SetState = (partial: Partial<AudioSlice>) => void;

export function createAudioSlice(
  deps: StoreDependencies,
  set: SetState,
): AudioSlice {
  return {
    currentDecibel: 0,
    lastSnoreEvent: null,
    playback: IDLE_PLAYBACK,

    updateAudioLevel(event) {
      set({ currentDecibel: event.decibel });
    },

    addSnoreEvent(event) {
      set({ lastSnoreEvent: event });
    },

    setPlaybackStatus(status) {
      set({ playback: status });
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
