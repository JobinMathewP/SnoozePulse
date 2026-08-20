import type { MissedNight, MissedNightReason } from '@/types';

import type { StoreDependencies } from './container';
import type { Result } from './result';

/** Honest skipped / failed automatic nights (feature PRD §15) plus ADR-34 caption flag. */
export type NightOutcomeSlice = {
  readonly missedNight: MissedNight | null;
  /** True after a save-and-stop so Home can caption that night without a schema flag. */
  readonly lastCompletedWasBatterySave: boolean;

  loadMissedNight: () => Promise<Result<MissedNight | null>>;
  recordMissedNight: (reason: MissedNightReason, nightIso: string, atMs: number) => Promise<Result<MissedNight>>;
  clearMissedNight: () => Promise<Result<void>>;
  markLastCompletedAsBatterySave: () => void;
  clearBatterySaveFlag: () => void;
};

type SetState = (partial: Partial<NightOutcomeSlice>) => void;

export function createNightOutcomeSlice(
  deps: StoreDependencies,
  set: SetState,
): NightOutcomeSlice {
  return {
    missedNight: null,
    lastCompletedWasBatterySave: false,

    async loadMissedNight() {
      const result = await deps.nightOutcomeService.getMissedNight();
      if (result.ok) {
        set({ missedNight: result.value });
      }
      return result;
    },

    async recordMissedNight(reason, nightIso, atMs) {
      const result = await deps.nightOutcomeService.recordMissedNight(reason, nightIso, atMs);
      if (result.ok) {
        set({ missedNight: result.value });
      }
      return result;
    },

    async clearMissedNight() {
      const result = await deps.nightOutcomeService.clearMissedNight();
      if (result.ok) {
        set({ missedNight: null });
      }
      return result;
    },

    markLastCompletedAsBatterySave() {
      set({ lastCompletedWasBatterySave: true });
    },

    clearBatterySaveFlag() {
      set({ lastCompletedWasBatterySave: false });
    },
  };
}
