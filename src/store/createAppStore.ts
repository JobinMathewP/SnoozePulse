import { createStore, type StoreApi } from 'zustand/vanilla';

import type { StoreDependencies } from './container';
import { createAudioSlice, type AudioSlice } from './audioSlice';
import { createInsightsSlice, type InsightsSlice } from './insightsSlice';
import { createSessionSlice, type SessionSlice } from './sessionSlice';
import { createSettingsSlice, type SettingsSlice } from './settingsSlice';

/**
 * Full Zustand state — api-contracts.md surface plus readiness and insights reads.
 * Constructed via {@link createAppStore}; never `new`'d inside UI (ADR-18).
 */
export type AppStore = SessionSlice & AudioSlice & SettingsSlice & InsightsSlice;

/**
 * Build the app store with injected services. The only transitions live on the session
 * slice; pause/resume stay on the store for the audio-layer binder, not UI hooks (ADR-14).
 */
export function createAppStore(deps: StoreDependencies): StoreApi<AppStore> {
  return createStore<AppStore>((set, get) => ({
    ...createSessionSlice(deps, set, get),
    ...createAudioSlice(set),
    ...createSettingsSlice(deps, set),
    ...createInsightsSlice(deps),
  }));
}
