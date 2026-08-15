import type { CalibrationResult, MicrophonePermissionStatus } from '@/types';
import type { SessionReadiness } from '@/services';

import type { StoreDependencies } from './container';
import type { Result } from './result';

/**
 * Settings / readiness slice — Home readiness checks route through the store, not
 * services directly (ADR-12).
 */
export type SettingsSlice = {
  readonly readiness: SessionReadiness | null;

  refreshReadiness: () => Promise<Result<SessionReadiness>>;
  calibrateAmbient: () => Promise<Result<CalibrationResult>>;
  /** Prompt for mic access, then refresh readiness cards. */
  requestMicrophonePermission: () => Promise<Result<MicrophonePermissionStatus>>;
  /** Delete every saved session, its events, buckets, and snippet files (ADR-30). */
  deleteAllSleepData: () => Promise<Result<void>>;
  /**
   * Development-only: populate the database with synthetic nights so the calendar and history
   * can be exercised without recording. Only invoked from a `__DEV__`-guarded Settings row.
   */
  seedDemoData: () => Promise<Result<number>>;
};

type SetState = (partial: Partial<SettingsSlice>) => void;

export function createSettingsSlice(
  deps: StoreDependencies,
  set: SetState,
): SettingsSlice {
  return {
    readiness: null,

    async refreshReadiness() {
      const result = await deps.sleepService.checkReadiness();
      if (result.ok) {
        set({ readiness: result.value });
      }
      return result;
    },

    async calibrateAmbient() {
      const result = await deps.sleepService.calibrateAmbient();
      if (result.ok) {
        const readiness = await deps.sleepService.checkReadiness();
        if (readiness.ok) {
          set({ readiness: readiness.value });
        }
      }
      return result;
    },

    async requestMicrophonePermission() {
      const result = await deps.audioService.requestPermission();
      const readiness = await deps.sleepService.checkReadiness();
      if (readiness.ok) {
        set({ readiness: readiness.value });
      }
      return result;
    },

    async deleteAllSleepData() {
      return deps.sleepService.deleteAllSessions();
    },

    async seedDemoData() {
      return deps.sleepService.seedDemoNights(45);
    },
  };
}
