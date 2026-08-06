import { useState } from 'react';
import { View } from 'react-native';

import { Screen, SectionHeader, SegmentedControl } from '@/components/ui';
import { spacing } from '@/theme';
import type { TrendPeriod } from '@/types';

import { DayScoreStrip } from './DayScoreStrip';
import { ImprovementCard } from './ImprovementCard';
import { InsightsCard } from './InsightsCard';
import {
  historyCopy,
  mockComparisonRows30d,
  mockComparisonRows7d,
  mockDays30d,
  mockDays7d,
  mockSelectedDate30d,
  mockSelectedDate7d,
  segmentOptions,
} from './mock';
import { WeeklyComparisonCard } from './WeeklyComparisonCard';

const noop = (): void => undefined;

/**
 * History / Your Progress — trends with mock data (Task 3.5).
 * Maps to docs/history-screen.jpg. No Insights/Profile tabs (ADR-09).
 */
export function HistoryScreen() {
  const [period, setPeriod] = useState<TrendPeriod>('7d');
  const [selectedDate, setSelectedDate] = useState(mockSelectedDate7d);

  const isWeek = period === '7d';
  const days = isWeek ? mockDays7d : mockDays30d;
  const rows = isWeek ? mockComparisonRows7d : mockComparisonRows30d;
  const previousLegend = isWeek ? historyCopy.previousLegend : 'Apr 21 – May 5';
  const currentLegend = isWeek ? historyCopy.currentLegend : 'May 6 – May 20';

  const onPeriodChange = (next: TrendPeriod) => {
    setPeriod(next);
    setSelectedDate(next === '7d' ? mockSelectedDate7d : mockSelectedDate30d);
  };

  return (
    <Screen variant="scroll" background="app" edges={['left', 'right', 'bottom']} testID="history-screen">
      <View style={{ gap: spacing.sm, paddingTop: spacing.xs }}>
        <SegmentedControl
          options={segmentOptions}
          value={period}
          onChange={onPeriodChange}
          testID="history-period-segment"
        />

        <View style={{ gap: spacing.xs }}>
          <SectionHeader title={historyCopy.overviewTitle} />
          <DayScoreStrip
            days={days}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
            testID="history-day-strip"
          />
        </View>

        <ImprovementCard testID="history-improvement" />

        <WeeklyComparisonCard
          rows={rows}
          previousLegend={previousLegend}
          currentLegend={currentLegend}
          testID="history-comparison"
        />

        <InsightsCard onPress={noop} testID="history-insights" />
      </View>

      <View style={{ height: spacing.lg }} />
    </Screen>
  );
}
