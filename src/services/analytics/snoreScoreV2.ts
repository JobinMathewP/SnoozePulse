import type { ScoreInputs, SnoreScore, SnoreScoreBand } from '@/types';

import { SNORE_SCORE_SCALE_V2, SNORE_SCORE_V2 } from './scoringConstantsV2';

/**
 * V2 snore score — replaces {@link computeSnoreScoreV1} wholesale in M6.5 (ADR-10, ADR-26).
 *
 * Pure: returns `{ value, band, filledDots }`. Band and dots both come from
 * {@link SNORE_SCORE_SCALE_V2} via {@link lookupSnoreScaleV2} so Mild / Moderate / Heavy
 * and the five-dot indicator share one source of truth. Higher value = more snoring
 * burden (worse). Not a clinical AHI or diagnosis.
 *
 * V1's dB-driven peak term is deliberately absent — V2 weights episodes by classifier
 * confidence and duration, not loudness (ADR-26).
 */
export function computeSnoreScoreV2(inputs: ScoreInputs): SnoreScore {
  const durationHours = Math.max(inputs.sessionDurationMs, 1) / (60 * 60 * 1000);
  const snoreRatePerHour = inputs.snoreCount / durationHours;

  const rateTerm = clamp01(snoreRatePerHour / SNORE_SCORE_V2.snoreRatePerHourCap);
  const shareTerm = clamp01(
    inputs.snoringShareByConfidence / SNORE_SCORE_V2.snoringShareCap,
  );
  const confidenceTerm = clamp01(inputs.avgConfidence);
  const spectralChaos = 1 - clamp01(inputs.spectralConsistency);

  const raw =
    SNORE_SCORE_V2.weightSnoreRate * rateTerm +
    SNORE_SCORE_V2.weightSnoringShare * shareTerm +
    SNORE_SCORE_V2.weightConfidence * confidenceTerm +
    SNORE_SCORE_V2.weightSpectralChaos * spectralChaos;

  const value = Math.round(clamp01(raw) * 100);
  const scale = lookupSnoreScaleV2(value);
  return {
    value,
    band: scale.band,
    filledDots: scale.filledDots,
  };
}

/**
 * Resolve Mild / Moderate / Heavy from the V2 scale table. Kept public so persisted
 * numeric scores can re-derive presentation without recomputing weights.
 */
export function bandForScoreV2(value: number): SnoreScoreBand {
  return lookupSnoreScaleV2(value).band;
}

/** Resolve the five-dot fill from the **same** row as {@link bandForScoreV2}. */
export function dotsForScoreV2(value: number): number {
  return lookupSnoreScaleV2(value).filledDots;
}

/**
 * First matching row in {@link SNORE_SCORE_SCALE_V2}. Pure and side-effect free.
 * Clamps to 0–100 so out-of-range values still land on a defined row.
 */
function lookupSnoreScaleV2(value: number): {
  readonly band: SnoreScoreBand;
  readonly filledDots: number;
} {
  const clamped = Math.min(100, Math.max(0, value));
  for (const row of SNORE_SCORE_SCALE_V2) {
    if (clamped <= row.maxInclusive) {
      return { band: row.band, filledDots: row.filledDots };
    }
  }
  const last = SNORE_SCORE_SCALE_V2[SNORE_SCORE_SCALE_V2.length - 1];
  return { band: last.band, filledDots: last.filledDots };
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}
