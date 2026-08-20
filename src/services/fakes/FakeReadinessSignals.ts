import type { ReadinessSignalsSnapshot } from '@/types';

import type { IReadinessSignals } from '../readiness/IReadinessSignals';

const DEFAULT_SNAPSHOT: ReadinessSignalsSnapshot = {
  charging: false,
  batteryLevel: 1,
  interacting: false,
  phoneSettled: null,
  environmentAcceptable: null,
};

/** In-memory readiness signals for tests. */
export class FakeReadinessSignals implements IReadinessSignals {
  private snapshot: ReadinessSignalsSnapshot = DEFAULT_SNAPSHOT;
  private readonly listeners = new Set<(snapshot: ReadinessSignalsSnapshot) => void>();

  setSnapshot(snapshot: Partial<ReadinessSignalsSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...snapshot };
    for (const listener of this.listeners) {
      listener(this.snapshot);
    }
  }

  async getSnapshot(): Promise<ReadinessSignalsSnapshot> {
    return this.snapshot;
  }

  subscribe(listener: (snapshot: ReadinessSignalsSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setMotionSamplingEnabled(_enabled: boolean): void {
    return;
  }
}
