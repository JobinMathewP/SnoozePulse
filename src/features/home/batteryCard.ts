import {
  BATTERY_LOW_THRESHOLD,
  BATTERY_READY_THRESHOLD,
  batteryCopy,
} from './copy';

export type BatteryCardKind = 'unknown' | 'low' | 'caution' | 'ready';

export type BatteryCardCopy = {
  readonly kind: BatteryCardKind;
  readonly title: string;
  readonly subtitle: string;
};

/**
 * Home battery row. "Sufficient for overnight recording" is only honest above 50%.
 * 21–50% is caution, not Battery Ready. ≤20% stays Battery Low (ADR-34).
 */
export function batteryCardCopyFor(level: number, charging: boolean): BatteryCardCopy {
  if (level < 0) {
    return {
      kind: 'unknown',
      title: batteryCopy.okTitle,
      subtitle: batteryCopy.okSubtitle,
    };
  }
  if (level <= BATTERY_LOW_THRESHOLD) {
    return {
      kind: 'low',
      title: batteryCopy.lowTitle,
      subtitle: batteryCopy.lowSubtitle,
    };
  }
  if (level <= BATTERY_READY_THRESHOLD) {
    return charging
      ? {
          kind: 'caution',
          title: batteryCopy.cautionChargingTitle,
          subtitle: batteryCopy.cautionChargingSubtitle,
        }
      : {
          kind: 'caution',
          title: batteryCopy.cautionTitle,
          subtitle: batteryCopy.cautionSubtitle,
        };
  }
  return {
    kind: 'ready',
    title: batteryCopy.okTitle,
    subtitle: batteryCopy.okSubtitle,
  };
}
