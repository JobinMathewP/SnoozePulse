/**
 * @deprecated V1 heuristic. Kept for archival reads only; no write path calls this after
 * M6 (Task 6.5 / ADR-26). Do not extend or rewire — use `snoreScoreV2.ts` instead.
 */

import type { ScoreInputs, SnoreScore, SnoreScoreBand } from '@/types';

import { SNORE_SCORE_SCALE_V1, SNORE_SCORE_V1 } from './scoringConstants';

/**
 * V1 snore score heuristic — replaced wholesale by {@link computeSnoreScoreV2} in M6.5
 * (ADR-10, ADR-26). This function and its constants remain compiled for archival reads
 * only; every write path now targets V2. Kept as-is per the Task 6.5 guardrail.
 *
 * Pure: returns `{ value, band, filledDots }`. Higher value = more snoring burden
 * (worse). Not a clinical AHI or diagnosis.
 */
export function computeSnoreScoreV1(inputs: ScoreInputs): SnoreScore {
  const durationHours = Math.max(inputs.sessionDurationMs, 1) / (60 * 60 * 1000);
  const snoringShare = clamp01(
    inputs.totalSnoringMs / Math.max(inputs.sessionDurationMs, 1),
  );
  const snoreRatePerHour = inputs.snoreCount / durationHours;

  const rateTerm = clamp01(snoreRatePerHour / SNORE_SCORE_V1.snoreRatePerHourCap);
  const shareTerm = clamp01(snoringShare / SNORE_SCORE_V1.snoringShareCap);
  const peakTerm = normalizePeak(inputs.peakDb);

  const raw =
    SNORE_SCORE_V1.weightSnoreRate * rateTerm +
    SNORE_SCORE_V1.weightSnoringShare * shareTerm +
    SNORE_SCORE_V1.weightPeakDb * peakTerm;

  const value = Math.round(clamp01(raw) * 100);
  const scale = lookupSnoreScale(value);
  return {
    value,
    band: scale.band,
    filledDots: scale.filledDots,
  };
}

/**
 * Resolve Mild / Moderate / Heavy from the shared scale table.
 * Public helper kept so persisted numeric scores can re-derive presentation without
 * recomputing weights.
 */
export function bandForScore(value: number): SnoreScoreBand {
  return lookupSnoreScale(value).band;
}

/**
 * Resolve the five-dot fill from the **same** row as {@link bandForScore}.
 */
export function dotsForScore(value: number): number {
  return lookupSnoreScale(value).filledDots;
}

/**
 * First matching row in {@link SNORE_SCORE_SCALE_V1}. Pure and side-effect free.
 * Clamps to 0–100 so out-of-range values still land on a defined row.
 */
function lookupSnoreScale(value: number): {
  readonly band: SnoreScoreBand;
  readonly filledDots: number;
} {
  const clamped = Math.min(100, Math.max(0, value));
  for (const row of SNORE_SCORE_SCALE_V1) {
    if (clamped <= row.maxInclusive) {
      return { band: row.band, filledDots: row.filledDots };
    }
  }
  // Table always ends at maxInclusive 100; defensive fallback keeps the type narrow.
  const last = SNORE_SCORE_SCALE_V1[SNORE_SCORE_SCALE_V1.length - 1];
  return { band: last.band, filledDots: last.filledDots };
}

function normalizePeak(peakDb: number): number {
  const span = SNORE_SCORE_V1.peakDbCeiling - SNORE_SCORE_V1.peakDbFloor;
  if (span <= 0) {
    return 0;
  }
  return clamp01((peakDb - SNORE_SCORE_V1.peakDbFloor) / span);
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}
