import type { IBatteryMonitor } from '@/services/battery/IBatteryMonitor';
import type { ReadinessSignalsSnapshot } from '@/types';

import type {
  IEnvironmentMonitor,
  IInteractionMonitor,
  IMotionMonitor,
  IReadinessSignals,
} from './IReadinessSignals';

/**
 * Combines charging, interaction, motion, and environment into one snapshot.
 * Unknown motion/environment stay `null` so the reducer can skip those checks.
 */
export class ReadinessSignals implements IReadinessSignals {
  constructor(
    private readonly battery: IBatteryMonitor,
    private readonly interaction: IInteractionMonitor,
    private readonly motion: IMotionMonitor,
    private readonly environment: IEnvironmentMonitor,
  ) {}

  async getSnapshot(): Promise<ReadinessSignalsSnapshot> {
    const battery = await this.battery.getSnapshot();
    return this.compose(battery.level, battery.charging);
  }

  subscribe(listener: (snapshot: ReadinessSignalsSnapshot) => void): () => void {
    let level = -1;
    let charging = false;

    const emit = (): void => {
      listener(this.compose(level, charging));
    };

    const unsubBattery = this.battery.subscribe((snapshot) => {
      level = snapshot.level;
      charging = snapshot.charging;
      emit();
    });
    const unsubInteraction = this.interaction.subscribe(() => {
      emit();
    });
    const unsubMotion = this.motion.subscribe(() => {
      emit();
    });
    const unsubEnvironment = this.environment.subscribe(() => {
      emit();
    });

    void this.battery.getSnapshot().then((snapshot) => {
      level = snapshot.level;
      charging = snapshot.charging;
      emit();
    });

    return () => {
      unsubBattery();
      unsubInteraction();
      unsubMotion();
      unsubEnvironment();
    };
  }

  setMotionSamplingEnabled(enabled: boolean): void {
    this.motion.setSamplingEnabled(enabled);
  }

  private compose(batteryLevel: number, charging: boolean): ReadinessSignalsSnapshot {
    return {
      charging,
      batteryLevel,
      interacting: this.interaction.getInteracting(),
      phoneSettled: this.motion.getPhoneSettled(),
      environmentAcceptable: this.environment.getAcceptable(),
    };
  }
}
