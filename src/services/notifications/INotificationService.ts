import type { LocalTimeOfDay } from '@/types';

export type AnnounceCompletedSessionInput = {
  readonly sessionId: string;
  readonly bedtime: LocalTimeOfDay | null;
  readonly wakeTime: LocalTimeOfDay | null;
  readonly now?: Date;
};

/**
 * Local notifications for a saved night. The store never imports `expo-notifications`;
 * the composition root injects this (ADR-12, ADR-18).
 */
export interface INotificationService {
  /** Android channel + OS permission. Safe to call repeatedly; never throws to UI. */
  prepare(): Promise<void>;
  /**
   * After a successful save: present now when the wake window has arrived, otherwise
   * schedule an exact DATE trigger for the end of that window.
   */
  announceCompletedSession(input: AnnounceCompletedSessionInput): Promise<void>;
  /** Tap (including cold start) delivers the completed session id. */
  subscribeToOpen(listener: (sessionId: string) => void): () => void;
}
