import type { IBatteryMonitor } from '@/services/battery/IBatteryMonitor';

import { AccelerometerMotionMonitor } from './AccelerometerMotionMonitor';
import { AppStateInteractionMonitor } from './AppStateInteractionMonitor';
import type { IReadinessSignals } from './IReadinessSignals';
import { ReadinessSignals } from './ReadinessSignals';
import { UnknownEnvironmentMonitor } from './UnknownEnvironmentMonitor';

/**
 * Production graph: live charging, AppState interaction, accelerometer motion.
 * Environment stays unknown until a short native sample exists. The store never
 * constructs this — composition root / Task 7.5 injects it.
 */
export function createReadinessSignals(battery: IBatteryMonitor): IReadinessSignals {
  return new ReadinessSignals(
    battery,
    new AppStateInteractionMonitor(),
    new AccelerometerMotionMonitor(),
    new UnknownEnvironmentMonitor(),
  );
}
