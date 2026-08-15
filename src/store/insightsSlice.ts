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
  /**
   * All sessions started in the given local calendar month (`month` is 0-based, like
   * `Date`), newest first — backs the calendar picker (ADR-30).
   */
  loadSessionsForMonth: (
    year: number,
    month: number,
  ) => Promise<Result<readonly SleepSession[]>>;
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

    async loadSessionsForMonth(year, month) {
      // Local-time month bounds: [1st 00:00 of month, 1st 00:00 of next month).
      const fromMs = new Date(year, month, 1).getTime();
      const toMs = new Date(year, month + 1, 1).getTime();
      return deps.sleepService.listSessionsInRange(fromMs, toMs);
    },
  };
}
