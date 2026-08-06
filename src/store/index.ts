/**
 * Application state (Zustand) — three slices, no repository imports (ADR-12).
 * Concrete services are injected at the composition root (ADR-18).
 */

export type { StoreDependencies } from './container';
export type { Result } from './result';
export { err, ok } from './result';

export type { AppStore } from './createAppStore';
export { createAppStore } from './createAppStore';
export { bindAudioSubscriptions } from './bindAudioSubscriptions';
export { DECIBEL_STORE_THROTTLE_MS } from './throttle';

export type { SessionSlice } from './sessionSlice';
export type { AudioSlice } from './audioSlice';
export type { SettingsSlice } from './settingsSlice';
