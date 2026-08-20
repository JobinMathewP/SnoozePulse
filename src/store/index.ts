/**
 * Application state (Zustand) — slices only, no repository imports (ADR-12).
 * Concrete services are injected at the composition root (ADR-18).
 */

export type { StoreDependencies } from './container';
export type { Result } from './result';
export { err, ok } from './result';

export type { AppStore, AppStoreBootState } from './createAppStore';
export { createAppStore } from './createAppStore';
export { bindAudioSubscriptions } from './bindAudioSubscriptions';
export { bindBatteryGuard } from './bindBatteryGuard';
export { bindReadinessScheduler, runReadinessTick } from './bindReadinessScheduler';
export { DECIBEL_STORE_THROTTLE_MS } from './throttle';
export { liveAudioLevel, decibelToWaveLevel } from './liveAudioLevel';

export type { SessionSlice } from './sessionSlice';
export type { AudioSlice } from './audioSlice';
export type { SettingsSlice } from './settingsSlice';
export type { InsightsSlice, SessionDetail, HistoryTrends } from './insightsSlice';
export type { ProfileSlice } from './profileSlice';
export type { ScheduleSlice } from './scheduleSlice';
