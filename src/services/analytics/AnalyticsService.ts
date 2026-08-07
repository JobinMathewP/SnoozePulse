import type { ISleepRepository, ISnoreRepository, Result } from '@/repositories';
import { ok } from '@/repositories';
import type { IAnalyticsService } from '../IAnalyticsService';
import type {
  DailyScoreSummary,
  PeriodComparison,
  ScoreInputs,
  SessionBucket,
  SessionSummary,
  SleepScore,
  SleepSession,
  SnoreEvent,
  SnoreScore,
  TrendPeriod,
} from '@/types';
import {
  eachIsoDateInclusive,
  inRange,
  metricDelta,
  periodWindows,
  toIsoDateLocal,
  TREND_PERIOD_MS,
} from '@/utils/trendPeriods';

import { aggregateBucketsFromEvents } from './buckets';
import { deriveScoreInputs } from './scoreInputs';
import { computeSleepScoreV2 } from './sleepScoreV2';
import { bandForScoreV2, computeSnoreScoreV2, dotsForScoreV2 } from './snoreScoreV2';

/**
 * Scoring, bucket aggregation, and History comparisons.
 *
 * Orchestrates repositories for reads only — never embeds SQL (ADR-19). Pure score /
 * bucket helpers live beside this class so V2 can replace them without touching the
 * orchestration methods (ADR-10, ADR-11).
 */
export class AnalyticsService implements IAnalyticsService {
  constructor(
    private readonly sleepRepository: ISleepRepository,
    private readonly snoreRepository: ISnoreRepository,
  ) {}

  /**
   * Delegates to {@link computeSleepScoreV2} (ADR-26). Kept as an instance method so the
   * store depends on `IAnalyticsService`, not on the V2 module path. V1 remains compiled
   * for archival reads only and is unreachable from the write path after Task 6.5.
   */
  computeSleepScore(inputs: ScoreInputs): SleepScore {
    return computeSleepScoreV2(inputs);
  }

  /** Delegates to {@link computeSnoreScoreV2} (value + band + dots) (ADR-26). */
  computeSnoreScore(inputs: ScoreInputs): SnoreScore {
    return computeSnoreScoreV2(inputs);
  }

  /**
   * Summary screen model for one night: persisted totals, scores, loudest episode.
   * Prefer stored numeric scores when present so historical nights stay stable if V1
   * weights change; band/dots are always derived from the shared threshold table.
   */
  async buildSessionSummary(sessionId: string): Promise<Result<SessionSummary>> {
    const sessionResult = await this.sleepRepository.getSession(sessionId);
    if (!sessionResult.ok) {
      return sessionResult;
    }
    const session = sessionResult.value;

    const eventsResult = await this.snoreRepository.getEvents(sessionId);
    if (!eventsResult.ok) {
      return eventsResult;
    }
    const events = eventsResult.value;

    const endedAt = session.endedAt ?? Date.now();
    const durationMs = Math.max(0, endedAt - session.startedAt);
    const inputs = deriveScoreInputs(
      {
        sessionDurationMs: durationMs,
        snoreCount: session.snoreCount,
        totalSnoringMs: session.totalSnoringMs,
        peakDb: session.peakDb,
      },
      events,
    );

    const sleepScore: SleepScore =
      session.sleepScore !== null
        ? { value: session.sleepScore }
        : this.computeSleepScore(inputs);

    const snoreScore: SnoreScore =
      session.snoreScore !== null
        ? restoreSnoreScore(session.snoreScore)
        : this.computeSnoreScore(inputs);

    const loudestEpisode = pickLoudest(events);
    const snoringShare =
      durationMs > 0 ? session.totalSnoringMs / durationMs : 0;

    return ok({
      sessionId: session.id,
      range: { startedAt: session.startedAt, endedAt },
      durationMs,
      snoreCount: session.snoreCount,
      totalSnoringMs: session.totalSnoringMs,
      snoringShare,
      peakDb: session.peakDb,
      peakAt: session.peakAt,
      snoreScore,
      sleepScore,
      loudestEpisode,
    });
  }

  aggregateBuckets(
    sessionId: string,
    events: readonly SnoreEvent[],
    bucketDurationMs: number,
  ): readonly SessionBucket[] {
    return aggregateBucketsFromEvents(sessionId, events, bucketDurationMs);
  }

