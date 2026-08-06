import type {
  DailyScoreSummary,
  PeriodComparison,
  ScoreInputs,
  SessionBucket,
  SessionSummary,
  SleepScore,
  SnoreEvent,
  SnoreScore,
  TrendPeriod,
} from '@/types';

import type { Result } from '@/repositories';

/**
 * Scoring, timeline aggregation, and History comparisons.
 *
 * Sleep score and snore score are V1 weighted heuristics over recorded statistics only —
 * no medical or clinical meaning (ADR-10). Each must be implemented as one pure function
 * with its weighting constants in a single named block so V2 can replace them wholesale.
 *
 * Bucket aggregation exists so Summary and History never recompute from the raw level
 * stream (ADR-11). This interface exposes no SQL (ADR-19).
 */
export interface IAnalyticsService {
  /**
   * V1 sleep score. Pure. Higher is better.
   * Inputs are limited to `ScoreInputs`; do not invent clinical signals.
   */
  computeSleepScore(inputs: ScoreInputs): SleepScore;

  /**
   * V1 snore score plus Mild / Moderate / Heavy band and five-dot fill. Pure.
   * Higher is worse. Band and dots share one threshold table.
   */
  computeSnoreScore(inputs: ScoreInputs): SnoreScore;

  /**
   * Build the Summary screen model for one night: scores, loudest episode, and totals.
   * Reads session, events, and buckets through repositories via orchestration.
   */
  buildSessionSummary(sessionId: string): Promise<Result<SessionSummary>>;

  /**
   * Aggregate a window of snore episodes (and any level-derived stats the implementation
   * needs) into `session_buckets` rows. Pure with respect to persistence — the caller
   * decides when to save via `ISleepRepository.saveBuckets`.
   */
  aggregateBuckets(
    sessionId: string,
    events: readonly SnoreEvent[],
    bucketDurationMs: number,
  ): readonly SessionBucket[];

  /** One column per day for the History score overview strip. */
  getDailyScores(period: TrendPeriod): Promise<Result<readonly DailyScoreSummary[]>>;

  /** Weekly or monthly comparison block with percentage deltas. */
  comparePeriods(period: TrendPeriod): Promise<Result<PeriodComparison>>;
}
