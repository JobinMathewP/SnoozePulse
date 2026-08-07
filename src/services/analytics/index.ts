/**
 * Analytics: scoring heuristics, timeline buckets, History comparisons (ADR-10, ADR-11).
 *
 * V2 is the only write path after Task 6.5 (ADR-26). V1 is compiled for archival reads
 * only and re-exported so downstream tooling can still name the previous constants /
 * functions if it wants to; nothing in the write path calls them.
 */

export { AnalyticsService } from './AnalyticsService';
export { aggregateBucketsFromEvents } from './buckets';
export { deriveScoreInputs } from './scoreInputs';

export { computeSleepScoreV2 } from './sleepScoreV2';
export {
  bandForScoreV2,
  computeSnoreScoreV2,
  dotsForScoreV2,
} from './snoreScoreV2';
export {
  SLEEP_SCORE_V2,
  SNORE_SCORE_SCALE_V2,
  SNORE_SCORE_V2,
} from './scoringConstantsV2';

/** @deprecated Kept for archival reads only; see `sleepScore.ts` header. */
export { computeSleepScoreV1 } from './sleepScore';
/** @deprecated Kept for archival reads only; see `snoreScore.ts` header. */
export { bandForScore, computeSnoreScoreV1, dotsForScore } from './snoreScore';
/** @deprecated Kept for archival reads only; see `scoringConstants.ts` header. */
export {
  SLEEP_SCORE_V1,
  SNORE_SCORE_SCALE_V1,
  SNORE_SCORE_V1,
} from './scoringConstants';
