import type { ScoreInputs, SleepScore } from '@/types';

import { SLEEP_SCORE_V2 } from './scoringConstantsV2';

/**
 * V2 sleep score — replaces {@link computeSleepScoreV1} wholesale in M6.5 (ADR-10, ADR-26).
 *
 * Pure: no I/O, no mutation, no clinical claims. Output clamped to 0–100 for UI safety.
 *
 * V2 differs from V1 in two ways:
 * - The quiet share is confidence-weighted (`snoringShareByConfidence`), not derived from
 *   raw dB. A loud spike from a passing truck no longer counts as "snoring time".
 * - The peak-dB term is gone. Regularity of episodes replaces it: an evenly-spaced snore
 *   pattern scores better than a chaotic one at the same total count.
 */
export function computeSleepScoreV2(inputs: ScoreInputs): SleepScore {
  const durationHours = Math.max(inputs.sessionDurationMs, 1) / (60 * 60 * 1000);
  const snoreRatePerHour = inputs.snoreCount / durationHours;

  const quietShare = clamp01(1 - clamp01(inputs.snoringShareByConfidence));
  const lowRate = 1 - clamp01(snoreRatePerHour / SLEEP_SCORE_V2.snoreRatePerHourCap);
  const regularity = clamp01(inputs.episodeRegularity);
  const spectralConsistency = clamp01(inputs.spectralConsistency);

  const raw =
    SLEEP_SCORE_V2.weightQuietShare * quietShare +
    SLEEP_SCORE_V2.weightLowSnoreRate * lowRate +
    SLEEP_SCORE_V2.weightRegularity * regularity +
    SLEEP_SCORE_V2.weightSpectralConsistency * spectralConsistency;

  return { value: Math.round(clamp01(raw) * 100) };
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}
