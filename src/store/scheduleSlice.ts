import type { LocalTimeOfDay, SleepSchedule } from '@/types';

import type { StoreDependencies } from './container';
import type { Result } from './result';

/**
 * Sleep schedule slice — bedtime, wake time, and the automatic-tracking opt-in (ADR-31).
 *
 * Defaults match a fresh install: no times, tracking off. The store never writes the
 * opt-in true unless the user asks. Persistence goes through ISleepScheduleService.
 *
 * The opt-in flag is applied to the store immediately so the Settings switch can animate
 * without waiting on SQLite. In-flight `loadSchedule` calls are ignored after a write so
 * a slow boot read cannot snap the switch back off.
 */
export type ScheduleSlice = {
  readonly bedtime: LocalTimeOfDay | null;
  readonly wakeTime: LocalTimeOfDay | null;
  readonly automaticTrackingEnabled: boolean;

  loadSchedule: () => Promise<Result<SleepSchedule>>;
  setBedtime: (time: LocalTimeOfDay | null) => Promise<Result<void>>;
  setWakeTime: (time: LocalTimeOfDay | null) => Promise<Result<void>>;
  setAutomaticTrackingEnabled: (enabled: boolean) => Promise<Result<void>>;
};

type SetState = (partial: Partial<ScheduleSlice>) => void;

const EMPTY_SCHEDULE: Pick<
  ScheduleSlice,
  'bedtime' | 'wakeTime' | 'automaticTrackingEnabled'
> = {
  bedtime: null,
  wakeTime: null,
  automaticTrackingEnabled: false,
};

export function createScheduleSlice(deps: StoreDependencies, set: SetState): ScheduleSlice {
  let writeEpoch = 0;

  return {
    ...EMPTY_SCHEDULE,

    async loadSchedule() {
      const ticket = writeEpoch;
      const result = await deps.sleepScheduleService.getSchedule();
      if (result.ok && ticket === writeEpoch) {
        set({
          bedtime: result.value.bedtime,
          wakeTime: result.value.wakeTime,
          automaticTrackingEnabled: result.value.automaticTrackingEnabled,
        });
      }
      return result;
    },

    async setBedtime(time) {
      writeEpoch += 1;
      const result = await deps.sleepScheduleService.setBedtime(time);
      if (result.ok) {
        set({ bedtime: time });
      }
      return result;
    },

    async setWakeTime(time) {
      writeEpoch += 1;
      const result = await deps.sleepScheduleService.setWakeTime(time);
      if (result.ok) {
        set({ wakeTime: time });
      }
      return result;
    },

    async setAutomaticTrackingEnabled(enabled) {
      const ticket = (writeEpoch += 1);
      set({ automaticTrackingEnabled: enabled });
      const result = await deps.sleepScheduleService.setAutomaticTrackingEnabled(enabled);
      if (!result.ok && ticket === writeEpoch) {
        set({ automaticTrackingEnabled: !enabled });
      }
      return result;
    },
  };
}
