import type { ScoreInputs, SnoreEvent } from '@/types';

/**
 * Neutral value for `spectralConsistency` when no episode carries a spectral peak. Held
 * at 0.5 (rather than 0 or 1) so the score does not swing when spectral analysis is
 * wired for the first time — see `SnoreEvent.spectralPeakHz` (Task 6.3).
 */
const NEUTRAL_SPECTRAL_CONSISTENCY = 0.5;

/**
 * Regularity when there are fewer than two episodes. With 0 or 1 episode there is
 * nothing to disagree with itself — the night is trivially "regular".
 */
const TRIVIAL_REGULARITY = 1;

/**
 * Assemble the {@link ScoreInputs} record from persisted session totals and its snore
 * episodes (ADR-26).
 *
 * Pure and side-effect free. `sessionDurationMs`, `snoreCount`, `totalSnoringMs`, and
 * `peakDb` remain the M5 signals (kept for backward compatibility and legacy Summary
 * cards). The four M6 fields are computed from the classifier-driven event stream so the
 * V2 score functions can weight episodes by confidence and by timing regularity rather
 * than by loudness alone.
 */
export function deriveScoreInputs(
  totals: {
    readonly sessionDurationMs: number;
    readonly snoreCount: number;
    readonly totalSnoringMs: number;
    readonly peakDb: number;
  },
  events: readonly SnoreEvent[],
): ScoreInputs {
  return {
    sessionDurationMs: totals.sessionDurationMs,
    snoreCount: totals.snoreCount,
    totalSnoringMs: totals.totalSnoringMs,
    peakDb: totals.peakDb,
    avgConfidence: averageConfidence(events),
    snoringShareByConfidence: snoringShareByConfidence(events, totals.sessionDurationMs),
    spectralConsistency: spectralConsistency(events),
    episodeRegularity: episodeRegularity(events),
  };
}

function averageConfidence(events: readonly SnoreEvent[]): number {
  if (events.length === 0) {
    return 0;
  }
  let sum = 0;
  for (const event of events) {
    sum += clamp01(event.confidence);
  }
  return sum / events.length;
}

function snoringShareByConfidence(
  events: readonly SnoreEvent[],
  sessionDurationMs: number,
): number {
  if (sessionDurationMs <= 0 || events.length === 0) {
    return 0;
  }
  let weightedMs = 0;
  for (const event of events) {
    weightedMs += event.durationMs * clamp01(event.confidence);
  }
  return clamp01(weightedMs / sessionDurationMs);
}

/**
 * Population standard deviation of episode spectral peaks divided by their mean, then
 * inverted and clamped: `1 − clamp01(cv)`. Returns {@link NEUTRAL_SPECTRAL_CONSISTENCY}
 * when fewer than two events carry a spectral peak.
 */
function spectralConsistency(events: readonly SnoreEvent[]): number {
  const peaks: number[] = [];
  for (const event of events) {
    if (event.spectralPeakHz !== null && event.spectralPeakHz > 0) {
      peaks.push(event.spectralPeakHz);
    }
  }
  if (peaks.length < 2) {
    return NEUTRAL_SPECTRAL_CONSISTENCY;
  }
  const mean = peaks.reduce((acc, hz) => acc + hz, 0) / peaks.length;
  if (mean <= 0) {
    return NEUTRAL_SPECTRAL_CONSISTENCY;
  }
  let variance = 0;
  for (const hz of peaks) {
    variance += (hz - mean) ** 2;
  }
  variance /= peaks.length;
  const cv = Math.sqrt(variance) / mean;
  return clamp01(1 - clamp01(cv));
}

/**
 * `1 − clamp01(cv)` where `cv` is the coefficient of variation of episode inter-arrival
 * gaps. Two evenly-spaced episodes → 1; chaotic bursts → close to 0. Events with
 * duplicate timestamps are treated as one point (a `0` gap would infinitely inflate `cv`).
 */
function episodeRegularity(events: readonly SnoreEvent[]): number {
  if (events.length < 2) {
    return TRIVIAL_REGULARITY;
  }
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const gap = sorted[i].timestamp - sorted[i - 1].timestamp;
    if (gap > 0) {
      gaps.push(gap);
    }
  }
  if (gaps.length < 2) {
    return TRIVIAL_REGULARITY;
  }
  const mean = gaps.reduce((acc, g) => acc + g, 0) / gaps.length;
  if (mean <= 0) {
    return TRIVIAL_REGULARITY;
  }
  let variance = 0;
  for (const g of gaps) {
    variance += (g - mean) ** 2;
  }
  variance /= gaps.length;
  const cv = Math.sqrt(variance) / mean;
  return clamp01(1 - clamp01(cv));
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}
