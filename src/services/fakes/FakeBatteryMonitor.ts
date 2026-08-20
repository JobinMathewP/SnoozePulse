import type { BatterySnapshot, IBatteryMonitor } from '../battery/IBatteryMonitor';

/** In-memory battery port for the save-and-stop guard (ADR-34). */
export class FakeBatteryMonitor implements IBatteryMonitor {
  private snapshot: BatterySnapshot = { level: 1, charging: false };
  private readonly listeners = new Set<(snapshot: BatterySnapshot) => void>();

  setSnapshot(snapshot: BatterySnapshot): void {
    this.snapshot = snapshot;
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  async getSnapshot(): Promise<BatterySnapshot> {
    return this.snapshot;
  }

  subscribe(listener: (snapshot: BatterySnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
