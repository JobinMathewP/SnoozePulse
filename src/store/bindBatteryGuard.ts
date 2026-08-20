import type { IBatteryMonitor } from '@/services';
import { shouldSaveAndStopForBattery } from '@/utils';
import type { StoreApi } from 'zustand/vanilla';

import type { AppStore } from './createAppStore';

/**
 * Stop and **save** an in-progress session when the pack is at or below 20% and
 * not charging (ADR-34). Lives at the composition root so a locked Active Session
 * (and later auto-start without that route) still flushes SQLite before the OS
 * kills the process.
 */
export function bindBatteryGuard(
  store: StoreApi<AppStore>,
  battery: IBatteryMonitor,
): () => void {
  let latest = { level: -1, charging: false };
  let inFlight = false;

  const considerStop = (): void => {
    if (inFlight) {
      return;
    }
    if (!shouldSaveAndStopForBattery(latest.level, latest.charging)) {
      return;
    }
    const sessionState = store.getState().sessionState;
    if (sessionState !== 'RECORDING' && sessionState !== 'PAUSED') {
      return;
    }
    inFlight = true;
    void store
      .getState()
      .stopSession()
      .then((result) => {
        if (!result.ok) {
          console.warn('[battery] save-and-stop failed', result.error);
          return;
        }
        store.getState().markLastCompletedAsBatterySave();
      })
      .finally(() => {
        inFlight = false;
      });
  };

  const unsubBattery = battery.subscribe((snapshot) => {
    latest = snapshot;
    considerStop();
  });

  const unsubStore = store.subscribe((state, prev) => {
    if (state.sessionState === prev.sessionState) {
      return;
    }
    considerStop();
  });

  void battery.getSnapshot().then((snapshot) => {
    latest = snapshot;
    considerStop();
  });

  return () => {
    unsubBattery();
    unsubStore();
  };
}
