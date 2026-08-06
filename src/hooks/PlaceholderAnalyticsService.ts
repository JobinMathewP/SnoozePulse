import type { Result } from '@/repositories';
import { ok } from '@/repositories';
import type { IAnalyticsService } from '@/services';
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

/**
 * Temporary analytics stand-in so AudioService can finish sessions before Task 4.5.
 * Scoring is intentionally flat zeros — replaced wholesale by the V1 heuristic service.
 */
export class PlaceholderAnalyticsService implements IAnalyticsService {
  computeSleepScore(_inputs: ScoreInputs): SleepScore {
    return { value: 0 };
  }

  computeSnoreScore(_inputs: ScoreInputs): SnoreScore {
    return { value: 0, band: 'mild', filledDots: 0 };
  }

  async buildSessionSummary(
    sessionId: string,
  ): Promise<Result<SessionSummary>> {
    return ok({
      sessionId,
      range: { startedAt: 0, endedAt: 0 },
      durationMs: 0,
      snoreCount: 0,
      totalSnoringMs: 0,
      snoringShare: 0,
      peakDb: 0,
      peakAt: null,
      snoreScore: this.computeSnoreScore({
        sessionDurationMs: 0,
        snoreCount: 0,
        totalSnoringMs: 0,
        peakDb: 0,
      }),
      sleepScore: { value: 0 },
      loudestEpisode: null,
    });
  }

  aggregateBuckets(
    sessionId: string,
    events: readonly SnoreEvent[],
    bucketDurationMs: number,
  ): readonly SessionBucket[] {
    if (events.length === 0 || bucketDurationMs <= 0) {
      return [];
    }
    const buckets = new Map<number, SessionBucket>();
    for (const event of events) {
      const bucketStart =
        Math.floor(event.timestamp / bucketDurationMs) * bucketDurationMs;
      const existing = buckets.get(bucketStart);
      if (!existing) {
        buckets.set(bucketStart, {
          sessionId,
          bucketStart,
          averageDb: event.peakDb,
          peakDb: event.peakDb,
          snoringMs: event.durationMs,
        });
        continue;
      }
      buckets.set(bucketStart, {
        sessionId,
        bucketStart,
        averageDb: (existing.averageDb + event.peakDb) / 2,
        peakDb: Math.max(existing.peakDb, event.peakDb),
        snoringMs: existing.snoringMs + event.durationMs,
      });
    }
    return [...buckets.values()].sort((a, b) => a.bucketStart - b.bucketStart);
  }

  async getDailyScores(
    _period: TrendPeriod,
  ): Promise<Result<readonly DailyScoreSummary[]>> {
    return ok([]);
  }

  async comparePeriods(period: TrendPeriod): Promise<Result<PeriodComparison>> {
    const emptyDelta = {
      current: 0,
      previous: 0,
      changeRatio: null,
    };
    return ok({
      period,
      currentRange: { startedAt: 0, endedAt: 0 },
      previousRange: { startedAt: 0, endedAt: 0 },
      averageSnoreScore: emptyDelta,
      totalSnoringMs: emptyDelta,
      snoreCount: emptyDelta,
    });
  }
}
