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
      startSession: state.startSession,
      stopSession: state.stopSession,
    })),
  );
}

/** Throttled decibel + last snore for non-animated UI (ADR-13). */
export function useAudioLevels() {
  return useAppStore(
    useShallow((state) => ({
      currentDecibel: state.currentDecibel,
      lastSnoreEvent: state.lastSnoreEvent,
    })),
  );
}

/** Readiness / calibration / mic permission for Home. */
export function useSettings() {
  return useAppStore(
    useShallow((state) => ({
      readiness: state.readiness,
      refreshReadiness: state.refreshReadiness,
      calibrateAmbient: state.calibrateAmbient,
      requestMicrophonePermission: state.requestMicrophonePermission,
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
    })),
  );
}
