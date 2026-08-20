import { Accelerometer, type AccelerometerMeasurement } from 'expo-sensors';

import type { IMotionMonitor } from './IReadinessSignals';
import { READINESS } from './readinessConstants';
import { classifyAcceleration } from './readinessMotion';

export type AccelerometerPort = {
  isAvailableAsync(): Promise<boolean>;
  getPermissionsAsync(): Promise<{ granted: boolean }>;
  setUpdateInterval(intervalMs: number): void;
  addListener(listener: (measurement: AccelerometerMeasurement) => void): { remove(): void };
};

/**
 * Phone-settled from the accelerometer at ~1 Hz. Does not prompt at boot — if
 * permission is undetermined or denied, `phoneSettled` stays `null` and auto-start
 * falls back to the other readiness signals.
 *
 * Unsubscribe stops the sensor. Do not leave this running overnight after monitoring
 * has started (Task 7.5).
 */
export class AccelerometerMotionMonitor implements IMotionMonitor {
  private settled: boolean | null = null;
  private stillSinceMs: number | null = null;
  private nativeSub: { remove(): void } | null = null;
  private startInFlight: Promise<void> | null = null;
  private readonly listeners = new Set<(phoneSettled: boolean | null) => void>();

  constructor(
    private readonly accelerometer: AccelerometerPort = Accelerometer,
    private readonly now: () => number = Date.now,
  ) {}

  getPhoneSettled(): boolean | null {
    return this.settled;
  }

  subscribe(listener: (phoneSettled: boolean | null) => void): () => void {
    this.listeners.add(listener);
    listener(this.settled);
    void this.ensureListening();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stopListening();
      }
    };
  }

  private async ensureListening(): Promise<void> {
    if (this.nativeSub || this.startInFlight) {
      return;
    }
    this.startInFlight = this.startListening();
    try {
      await this.startInFlight;
    } finally {
      this.startInFlight = null;
    }
  }

  private async startListening(): Promise<void> {
    const available = await this.accelerometer.isAvailableAsync();
    if (!available) {
      this.setSettled(null);
      return;
    }
    const permission = await this.accelerometer.getPermissionsAsync();
    if (!permission.granted) {
      this.setSettled(null);
      return;
    }
    this.accelerometer.setUpdateInterval(READINESS.MOTION_UPDATE_INTERVAL_MS);
    this.nativeSub = this.accelerometer.addListener((measurement) => {
      this.onSample(measurement.x, measurement.y, measurement.z);
    });
  }

  private stopListening(): void {
    this.nativeSub?.remove();
    this.nativeSub = null;
    this.stillSinceMs = null;
  }

  private onSample(x: number, y: number, z: number): void {
    const kind = classifyAcceleration(x, y, z);
    const now = this.now();
    if (kind === 'unknown') {
      this.stillSinceMs = null;
      this.setSettled(null);
      return;
    }
    if (kind === 'moving') {
      this.stillSinceMs = null;
      this.setSettled(false);
      return;
    }
    if (this.stillSinceMs === null) {
      this.stillSinceMs = now;
    }
    if (now - this.stillSinceMs >= READINESS.MOTION_STILL_STREAK_MS) {
      this.setSettled(true);
    } else {
      this.setSettled(false);
    }
  }

  private setSettled(next: boolean | null): void {
    if (this.settled === next) {
      return;
    }
    this.settled = next;
    for (const listener of this.listeners) {
      listener(next);
    }
  }
}
