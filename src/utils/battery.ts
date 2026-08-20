import { BATTERY_SAVE_THRESHOLD } from './constants';

/**
 * True when an in-progress recording should be stopped and saved because the pack
 * is about to die (ADR-34). Unknown levels (`< 0`) and charging packs never trip this.
 */
export function shouldSaveAndStopForBattery(level: number, charging: boolean): boolean {
  if (charging) {
    return false;
  }
  if (level < 0) {
    return false;
  }
  return level <= BATTERY_SAVE_THRESHOLD;
}
