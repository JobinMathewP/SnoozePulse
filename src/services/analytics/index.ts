/**
 * V1 analytics: scoring heuristics, timeline buckets, History comparisons (ADR-10, ADR-11).
 *
 * Swap `sleepScore.ts` / `snoreScore.ts` / `scoringConstants.ts` wholesale for V2 —
 * orchestration in `AnalyticsService` should not need to change.
 */

export { AnalyticsService } from './AnalyticsService';
export { computeSleepScoreV1 } from './sleepScore';
export { bandForScore, computeSnoreScoreV1, dotsForScore } from './snoreScore';
export { aggregateBucketsFromEvents } from './buckets';
export {
  SLEEP_SCORE_V1,
  SNORE_SCORE_SCALE_V1,
  SNORE_SCORE_V1,
} from './scoringConstants';
