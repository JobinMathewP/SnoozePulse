import type { IMotionMonitor } from './IReadinessSignals';

/**
 * Phone-settled motion placeholder. Always `null` so the reducer can fall back
 * to schedule + idle + environment instead of inventing a settled phone (ADR-31).
 * A live accelerometer adapter needs `expo-sensors` or a native module — not
 * installed in this task.
 *
 * Motion, when wired, measures the **phone**, not the person. `false` (moving)
 * still delays auto-start; missing data does not.
 */
export class StubMotionMonitor implements IMotionMonitor {
  getPhoneSettled(): boolean | null {
    return null;
  }

  subscribe(listener: (phoneSettled: boolean | null) => void): () => void {
    listener(null);
    return () => undefined;
  }

  setSamplingEnabled(_enabled: boolean): void {
    return;
  }
}
