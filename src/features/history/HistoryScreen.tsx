import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, SectionHeader, SegmentedControl } from '@/components/ui';
import { useInsights } from '@/hooks';
import type { HistoryTrends } from '@/store';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';
import type { TrendPeriod } from '@/types';

import { DayScoreStrip } from './DayScoreStrip';
import { ImprovementCard } from './ImprovementCard';
import { InsightsCard } from './InsightsCard';
import {
  formatRangeLegend,
  historyCopy,
  improvementPercentLabel,
  segmentOptions,
  sparklineFromDaily,
  toComparisonRows,
  toDayColumns,
} from './models';
import { WeeklyComparisonCard } from './WeeklyComparisonCard';

const noop = (): void => undefined;

/**
 * History / Your Progress — live analytics via store (ADR-12).
 */
export function HistoryScreen() {
  const router = useRouter();
  const { loadHistoryTrends } = useInsights();
  const [period, setPeriod] = useState<TrendPeriod>('7d');
  const [trends, setTrends] = useState<HistoryTrends | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await loadHistoryTrends(period);
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setTrends(null);
        setErrorMessage(result.error.message);
        setLoading(false);
        return;
      }
      setTrends(result.value);
      const scored = toDayColumns(result.value.daily);
      const last = scored[scored.length - 1];
      setSelectedDate(last?.summary.date ?? '');
      setErrorMessage(null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [period, loadHistoryTrends]);

  const onPeriodChange = (next: TrendPeriod) => {
    setLoading(true);
    setPeriod(next);
  };

  const days = trends ? toDayColumns(trends.daily) : [];
  const rows = trends ? toComparisonRows(trends.comparison) : [];
  const previousLegend = trends
    ? formatRangeLegend(
        trends.comparison.previousRange.startedAt,
        trends.comparison.previousRange.endedAt,
      )
    : '';
  const currentLegend = trends
    ? formatRangeLegend(
        trends.comparison.currentRange.startedAt,
        trends.comparison.currentRange.endedAt,
      )
    : '';
  const percentLabel = trends ? improvementPercentLabel(trends.comparison) : null;
  const sparkline = trends ? sparklineFromDaily(trends.daily) : [];

  const onSelectDay = (date: string) => {
    setSelectedDate(date);
    const column = days.find((d) => d.summary.date === date);
    if (column?.summary.sessionId) {
      router.push({
        pathname: '/session/[id]/summary',
        params: { id: column.summary.sessionId },
      });
    }
  };

  return (
    <Screen variant="scroll" background="app" edges={['left', 'right', 'bottom']} testID="history-screen">
      <View style={{ gap: spacing.sm, paddingTop: spacing.xs }}>
        <SegmentedControl
          options={[...segmentOptions]}
          value={period}
          onChange={onPeriodChange}
          testID="history-period-segment"
        />

        {loading ? (
          <View style={{ paddingVertical: spacing.xl, alignItems: 'center', gap: spacing.sm }}>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.fgCaption, fontFamily: fontFamily.regular, fontSize: fontSize.body }}>
              {historyCopy.loadingLabel}
            </Text>
          </View>
        ) : (
          <>
            {errorMessage ? (
              <Text
                accessibilityRole="alert"
                style={{
                  color: colors.alertText,
                  fontFamily: fontFamily.regular,
                  fontSize: fontSize.body,
                  textAlign: 'center',
                }}
              >
                {errorMessage}
              </Text>
            ) : null}

            <View style={{ gap: spacing.xs }}>
              <SectionHeader title={historyCopy.overviewTitle} />
              {days.length === 0 ? (
                <Text
                  style={{
                    color: colors.fgCaption,
                    fontFamily: fontFamily.regular,
                    fontSize: fontSize.body,
                    lineHeight: lineHeight.body,
                    paddingVertical: spacing.md,
                  }}
                >
                  {historyCopy.emptyOverview}
                </Text>
              ) : (
                <DayScoreStrip
                  days={days}
                  selectedDate={selectedDate}
                  onSelect={onSelectDay}
                  testID="history-day-strip"
                />
              )}
            </View>

            <ImprovementCard
              percentLabel={percentLabel}
              sparkline={sparkline}
              testID="history-improvement"
            />

            {rows.length > 0 ? (
              <WeeklyComparisonCard
                rows={rows}
                previousLegend={previousLegend}
                currentLegend={currentLegend}
                testID="history-comparison"
              />
            ) : null}

            <InsightsCard onPress={noop} testID="history-insights" />
          </>
        )}
      </View>

      <View style={{ height: spacing.lg }} />
    </Screen>
  );
}
