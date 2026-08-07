import type {
  DailyScoreSummary,
  PeriodComparison,
  SessionBucket,
  SessionSummary,
  SleepSession,
  SnoreEvent,
  TrendPeriod,
} from '@/types';

import type { StoreDependencies } from './container';
import type { Result } from './result';
import { ok } from './result';

/** Everything Summary needs for one night after stop / reopen. */
export type SessionDetail = {
  readonly summary: SessionSummary;
  readonly buckets: readonly SessionBucket[];
  readonly events: readonly SnoreEvent[];
};

/** History strip + comparison block for one trend window. */
export type HistoryTrends = {
  readonly daily: readonly DailyScoreSummary[];
  readonly comparison: PeriodComparison;
};

/**
 * Read-side orchestration for Summary / History (ADR-12).
 * Actions return data; screens hold ephemeral UI state — no duplicate caches here.
 */
export type InsightsSlice = {
  loadSessionDetail: (sessionId: string) => Promise<Result<SessionDetail>>;
  loadHistoryTrends: (period: TrendPeriod) => Promise<Result<HistoryTrends>>;
  /** Newest-first page for Summary date navigation. */
  listRecentSessions: (limit?: number) => Promise<Result<readonly SleepSession[]>>;
};

export function createInsightsSlice(deps: StoreDependencies): InsightsSlice {
  return {
    async loadSessionDetail(sessionId) {
      const summary = await deps.analyticsService.buildSessionSummary(sessionId);
      if (!summary.ok) {
        return summary;
      }
      const buckets = await deps.sleepService.getBuckets(sessionId);
      if (!buckets.ok) {
        return buckets;
      }
      const events = await deps.sleepService.getSnoreEvents(sessionId);
      if (!events.ok) {
        return events;
      }
      return ok({
        summary: summary.value,
        buckets: buckets.value,
        events: events.value,
      });
    },

    async loadHistoryTrends(period) {
      const daily = await deps.analyticsService.getDailyScores(period);
      if (!daily.ok) {
        return daily;
      }
      const comparison = await deps.analyticsService.comparePeriods(period);
      if (!comparison.ok) {
        return comparison;
      }
      return ok({
        daily: daily.value,
        comparison: comparison.value,
      });
    },

    async listRecentSessions(limit = 60) {
      const page = await deps.sleepService.listSessions({ offset: 0, limit });
      if (!page.ok) {
        return page;
      }
      return ok(page.value.items);
    },
  };
}
