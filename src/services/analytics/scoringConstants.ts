/**
 * V1 scoring constants — the only place weightings and band thresholds live (ADR-10).
 *
 * These are **not** clinical or medical measures. They are a documented placeholder so
 * Summary / History can render real numbers until V2 replaces this module wholesale.
 * Callers must import the pure functions in `sleepScore.ts` / `snoreScore.ts` rather than
 * reading these constants directly, so a V2 swap stays a one-folder change.
 */

/**
 * Sleep score (0–100, higher is better).
 *
 * Three contributions, each normalized to 0–1 then weighted:
 * - Quiet share: fraction of the night that was *not* snoring.
 * - Low snore rate: fewer episodes per hour scores higher.
 * - Low peak: quieter peak loudness scores higher.
 */
export const SLEEP_SCORE_V1 = {
  weightQuietShare: 0.45,
  weightLowSnoreRate: 0.35,
  weightLowPeak: 0.2,
  /** Episodes / hour at or above this map to a 0 contribution for the rate term. */
  snoreRatePerHourCap: 40,
  /** Peak dB at or below this maps to a full (1) peak contribution. */
  peakDbFloor: 30,
  /** Peak dB at or above this maps to a 0 peak contribution. */
  peakDbCeiling: 80,
} as const;

/**
 * Snore score (0–100, higher is worse).
 *
 * Same three signals as sleep score, inverted: more snoring / louder peaks raise the score.
 * Mild / Moderate / Heavy and the five-dot fill both read {@link SNORE_SCORE_SCALE_V1}
 * so the label and dots cannot drift apart (Task 4.5 acceptance).
 */
export const SNORE_SCORE_V1 = {
  weightSnoreRate: 0.4,
  weightSnoringShare: 0.35,
  weightPeakDb: 0.25,
  snoreRatePerHourCap: 40,
  /** Snoring duration / session duration at or above this is a full share contribution. */
  snoringShareCap: 0.25,
  peakDbFloor: 30,
  peakDbCeiling: 80,
} as const;

/**
 * Single presentation scale for a snore score value (Task 4.5).
 *
 * Ordered ascending by `maxInclusive`. The first row where `score <= maxInclusive`
 * supplies **both** the severity band and the filled-dot count — there is no second table.
 *
 * Boundaries preserve prior V1 behaviour (and history-screen.jpg mock alignment):
 * - Mild: 0–39 (1–2 dots)
 * - Moderate: 40–69 (3–4 dots)
 * - Heavy: 70–100 (5 dots)
 */
export const SNORE_SCORE_SCALE_V1 = [
  { maxInclusive: 19, band: 'mild', filledDots: 1 },
  { maxInclusive: 39, band: 'mild', filledDots: 2 },
  { maxInclusive: 54, band: 'moderate', filledDots: 3 },
  { maxInclusive: 69, band: 'moderate', filledDots: 4 },
  { maxInclusive: 100, band: 'heavy', filledDots: 5 },
] as const;
