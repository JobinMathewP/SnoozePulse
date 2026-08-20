import { BATTERY_SAVE_THRESHOLD, shouldSaveAndStopForBattery } from '@/utils';

describe('shouldSaveAndStopForBattery', () => {
  it('saves at or below 20% when unplugged', () => {
    expect(BATTERY_SAVE_THRESHOLD).toBe(0.2);
    expect(shouldSaveAndStopForBattery(0.2, false)).toBe(true);
    expect(shouldSaveAndStopForBattery(0.15, false)).toBe(true);
    expect(shouldSaveAndStopForBattery(0.21, false)).toBe(false);
  });

  it('does not stop a charging or unknown pack', () => {
    expect(shouldSaveAndStopForBattery(0.1, true)).toBe(false);
    expect(shouldSaveAndStopForBattery(-1, false)).toBe(false);
  });
});
