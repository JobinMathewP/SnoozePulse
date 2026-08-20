import { AppState, Platform, type AppStateStatus } from 'react-native';

import type { NotificationResponse } from 'expo-notifications';

import type { INotificationService, AnnounceCompletedSessionInput } from './INotificationService';
import {
  morningFireAt,
  sessionIdFromNotificationData,
  summaryNotificationTrigger,
} from './morningFireAt';
import { MORNING_NOTIFICATION, summaryNotificationId } from './notificationConstants';

export type AppStateReader = {
  readonly currentState: AppStateStatus | string;
};

type NotificationsModule = typeof import('expo-notifications');

let cachedNative: NotificationsModule | null | undefined;

/**
 * Load `expo-notifications` only when a method runs. A static import crashes the
 * whole JS tree (including the error overlay) if the APK was built before the
 * package was installed.
 */
async function loadNative(): Promise<NotificationsModule | null> {
  if (cachedNative !== undefined) {
    return cachedNative;
  }
  try {
    cachedNative = await import('expo-notifications');
    return cachedNative;
  } catch (cause: unknown) {
    console.warn('[notifications] native module unavailable', cause);
    cachedNative = null;
    return null;
  }
}

/**
 * Production adapter over `expo-notifications`. Constructed only at the composition root.
 * Does not register for push; local DATE triggers use Android exact alarms when granted.
 */
export class ExpoNotificationService implements INotificationService {
  private readonly appState: AppStateReader;
  private handlerInstalled = false;
  private lastHandledIdentifier: string | null = null;

  constructor(appState: AppStateReader = AppState) {
    this.appState = appState;
  }

  async prepare(): Promise<void> {
    const Notifications = await loadNative();
    if (Notifications === null) {
      return;
    }
    try {
      this.installHandler(Notifications);
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(MORNING_NOTIFICATION.channelId, {
          name: MORNING_NOTIFICATION.channelName,
          importance: Notifications.AndroidImportance.HIGH,
        });
      }
      const existing = await Notifications.getPermissionsAsync();
      if (this.allowsNotifications(Notifications, existing)) {
        return;
      }
      await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: true, allowBadge: false },
      });
    } catch (cause: unknown) {
      console.warn('[notifications] prepare failed', cause);
    }
  }

  async announceCompletedSession(input: AnnounceCompletedSessionInput): Promise<void> {
    const Notifications = await loadNative();
    if (Notifications === null) {
      return;
    }
    try {
      await this.prepare();
      const now = input.now ?? new Date();
      const fireAt = morningFireAt(input.bedtime, input.wakeTime, now);
      if (this.shouldSkipForeground(fireAt, now)) {
        return;
      }

      const identifier = summaryNotificationId(input.sessionId);
      await Notifications.cancelScheduledNotificationAsync(identifier);

      const planned = summaryNotificationTrigger(fireAt, now);
      const trigger =
        planned === null
          ? { channelId: MORNING_NOTIFICATION.channelId }
          : {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: planned.date,
              channelId: MORNING_NOTIFICATION.channelId,
            };

      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: MORNING_NOTIFICATION.title,
          body: MORNING_NOTIFICATION.body,
          data: { [MORNING_NOTIFICATION.dataSessionIdKey]: input.sessionId },
          sound: true,
        },
        trigger,
      });
    } catch (cause: unknown) {
      console.warn('[notifications] announce failed', cause);
    }
  }

  subscribeToOpen(listener: (sessionId: string) => void): () => void {
    let removed = false;
    let unsub: (() => void) | undefined;

    void loadNative().then((Notifications) => {
      if (Notifications === null || removed) {
        return;
      }
      const deliver = (response: NotificationResponse | null): void => {
        if (response === null) {
          return;
        }
        const sessionId = sessionIdFromNotificationData(
          response.notification.request.content.data,
        );
        if (sessionId === null) {
          return;
        }
        const identifier = response.notification.request.identifier;
        if (identifier === this.lastHandledIdentifier) {
          return;
        }
        this.lastHandledIdentifier = identifier;
        listener(sessionId);
        Notifications.clearLastNotificationResponse();
      };

      deliver(Notifications.getLastNotificationResponse());
      const sub = Notifications.addNotificationResponseReceivedListener(deliver);
      unsub = () => {
        sub.remove();
      };
    });

    return () => {
      removed = true;
      unsub?.();
    };
  }

  private installHandler(Notifications: NotificationsModule): void {
    if (this.handlerInstalled) {
      return;
    }
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    this.handlerInstalled = true;
  }

  private allowsNotifications(
    Notifications: NotificationsModule,
    settings: Awaited<ReturnType<NotificationsModule['getPermissionsAsync']>>,
  ): boolean {
    return (
      settings.granted ||
      settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  }

  private shouldSkipForeground(fireAt: Date, now: Date): boolean {
    if (this.appState.currentState !== 'active') {
      return false;
    }
    return fireAt.getTime() <= now.getTime();
  }
}
