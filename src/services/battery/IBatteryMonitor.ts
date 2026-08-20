/**
 * Charge snapshot for the in-session save-and-stop guard (ADR-34).
 * `level` is 0–1, or `< 0` when the OS has not reported a value.
 */
export type BatterySnapshot = {
  readonly level: number;
  readonly charging: boolean;
};

/**
 * Battery port. The store never imports `expo-battery`; the composition root injects this.
 */
export interface IBatteryMonitor {
  getSnapshot(): Promise<BatterySnapshot>;
  subscribe(listener: (snapshot: BatterySnapshot) => void): () => void;
}
