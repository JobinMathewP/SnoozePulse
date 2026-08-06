import type { ScoreInputs, SleepScore } from '@/types';

import { SLEEP_SCORE_V1 } from './scoringConstants';

/**
 * V1 sleep score heuristic — scheduled for wholesale replacement in V2 (ADR-10).
 *
 * Pure: no I/O, no mutation, no clinical claims. Inputs are limited to recorded session
 * statistics (`ScoreInputs`). Clamp the result to 0–100 for UI safety.
 *
 * Replace this entire function (and `SLEEP_SCORE_V1`) when V2 scoring lands; do not patch
 * weights into call sites.
 */
export function computeSleepScoreV1(inputs: ScoreInputs): SleepScore {
  const durationHours = Math.max(inputs.sessionDurationMs, 1) / (60 * 60 * 1000);
  const snoringShare = clamp01(
    inputs.totalSnoringMs / Math.max(inputs.sessionDurationMs, 1),
  );
  const quietShare = 1 - snoringShare;
  const snoreRatePerHour = inputs.snoreCount / durationHours;

  const lowSnoreRate = 1 - clamp01(snoreRatePerHour / SLEEP_SCORE_V1.snoreRatePerHourCap);
  const lowPeak = 1 - normalizePeak(inputs.peakDb);

  const raw =
    SLEEP_SCORE_V1.weightQuietShare * quietShare +
    SLEEP_SCORE_V1.weightLowSnoreRate * lowSnoreRate +
    SLEEP_SCORE_V1.weightLowPeak * lowPeak;

  return { value: Math.round(clamp01(raw) * 100) };
}

/** Map peak dB into 0–1 across the V1 floor/ceiling window. */
function normalizePeak(peakDb: number): number {
  const span = SLEEP_SCORE_V1.peakDbCeiling - SLEEP_SCORE_V1.peakDbFloor;
  if (span <= 0) {
    return 0;
  }
  return clamp01((peakDb - SLEEP_SCORE_V1.peakDbFloor) / span);
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}
