import {
  addBatteryLevelListener,
  addBatteryStateListener,
  BatteryState,
  getBatteryLevelAsync,
  getBatteryStateAsync,
} from 'expo-battery';

import type { BatterySnapshot, IBatteryMonitor } from './IBatteryMonitor';

function isCharging(state: BatteryState): boolean {
  return state === BatteryState.CHARGING || state === BatteryState.FULL;
}

/** Production adapter over `expo-battery`. Constructed only at the composition root. */
export class ExpoBatteryMonitor implements IBatteryMonitor {
  async getSnapshot(): Promise<BatterySnapshot> {
    const [level, state] = await Promise.all([getBatteryLevelAsync(), getBatteryStateAsync()]);
    return { level, charging: isCharging(state) };
  }

  subscribe(listener: (snapshot: BatterySnapshot) => void): () => void {
    let level = -1;
    let charging = false;

    const emit = (): void => {
      listener({ level, charging });
    };

    const levelSub = addBatteryLevelListener(({ batteryLevel }) => {
      level = batteryLevel;
      emit();
    });
    const stateSub = addBatteryStateListener(({ batteryState }) => {
      charging = isCharging(batteryState);
      emit();
    });

    void this.getSnapshot().then((snapshot) => {
      level = snapshot.level;
      charging = snapshot.charging;
      emit();
    });

    return () => {
      levelSub.remove();
      stateSub.remove();
    };
  }
}
