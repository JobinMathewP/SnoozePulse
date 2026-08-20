import { createStore, type StoreApi } from 'zustand/vanilla';

import type { UserProfile } from '@/types';

import type { StoreDependencies } from './container';
import { createAudioSlice, type AudioSlice } from './audioSlice';
import { createInsightsSlice, type InsightsSlice } from './insightsSlice';
import { createNightOutcomeSlice, type NightOutcomeSlice } from './nightOutcomeSlice';
import { createProfileSlice, type ProfileSlice } from './profileSlice';
import { createScheduleSlice, type ScheduleSlice } from './scheduleSlice';
import { createSessionSlice, type SessionSlice } from './sessionSlice';
import { createSettingsSlice, type SettingsSlice } from './settingsSlice';

/**
 * Full Zustand state — api-contracts.md surface plus readiness, insights reads, and the
 * profile slice (ADR-30). Constructed via {@link createAppStore}; never `new`'d in UI.
 */
export type AppStore = SessionSlice &
  AudioSlice &
  SettingsSlice &
  InsightsSlice &
  ProfileSlice &
  ScheduleSlice &
  NightOutcomeSlice;

/** Synchronous seed for slices that must be correct on the first render (ADR-30). */
export type AppStoreBootState = {
  readonly profile: UserProfile;
};

/** Un-onboarded default when no boot read is supplied (tests, cold boot fallback). */
const DEFAULT_BOOT_STATE: AppStoreBootState = {
  profile: { displayName: null, onboarded: false },
};

/**
 * Build the app store with injected services. The only transitions live on the session
 * slice; pause/resume stay on the store for the audio-layer binder, not UI hooks (ADR-14).
 * `boot` seeds slices (currently the profile) so the onboarding gate is correct on the
 * first frame.
 */
export function createAppStore(
  deps: StoreDependencies,
  boot: AppStoreBootState = DEFAULT_BOOT_STATE,
): StoreApi<AppStore> {
  return createStore<AppStore>((set, get) => ({
    ...createSessionSlice(deps, set, get),
    ...createAudioSlice(deps, set),
    ...createSettingsSlice(deps, set),
    ...createInsightsSlice(deps),
    ...createProfileSlice(deps, set, boot.profile),
    ...createScheduleSlice(deps, set),
    ...createNightOutcomeSlice(deps, set),
  }));
}
