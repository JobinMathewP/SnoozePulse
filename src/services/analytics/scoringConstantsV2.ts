/**
 * V2 scoring constants — the only place M6 weightings and band thresholds live
 * (ADR-10, ADR-26).
 *
 * V1 constants remain compiled for archival reads only; every write path targets V2
 * after Task 6.5. These are **not** clinical or medical measures — the app produces a
 * documented weighted heuristic over the classifier-driven session statistics.
 *
 * All callers must import the pure functions in `sleepScoreV2.ts` / `snoreScoreV2.ts`
 * rather than reading these constants directly, so a future V3 swap stays a
 * one-folder change.
 */

import type { SnoreScoreBand } from '@/types';

/**
 * Sleep score V2 (0–100, higher is better).
 *
 * Four weighted contributions, each normalized to 0–1:
 * - **quietShare**: `1 − snoringShareByConfidence`. Confidence-weighted quiet fraction of
 *   the night; the M5 signal, but weighted by classifier certainty rather than dB.
 * - **lowRate**: `1 − clamp01(snoresPerHour / snoreRatePerHourCap)`. Fewer episodes /
 *   hour ⇒ higher.
 * - **regularity**: `episodeRegularity` — high when episodes are evenly spaced (the
 *   Home / Summary "consistent snoring" signal); low when they are chaotic.
 * - **spectralConsistency**: reserved for the M6-post spectral-analysis stage. Neutral
 *   (0.5) until spectral peaks are wired, so the weight only shifts scores meaningfully
 *   once that data is real.
 */
export const SLEEP_SCORE_V2 = {
  weightQuietShare: 0.45,
  weightLowSnoreRate: 0.3,
  weightRegularity: 0.15,
  weightSpectralConsistency: 0.1,
  /** Episodes / hour at or above this map to a 0 contribution for the rate term. */
  snoreRatePerHourCap: 40,
} as const;

/**
 * Snore score V2 (0–100, higher is worse).
 *
 * Four weighted contributions, all normalized to 0–1:
 * - **rateTerm**: `clamp01(snoresPerHour / snoreRatePerHourCap)`. More episodes ⇒ worse.
 * - **shareTerm**: `clamp01(snoringShareByConfidence / snoringShareCap)`. Confidence-
 *   weighted snoring share of the night.
 * - **confidenceTerm**: `clamp01(avgConfidence)`. A night full of high-confidence
 *   episodes scores worse than one full of borderline detections at the same count.
 * - **spectralChaos**: `1 − spectralConsistency`. Reserved for future spectral analysis;
 *   neutral (0.5) until wired.
 *
 * Higher `value` means more snoring burden. Not a clinical AHI or diagnosis (ADR-10).
 */
export const SNORE_SCORE_V2 = {
  weightSnoreRate: 0.35,
  weightSnoringShare: 0.35,
  weightConfidence: 0.2,
  weightSpectralChaos: 0.1,
  snoreRatePerHourCap: 40,
  /** Confidence-weighted snoring duration / session duration at or above this = 1. */
  snoringShareCap: 0.25,
} as const;

/**
 * Presentation scale for the V2 snore score. Same shape and boundaries as V1 so summary
 * cards and the History strip remain visually stable across the score swap.
 *
 * Ordered ascending by `maxInclusive`. The first row where `score <= maxInclusive`
 * supplies **both** the severity band and the filled-dot count (Task 4.5 acceptance
 * pattern preserved).
 */
export const SNORE_SCORE_SCALE_V2: readonly {
  readonly maxInclusive: number;
  readonly band: SnoreScoreBand;
  readonly filledDots: number;
}[] = [
  { maxInclusive: 19, band: 'mild', filledDots: 1 },
  { maxInclusive: 39, band: 'mild', filledDots: 2 },
  { maxInclusive: 54, band: 'moderate', filledDots: 3 },
  { maxInclusive: 69, band: 'moderate', filledDots: 4 },
  { maxInclusive: 100, band: 'heavy', filledDots: 5 },
] as const;
