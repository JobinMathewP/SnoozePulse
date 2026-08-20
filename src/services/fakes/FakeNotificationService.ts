import type { AnnounceCompletedSessionInput, INotificationService } from '../notifications/INotificationService';

/** In-memory notification port for tests. */
export class FakeNotificationService implements INotificationService {
  readonly announces: AnnounceCompletedSessionInput[] = [];
  prepared = false;
  private readonly listeners = new Set<(sessionId: string) => void>();

  async prepare(): Promise<void> {
    this.prepared = true;
  }

  async announceCompletedSession(input: AnnounceCompletedSessionInput): Promise<void> {
    this.announces.push(input);
  }

  subscribeToOpen(listener: (sessionId: string) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emitOpen(sessionId: string): void {
    for (const listener of this.listeners) {
      listener(sessionId);
    }
  }
}
