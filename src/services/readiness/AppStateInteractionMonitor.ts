import { AppState, type AppStateStatus } from 'react-native';

import type { IInteractionMonitor } from './IReadinessSignals';

export type AppStatePort = {
  readonly currentState: AppStateStatus | string;
  addEventListener(
    type: 'change',
    listener: (state: AppStateStatus | string) => void,
  ): { remove: () => void };
};

/**
 * Delay auto-start while SnoozePulse is in the foreground. `background` is the only
 * non-interacting state — `inactive` (Control Center, incoming call) still counts as
 * using the phone.
 *
 * This does **not** see other apps (YouTube in the foreground while we are
 * backgrounded). Screen-on for that case needs a native adapter; not installed here.
 */
export class AppStateInteractionMonitor implements IInteractionMonitor {
  private readonly appState: AppStatePort;

  constructor(appState: AppStatePort = AppState) {
    this.appState = appState;
  }

  getInteracting(): boolean {
    return isInteracting(this.appState.currentState);
  }

  subscribe(listener: (interacting: boolean) => void): () => void {
    listener(this.getInteracting());
    const sub = this.appState.addEventListener('change', (state) => {
      listener(isInteracting(state));
    });
    return () => {
      sub.remove();
    };
  }
}

export function isInteracting(state: AppStateStatus | string): boolean {
  return state !== 'background';
}
