import type { DateRange, EpochMs, IsoDate } from './common';
import type { SnoreEvent } from './audio';

/**
 * One pre-aggregated time bucket, one row in `session_buckets`.
 *
 * These exist so the Summary timeline and the History trends never recompute from raw
 * events: storing the raw 10 Hz level stream would be roughly 288,000 rows per night, which
 * does not survive months of history (ADR-11). Written incrementally during the session.
 */
export interface SessionBucket {
  readonly sessionId: string;
  readonly bucketStart: EpochMs;
  readonly averageDb: number;
  readonly peakDb: number;
  readonly snoringMs: number;
}

/** Snore severity band. Rendered as a label plus the five-dot scale on Summary. */
export type SnoreScoreBand = 'mild' | 'moderate' | 'heavy';

/**
 * A snore score and its presentation form.
 *
 * V1 is a documented weighted heuristic over recorded statistics only, scheduled for
 * wholesale replacement in V2. No clinical meaning is claimed (ADR-10).
 */
export interface SnoreScore {
  /** 0–100. Higher is worse. */
  readonly value: number;
  readonly band: SnoreScoreBand;
  /** 0–5 filled dots, derived from the same threshold table as `band`. */
  readonly filledDots: number;
}

/**
 * Sleep score. Same V1 caveat as `SnoreScore`: a weighted heuristic, not a medical measure
 * (ADR-10).
 */
export interface SleepScore {
  /** 0–100. Higher is better. */
  readonly value: number;
}

/**
 * The statistics both scores are computed from. Nothing else may feed a score.
 *
 * V2 (M6.5, ADR-26) adds four classifier-driven fields alongside the M5 duration / count
 * / peak-dB signals. `peakDb` is retained for backward compatibility with the archived V1
 * functions and for any Summary UI still surfacing raw loudness; V2 scoring does not
 * weight it.
 */
export interface ScoreInputs {
  readonly sessionDurationMs: number;
  readonly snoreCount: number;
  readonly totalSnoringMs: number;
  readonly peakDb: number;
  /** Mean classifier probability across the session's snore episodes; 0 when none. */
  readonly avgConfidence: number;
  /**
   * `Σ (episode.durationMs · episode.confidence) / sessionDurationMs`, clamped to [0, 1].
   * Confidence-weighted replacement for `totalSnoringMs / sessionDurationMs` (ADR-26).
   */
  readonly snoringShareByConfidence: number;
  /**
   * 0–1. Currently a neutral 0.5 until spectral analysis is wired (Task 6.3 comment on
   * `SnoreEvent.spectralPeakHz`). Higher = tighter clustering of spectral peaks across
   * an episode set (i.e. plausibly one snorer / one physiology).
   */
  readonly spectralConsistency: number;
  /**
   * 0–1. Higher = more evenly spaced episodes. Computed from the coefficient of variation
   * of episode inter-arrival gaps. `1` when there are fewer than two episodes (nothing to
   * disagree with itself).
   */
  readonly episodeRegularity: number;
}

/** Everything the Summary screen renders for a single night. */
export interface SessionSummary {
  readonly sessionId: string;
  readonly range: DateRange;
  readonly durationMs: number;
  readonly snoreCount: number;
  readonly totalSnoringMs: number;
  /** Share of the session spent snoring, 0–1. Shown as "8.5% of sleep". */
  readonly snoringShare: number;
  readonly peakDb: number;
  readonly peakAt: EpochMs | null;
  readonly snoreScore: SnoreScore;
  readonly sleepScore: SleepScore;
  /** Null when the night produced no snore episodes. */
  readonly loudestEpisode: SnoreEvent | null;
}

/** Which window the History screen is showing. */
export type TrendPeriod = '7d' | '30d';

/** One column of the History score overview strip. */
export interface DailyScoreSummary {
  readonly date: IsoDate;
  /** Null on a night with no recorded session. */
  readonly sessionId: string | null;
  readonly snoreScore: SnoreScore | null;
}

/** A single metric measured across two periods. */
export interface MetricDelta {
  readonly current: number;
  readonly previous: number;
  /**
   * Signed fractional change against `previous`, so -0.14 renders as a 14% reduction.
   * Null when `previous` is zero and a ratio would be undefined.
   */
  readonly changeRatio: number | null;
}

/** The History weekly/monthly comparison block. */
export interface PeriodComparison {
  readonly period: TrendPeriod;
  readonly currentRange: DateRange;
  readonly previousRange: DateRange;
  readonly averageSnoreScore: MetricDelta;
  readonly totalSnoringMs: MetricDelta;
  readonly snoreCount: MetricDelta;
}
