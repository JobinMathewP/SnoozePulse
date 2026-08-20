import { createContext, useContext, type ReactNode } from 'react';
import { useStore, type StoreApi } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import type { AppStore } from '@/store';

const StoreContext = createContext<StoreApi<AppStore> | null>(null);

type StoreProviderProps = {
  readonly store: StoreApi<AppStore>;
  readonly children: ReactNode;
};

/** Mount once at the composition root after {@link createAppStore}. */
export function StoreProvider({ store, children }: StoreProviderProps) {
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}

function useStoreApi(): StoreApi<AppStore> {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('StoreProvider is missing — mount the composition root first');
  }
  return store;
}

/** Full store selector. Prefer the narrower UI hooks below. */
export function useAppStore<T>(selector: (state: AppStore) => T): T {
  return useStore(useStoreApi(), selector);
}

/**
 * Session fields and user-facing actions only.
 * Intentionally omits pauseSession / resumeSession (ADR-14).
 */
export function useSession() {
  return useAppStore(
    useShallow((state) => ({
      sessionState: state.sessionState,
      isRecording: state.isRecording,
      activeSession: state.activeSession,
      lastError: state.lastError,
      lastCompletedSessionId: state.lastCompletedSessionId,
      startSession: state.startSession,
      stopSession: state.stopSession,
      discardSession: state.discardSession,
      recoverSession: state.recoverSession,
      consumeLastCompletedSession: state.consumeLastCompletedSession,
    })),
  );
}

/**
 * Throttled decibel + last snore for non-animated UI (ADR-13).
 *
 * Task 6.7: also surfaces the classifier's throttled confidence, its hysteretic snore
 * state, and the rolling noise floor so the record screen can render ML-driven fields
 * without subscribing to raw `AudioLevelEvent`s.
 */
export function useAudioLevels() {
  return useAppStore(
    useShallow((state) => ({
      currentDecibel: state.currentDecibel,
      currentConfidence: state.currentConfidence,
      currentNoiseFloorDb: state.currentNoiseFloorDb,
      currentSnoreDetected: state.currentSnoreDetected,
      lastSnoreEvent: state.lastSnoreEvent,
      storageQuotaWarning: state.storageQuotaWarning,
      clearStorageQuotaWarning: state.clearStorageQuotaWarning,
    })),
  );
}

/** Snippet playback controls + status for Summary (Task 5.4). */
export function useSnippetPlayback() {
  return useAppStore(
    useShallow((state) => ({
      playback: state.playback,
      playSnippet: state.playSnippet,
      pauseSnippet: state.pauseSnippet,
      stopSnippet: state.stopSnippet,
      isRecording: state.isRecording,
    })),
  );
}

/** Readiness / calibration / mic permission for Home, plus Settings data-wipe. */
export function useSettings() {
  return useAppStore(
    useShallow((state) => ({
      readiness: state.readiness,
      refreshReadiness: state.refreshReadiness,
      calibrateAmbient: state.calibrateAmbient,
      requestMicrophonePermission: state.requestMicrophonePermission,
      deleteAllSleepData: state.deleteAllSleepData,
      seedDemoData: state.seedDemoData,
    })),
  );
}

/** Summary / History reads through the store (ADR-12). */
export function useInsights() {
  return useAppStore(
    useShallow((state) => ({
      loadSessionDetail: state.loadSessionDetail,
      loadHistoryTrends: state.loadHistoryTrends,
      listRecentSessions: state.listRecentSessions,
      loadSessionsForMonth: state.loadSessionsForMonth,
    })),
  );
}

/** Greeting name and onboarding flag (ADR-30). */
export function useProfile() {
  return useAppStore(
    useShallow((state) => ({
      displayName: state.displayName,
      onboarded: state.onboarded,
      loadProfile: state.loadProfile,
      setDisplayName: state.setDisplayName,
      completeOnboarding: state.completeOnboarding,
    })),
  );
}