  /**
   * One History strip column per local calendar day in the period.
   * Days without a scored session get nulls (empty bar). Newest session wins per day.
   */
  async getDailyScores(
    period: TrendPeriod,
  ): Promise<Result<readonly DailyScoreSummary[]>> {
    const now = Date.now();
    const windowStart = now - TREND_PERIOD_MS[period];
    const sessionsResult = await this.loadSessionsTouching(windowStart, now);
    if (!sessionsResult.ok) {
      return sessionsResult;
    }

    const byDate = new Map<string, SleepSession>();
    for (const session of sessionsResult.value) {
      if (session.startedAt < windowStart || session.startedAt >= now) {
        continue;
      }
      if (session.snoreScore === null) {
        continue;
      }
      const key = toIsoDateLocal(session.startedAt);
      const existing = byDate.get(key);
      if (!existing || session.startedAt > existing.startedAt) {
        byDate.set(key, session);
      }
    }

    const days = eachIsoDateInclusive(windowStart, now - 1);
    const summaries: DailyScoreSummary[] = days.map((date) => {
      const session = byDate.get(date);
      if (!session || session.snoreScore === null) {
        return { date, sessionId: null, snoreScore: null };
      }
      return {
        date,
        sessionId: session.id,
        snoreScore: restoreSnoreScore(session.snoreScore),
      };
    });

    return ok(summaries);
  }

  /**
   * Weekly (7d) or monthly (30d) comparison for History.
   * See {@link periodWindows} for the previous-window baseline used in % deltas.
   */
  async comparePeriods(period: TrendPeriod): Promise<Result<PeriodComparison>> {
    const now = Date.now();
    const { current, previous } = periodWindows(period, now);
    const sessionsResult = await this.loadSessionsTouching(
      previous.startedAt,
      current.endedAt,
    );
    if (!sessionsResult.ok) {
      return sessionsResult;
    }

    const currentStats = summarizeWindow(sessionsResult.value, current);
    const previousStats = summarizeWindow(sessionsResult.value, previous);

    return ok({
      period,
      currentRange: current,
      previousRange: previous,
      averageSnoreScore: metricDelta(
        currentStats.averageSnoreScore,
        previousStats.averageSnoreScore,
      ),
      totalSnoringMs: metricDelta(
        currentStats.totalSnoringMs,
        previousStats.totalSnoringMs,
      ),
      snoreCount: metricDelta(currentStats.snoreCount, previousStats.snoreCount),
    });
  }

  /**
   * Page through newest-first history until pages fall entirely before `fromMs`.
   */
  private async loadSessionsTouching(
    fromMs: number,
    toMs: number,
  ): Promise<Result<readonly SleepSession[]>> {
    const collected: SleepSession[] = [];
    let offset = 0;
    const limit = 100;

    for (;;) {
      const page = await this.sleepRepository.listSessions({ offset, limit });
      if (!page.ok) {
        return page;
      }
      if (page.value.items.length === 0) {
        break;
      }

      for (const session of page.value.items) {
        if (session.startedAt >= fromMs && session.startedAt < toMs) {
          collected.push(session);
        }
      }

      const oldestOnPage = page.value.items[page.value.items.length - 1];
      offset += limit;
      if (offset >= page.value.total || oldestOnPage.startedAt < fromMs) {
        break;
      }
    }

    return ok(collected);
  }
}

/**
 * Rebuild presentation fields from a persisted numeric snore score so band and dots
 * stay locked to the V2 scale table (ADR-26). Every row written after M6.5 is a V2 score;
 * pre-M6 rows were wiped in the same migration that added the classifier columns, so
 * this helper is safe to call unconditionally.
 */
function restoreSnoreScore(value: number): SnoreScore {
  return {
    value,
    band: bandForScoreV2(value),
    filledDots: dotsForScoreV2(value),
  };
}

function pickLoudest(events: readonly SnoreEvent[]): SnoreEvent | null {
  if (events.length === 0) {
    return null;
  }
  let loudest = events[0];
  for (let index = 1; index < events.length; index += 1) {
    const event = events[index];
    if (event.peakDb > loudest.peakDb) {
      loudest = event;
    }
  }
  return loudest;
}

function summarizeWindow(
  sessions: readonly SleepSession[],
  range: { startedAt: number; endedAt: number },
): {
  averageSnoreScore: number;
  totalSnoringMs: number;
  snoreCount: number;
} {
  let snoreScoreSum = 0;
  let snoreScoreCount = 0;
  let totalSnoringMs = 0;
  let snoreCount = 0;

  for (const session of sessions) {
    if (!inRange(session.startedAt, range)) {
      continue;
    }
    totalSnoringMs += session.totalSnoringMs;
    snoreCount += session.snoreCount;
    if (session.snoreScore !== null) {
      snoreScoreSum += session.snoreScore;
      snoreScoreCount += 1;
    }
  }

  return {
    averageSnoreScore:
      snoreScoreCount > 0 ? snoreScoreSum / snoreScoreCount : 0,
    totalSnoringMs,
    snoreCount,
  };
}
