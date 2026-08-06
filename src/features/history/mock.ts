import type { DailyScoreSummary, PeriodComparison, SnoreScoreBand, TrendPeriod } from '@/types';

/**
 * History mock for May 2024 — matches history-screen.jpg.
 * Shaped like analytics types so Task 5.3 is a data swap. Deleted in Task 5.3.
 */

export const historyCopy = {
  screenTitle: 'Your Progress',
  overviewTitle: 'Snore Score Overview',
  improvementTitle: "You're improving! 🎉",
  improvementPrefix: 'Snoring reduced by ',
  improvementSuffix: ' compared to last week.',
  comparisonTitle: 'Weekly Comparison',
  insightsTitle: 'Insights',
  insightsBody:
    'Great job! Keep maintaining your sleep routine. Less caffeine and side sleeping may be helping.',
  insightsAccessibilityLabel: 'Insights. Great job! Keep maintaining your sleep routine.',
  segment7Label: '7 Days',
  segment30Label: '30 Days',
  previousLegend: 'May 7 – May 13',
  currentLegend: 'May 14 – May 20',
  avgScoreLabel: 'Avg. Snore Score',
  snoringTimeLabel: 'Total Snoring Time',
  snoreCountLabel: 'Snore Count (Avg.)',
} as const;

export type DayColumnModel = {
  readonly summary: DailyScoreSummary;
  readonly weekdayLabel: string;
  readonly dayNumberLabel: string;
  readonly bandLabel: string;
  readonly band: SnoreScoreBand;
};

const bandLabel = (band: SnoreScoreBand): string => {
  switch (band) {
    case 'mild':
      return 'Mild';
    case 'moderate':
      return 'Moderate';
    case 'heavy':
      return 'Heavy';
  }
};

const day = (
  iso: string,
  weekday: string,
  dayNum: string,
  band: SnoreScoreBand,
  value: number,
  filledDots: number,
  sessionId: string,
): DayColumnModel => ({
  summary: {
    date: iso,
    sessionId,
    snoreScore: { value, band, filledDots },
  },
  weekdayLabel: weekday,
  dayNumberLabel: dayNum,
  bandLabel: bandLabel(band),
  band,
});

/** Selected day in history-screen.jpg — Mon 20 Mild. */
export const mockSelectedDate7d = '2024-05-20';

export const mockDays7d: readonly DayColumnModel[] = [
  day('2024-05-14', 'Tue', '14', 'heavy', 82, 5, 's14'),
  day('2024-05-15', 'Wed', '15', 'moderate', 58, 4, 's15'),
  day('2024-05-16', 'Thu', '16', 'moderate', 55, 4, 's16'),
  day('2024-05-17', 'Fri', '17', 'mild', 32, 2, 's17'),
  day('2024-05-18', 'Sat', '18', 'mild', 30, 2, 's18'),
  day('2024-05-19', 'Sun', '19', 'mild', 28, 2, 's19'),
  day('2024-05-20', 'Mon', '20', 'mild', 26, 2, 's20'),
];

/** Sparse 30-day strip — still mock; selection defaults to the last day. */
export const mockSelectedDate30d = '2024-05-20';

export const mockDays30d: readonly DayColumnModel[] = [
  day('2024-04-21', 'Sun', '21', 'heavy', 78, 5, 's421'),
  day('2024-04-28', 'Sun', '28', 'moderate', 60, 4, 's428'),
  day('2024-05-05', 'Sun', '5', 'moderate', 52, 3, 's505'),
  day('2024-05-12', 'Sun', '12', 'mild', 38, 2, 's512'),
  day('2024-05-14', 'Tue', '14', 'heavy', 82, 5, 's14'),
  day('2024-05-17', 'Fri', '17', 'mild', 32, 2, 's17'),
  day('2024-05-20', 'Mon', '20', 'mild', 26, 2, 's20'),
];

export const mockImprovement = {
  percentLabel: '14%',
  /** Sparkline points 0–1, left → right (upward trend in the mock). */
  sparkline: [0.25, 0.32, 0.28, 0.45, 0.52, 0.48, 0.62, 0.7, 0.78, 0.85, 0.92] as const,
} as const;

export type ComparisonRowModel = {
  readonly id: string;
  readonly label: string;
  readonly previousLabel: string;
  readonly previousColor: 'fg' | 'warning' | 'alertText';
  readonly currentLabel: string;
  readonly currentColor: 'fg' | 'successText' | 'warning' | 'alertText';
  readonly deltaLabel: string;
  readonly deltaPositive: boolean;
};

export const mockComparisonRows7d: readonly ComparisonRowModel[] = [
  {
    id: 'score',
    label: historyCopy.avgScoreLabel,
    previousLabel: 'Moderate',
    previousColor: 'warning',
    currentLabel: 'Mild',
    currentColor: 'successText',
    deltaLabel: '↓ 14%',
    deltaPositive: true,
  },
  {
    id: 'time',
    label: historyCopy.snoringTimeLabel,
    previousLabel: '49 mins',
    previousColor: 'fg',
    currentLabel: '42 mins',
    currentColor: 'successText',
    deltaLabel: '↓ 14%',
    deltaPositive: true,
  },
  {
    id: 'count',
    label: historyCopy.snoreCountLabel,
    previousLabel: '312',
    previousColor: 'fg',
    currentLabel: '268',
    currentColor: 'successText',
    deltaLabel: '↓ 14%',
    deltaPositive: true,
  },
];

export const mockComparisonRows30d: readonly ComparisonRowModel[] = [
  {
    id: 'score',
    label: historyCopy.avgScoreLabel,
    previousLabel: 'Heavy',
    previousColor: 'alertText',
    currentLabel: 'Moderate',
    currentColor: 'warning',
    deltaLabel: '↓ 11%',
    deltaPositive: true,
  },
  {
    id: 'time',
    label: historyCopy.snoringTimeLabel,
    previousLabel: '58 mins',
    previousColor: 'fg',
    currentLabel: '45 mins',
    currentColor: 'successText',
    deltaLabel: '↓ 22%',
    deltaPositive: true,
  },
  {
    id: 'count',
    label: historyCopy.snoreCountLabel,
    previousLabel: '340',
    previousColor: 'fg',
    currentLabel: '290',
    currentColor: 'successText',
    deltaLabel: '↓ 15%',
    deltaPositive: true,
  },
];

/** Domain-shaped comparison for the 7-day window (percentages are mock, not computed). */
export const mockPeriodComparison7d: PeriodComparison = {
  period: '7d',
  currentRange: {
    startedAt: Date.parse('2024-05-14T00:00:00'),
    endedAt: Date.parse('2024-05-20T23:59:59'),
  },
  previousRange: {
    startedAt: Date.parse('2024-05-07T00:00:00'),
    endedAt: Date.parse('2024-05-13T23:59:59'),
  },
  averageSnoreScore: { current: 26, previous: 58, changeRatio: -0.14 },
  totalSnoringMs: { current: 42 * 60_000, previous: 49 * 60_000, changeRatio: -0.14 },
  snoreCount: { current: 268, previous: 312, changeRatio: -0.14 },
};

export const segmentOptions = [
  { value: '7d' as TrendPeriod, label: historyCopy.segment7Label, accessibilityLabel: 'Show last 7 days' },
  {
    value: '30d' as TrendPeriod,
    label: historyCopy.segment30Label,
    accessibilityLabel: 'Show last 30 days',
  },
] as const;
