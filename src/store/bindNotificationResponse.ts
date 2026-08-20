import type { INotificationService } from '@/services';
import type { StoreApi } from 'zustand/vanilla';

import type { AppStore } from './createAppStore';

/**
 * Cold-start or in-process tap of the morning Summary notification. Sets the same
 * `lastCompletedSessionId` AutoSessionGate already uses for `/session/[id]/summary`.
 * Does not steal an in-progress recording.
 */
export function bindNotificationResponse(
  store: StoreApi<AppStore>,
  notifications: INotificationService,
): () => void {
  void notifications.prepare();
  return notifications.subscribeToOpen((sessionId) => {
    const sessionState = store.getState().sessionState;
    if (sessionState === 'RECORDING' || sessionState === 'PAUSED') {
      return;
    }
    store.setState({ lastCompletedSessionId: sessionId });
  });
}
