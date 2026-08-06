import type { IAudioService } from '@/services';
import type { StoreApi } from 'zustand/vanilla';

import type { AppStore } from './createAppStore';
import { decibelToWaveLevel, liveAudioLevel } from './liveAudioLevel';
import { DECIBEL_STORE_THROTTLE_MS } from './throttle';

/**
 * Wire engine→store subscriptions. Pause/resume are system-only (ADR-14).
 *
 * Every level event updates {@link liveAudioLevel} (ADR-13 waveform path).
 * Zustand `currentDecibel` stays throttled for non-animated UI.
 */
export function bindAudioSubscriptions(
  store: StoreApi<AppStore>,
  audioService: IAudioService,
): () => void {
  let lastDecibelAt = 0;

  const unsubLevel = audioService.subscribeAudioLevel((event) => {
    liveAudioLevel.value = decibelToWaveLevel(event.decibel);

    const now = Date.now();
    if (now - lastDecibelAt < DECIBEL_STORE_THROTTLE_MS) {
      return;
    }
    lastDecibelAt = now;
    store.getState().updateAudioLevel(event);
  });

  const unsubSnore = audioService.subscribeSnore((event) => {
    store.getState().addSnoreEvent(event);
  });

  const unsubInterruption = audioService.subscribeInterruption((event) => {
    if (event.resumed) {
      void store.getState().resumeSession();
    } else {
      void store.getState().pauseSession();
    }
  });

  return () => {
    unsubLevel();
    unsubSnore();
    unsubInterruption();
  };
}
