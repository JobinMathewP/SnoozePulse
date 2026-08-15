import type { Result } from '@/repositories';
import type { UserProfile } from '@/types';

/**
 * Onboarding state and the optional greeting name (ADR-30).
 *
 * Wraps `ISettingsRepository` and owns the key names + string/boolean coercion so the
 * store and UI deal in a typed {@link UserProfile}, never raw KV strings (ADR-19). Contains
 * no SQL itself.
 */
export interface IProfileService {
  /** Load the current profile. Missing keys resolve to a skipped, un-onboarded profile. */
  getProfile(): Promise<Result<UserProfile>>;

  /**
   * Persist the greeting name. A blank / whitespace-only value clears it back to `null`
   * so the greeting falls back to the neutral copy.
   */
  setDisplayName(name: string | null): Promise<Result<void>>;

  /** Mark first-run onboarding as finished so the gate stops redirecting. */
  completeOnboarding(): Promise<Result<void>>;
}
