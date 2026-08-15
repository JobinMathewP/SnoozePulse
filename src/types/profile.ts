/**
 * User-facing preferences captured at onboarding and editable in Settings (ADR-30).
 *
 * Deliberately minimal: SnoozePulse collects an optional first name to personalise the
 * greeting and nothing else — no gender, age, or account. There is no Profile tab
 * (ADR-09); this is a single stored value, not a screen.
 */
export interface UserProfile {
  /** Optional greeting name. `null` when the user skipped or cleared it. */
  readonly displayName: string | null;
  /** True once the first-run onboarding flow has been completed. */
  readonly onboarded: boolean;
}
