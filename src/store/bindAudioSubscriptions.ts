import type { IAudioService } from '@/services';
import type { StoreApi } from 'zustand/vanilla';

import type { AppStore } from './createAppStore';
import { DECIBEL_STORE_THROTTLE_MS } from './throttle';

/**
 * Wire engine→store subscriptions. Pause/resume are system-only (ADR-14).
 * Decibel updates are throttled below native event rate (ADR-13).
 */
export function bindAudioSubscriptions(
  store: StoreApi<AppStore>,
  audioService: IAudioService,
): () => void {
  let lastDecibelAt = 0;

  const unsubLevel = audioService.subscribeAudioLevel((event) => {
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
