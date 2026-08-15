import type { ISettingsRepository, Result } from '@/repositories';
import { ok } from '@/repositories';
import type { UserProfile } from '@/types';

import type { IProfileService } from './IProfileService';

/** `app_settings` keys owned by the profile (ADR-30). Kept private to this module. */
const KEY_DISPLAY_NAME = 'profile.displayName';
const KEY_ONBOARDED = 'profile.onboarded';

/** Max stored greeting-name length. Long enough for a real name, short enough for a header. */
const MAX_NAME_LENGTH = 40;

/**
 * Reads and writes the optional display name and the onboarding flag via the KV settings
 * repository. Business rules (trimming, length cap, boolean coercion) live here, not in the
 * repository (ADR-19).
 */
export class ProfileService implements IProfileService {
  constructor(private readonly settingsRepository: ISettingsRepository) {}

  async getProfile(): Promise<Result<UserProfile>> {
    const nameResult = await this.settingsRepository.get(KEY_DISPLAY_NAME);
    if (!nameResult.ok) {
      return nameResult;
    }
    const onboardedResult = await this.settingsRepository.get(KEY_ONBOARDED);
    if (!onboardedResult.ok) {
      return onboardedResult;
    }

    const displayName = normalizeName(nameResult.value);
    return ok({
      displayName,
      onboarded: onboardedResult.value === 'true',
    });
  }

  async setDisplayName(name: string | null): Promise<Result<void>> {
    const normalized = normalizeName(name);
    if (normalized === null) {
      // Clearing the name removes the row so `getProfile` falls back to the neutral greeting.
      return this.settingsRepository.remove(KEY_DISPLAY_NAME);
    }
    return this.settingsRepository.set(KEY_DISPLAY_NAME, normalized);
  }

  completeOnboarding(): Promise<Result<void>> {
    return this.settingsRepository.set(KEY_ONBOARDED, 'true');
  }
}

/** Trim, collapse to `null` when empty, and cap length. Shared by read and write paths. */
function normalizeName(raw: string | null): string | null {
  if (raw === null) {
    return null;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed.slice(0, MAX_NAME_LENGTH);
}
