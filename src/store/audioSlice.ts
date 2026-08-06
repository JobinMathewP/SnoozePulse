import type { AudioLevelEvent, SnoreEvent } from '@/types';

/** Audio slice — throttled level + last snore for non-animated consumers (ADR-13). */
export type AudioSlice = {
  readonly currentDecibel: number;
  readonly lastSnoreEvent: SnoreEvent | null;

  updateAudioLevel: (event: AudioLevelEvent) => void;
  addSnoreEvent: (event: SnoreEvent) => void;
};

type SetState = (partial: Partial<AudioSlice>) => void;

export function createAudioSlice(set: SetState): AudioSlice {
  return {
    currentDecibel: 0,
    lastSnoreEvent: null,

    updateAudioLevel(event) {
      set({ currentDecibel: event.decibel });
    },

    addSnoreEvent(event) {
      set({ lastSnoreEvent: event });
    },
  };
}
