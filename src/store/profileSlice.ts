import type { UserProfile } from '@/types';

import type { StoreDependencies } from './container';
import type { Result } from './result';

/**
 * Profile slice — the optional greeting name and the onboarding flag (ADR-30).
 *
 * Initial state is seeded synchronously from a boot read (see `createAppStore`) so the
 * onboarding gate never flashes the tabs before redirecting.
 */
export type ProfileSlice = {
  readonly displayName: string | null;
  readonly onboarded: boolean;

  /** Re-read the persisted profile into the store (e.g. after Settings edits). */
  loadProfile: () => Promise<Result<UserProfile>>;
  /** Persist the greeting name (blank clears it) and reflect it in the store. */
  setDisplayName: (name: string | null) => Promise<Result<void>>;
  /**
   * Finish onboarding: optionally store the entered name, then set the onboarded flag so
   * the gate stops redirecting.
   */
  completeOnboarding: (name?: string | null) => Promise<Result<void>>;
};

type SetState = (partial: Partial<ProfileSlice>) => void;

export function createProfileSlice(
  deps: StoreDependencies,
  set: SetState,
  initial: UserProfile,
): ProfileSlice {
  return {
    displayName: initial.displayName,
    onboarded: initial.onboarded,

    async loadProfile() {
      const result = await deps.profileService.getProfile();
      if (result.ok) {
        set({
          displayName: result.value.displayName,
          onboarded: result.value.onboarded,
        });
      }
      return result;
    },

    async setDisplayName(name) {
      const result = await deps.profileService.setDisplayName(name);
      if (result.ok) {
        // Mirror the service's normalization: trim + empty-to-null.
        const trimmed = name?.trim() ?? '';
        set({ displayName: trimmed.length > 0 ? trimmed : null });
      }
      return result;
    },

    async completeOnboarding(name) {
      if (name !== undefined) {
        const named = await deps.profileService.setDisplayName(name);
        if (!named.ok) {
          return named;
        }
        const trimmed = name?.trim() ?? '';
        set({ displayName: trimmed.length > 0 ? trimmed : null });
      }
      const result = await deps.profileService.completeOnboarding();
      if (result.ok) {
        set({ onboarded: true });
      }
      return result;
    },
  };
}
