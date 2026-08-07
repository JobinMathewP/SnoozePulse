import type { SessionSummary, SnoreEvent } from '@/types';

/**
 * Task 6.7 — pure UI-side derivation of the V2 score inputs plus class distribution.
 *
 * Mirrors the confidence-weighted math in `src/services/analytics/scoreInputs.ts` so the
 * Summary screen can render a breakdown card without adding new fields to
 * `SessionSummary` (services and repositories are frozen for this task). Where the
 * analytics service already computed a value for scoring, we recompute it here for
 * display: the two derivations are intentionally kept in sync by the scoreInputs contract
 * in ADR-26 rather than by shared state.
 */
export interface ScoreBreakdown {
  /** Mean classifier probability across the session's snore episodes, `[0, 1]`. */
  readonly avgConfidence: number;
  /**
   * `Σ(episode.durationMs × episode.confidence) / sessionDurationMs`, clamped `[0, 1]`.
   * `0` when there are no episodes or the session has zero duration.
   */
  readonly snoringShareByConfidence: number;
  /**
   * `1 − coefficient of variation(spectralPeakHz)` across episodes with a non-null peak.
   * `0` when fewer than two such episodes exist. Higher is more consistent.
   */
  readonly spectralConsistency: number;
  /**
   * `[0, 1]`, evenness of episode spacing over the session. `0` when fewer than two
   * episodes exist.
   */
  readonly episodeRegularity: number;
  /** Number of episodes labelled `snoring` by the classifier. */
  readonly snoringCount: number;
  /** Number of episodes labelled `snort` by the classifier. */
  readonly snortCount: number;
}

const EMPTY_BREAKDOWN: ScoreBreakdown = Object.freeze({
  avgConfidence: 0,
  snoringShareByConfidence: 0,
  spectralConsistency: 0,
  episodeRegularity: 0,
  snoringCount: 0,
  snortCount: 0,
});

/**
 * Compute the V2 breakdown from the persisted `SnoreEvent[]` and the
 * `SessionSummary.durationMs`. Pure — no store, no service, no I/O.
 */
export function deriveScoreBreakdown(
  events: readonly SnoreEvent[],
  summary: Pick<SessionSummary, 'durationMs' | 'range'>,
): ScoreBreakdown {
  if (events.length === 0) {
    return EMPTY_BREAKDOWN;
  }

  const avgConfidence = averageConfidence(events);
  const snoringShareByConfidence = confidenceWeightedShare(
    events,
    summary.durationMs,
  );
  const spectralConsistency = spectralConsistencyFrom(events);
  const episodeRegularity = episodeRegularityFrom(
    events,
    summary.range.startedAt,
    summary.range.endedAt,
  );
  let snoringCount = 0;
  let snortCount = 0;
  for (const event of events) {
    if (event.classLabel === 'snort') {
      snortCount += 1;
    } else {
      snoringCount += 1;
    }
  }

  return {
    avgConfidence,
    snoringShareByConfidence,
    spectralConsistency,
    episodeRegularity,
    snoringCount,
    snortCount,
  };
}

function averageConfidence(events: readonly SnoreEvent[]): number {
  let sum = 0;
  for (const event of events) {
    sum += clamp01(event.confidence);
  }
  return sum / events.length;
}

function confidenceWeightedShare(
  events: readonly SnoreEvent[],
  sessionDurationMs: number,
): number {
  if (sessionDurationMs <= 0) {
    return 0;
  }
  let weighted = 0;
  for (const event of events) {
    weighted += clamp01(event.confidence) * Math.max(0, event.durationMs);
  }
  return clamp01(weighted / sessionDurationMs);
}

function spectralConsistencyFrom(events: readonly SnoreEvent[]): number {
  const peaks: number[] = [];
  for (const event of events) {
    if (event.spectralPeakHz !== null && Number.isFinite(event.spectralPeakHz)) {
      peaks.push(event.spectralPeakHz);
    }
  }
  if (peaks.length < 2) {
    return 0;
  }
  const mean = peaks.reduce((a, b) => a + b, 0) / peaks.length;
  if (mean === 0) {
    return 0;
  }
  const variance =
    peaks.reduce((acc, value) => acc + (value - mean) ** 2, 0) / peaks.length;
  const cv = Math.sqrt(variance) / mean;
  return clamp01(1 - cv);
}

/**
 * Regularity in `[0, 1]`: `1 − CV(inter-episode gaps)`, clamped. The first gap is from
 * `sessionStart` to the first episode, and the last is from the last episode to
 * `sessionEnd`, so long silent bookends still count as an irregularity.
 */
function episodeRegularityFrom(
  events: readonly SnoreEvent[],
  sessionStart: number,
  sessionEnd: number,
): number {
  if (events.length < 2) {
    return 0;
  }
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const gaps: number[] = [];
  gaps.push(Math.max(0, sorted[0]!.timestamp - sessionStart));
  for (let i = 1; i < sorted.length; i += 1) {
    gaps.push(Math.max(0, sorted[i]!.timestamp - sorted[i - 1]!.timestamp));
  }
  gaps.push(Math.max(0, sessionEnd - sorted[sorted.length - 1]!.timestamp));

  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (mean === 0) {
    return 0;
  }
  const variance =
    gaps.reduce((acc, value) => acc + (value - mean) ** 2, 0) / gaps.length;
  const cv = Math.sqrt(variance) / mean;
  return clamp01(1 - cv);
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}
