import type {
  DailyScoreSummary,
  PeriodComparison,
  SnoreScoreBand,
  TrendPeriod,
} from '@/types';

/**
 * Static History copy and view-model mappers (no fixture data).
 */

export const historyCopy = {
  screenTitle: 'Your Progress',
  overviewTitle: 'Snore Score Overview',
  improvementTitle: "You're improving!",
  improvementPrefix: 'Snoring reduced by ',
  improvementSuffix: ' compared to last week.',
  improvementNeutral: 'Keep tracking nights to see your trend.',
  comparisonTitle: 'Weekly Comparison',
  comparisonTitleMonth: 'Monthly Comparison',
  insightsTitle: 'Insights',
  insightsBody:
    'Great job! Keep maintaining your sleep routine. Less caffeine and side sleeping may be helping.',
  insightsAccessibilityLabel: 'Insights. Great job! Keep maintaining your sleep routine.',
  segment7Label: '7 Days',
  segment30Label: '30 Days',
  avgScoreLabel: 'Avg. Snore Score',
  snoringTimeLabel: 'Total Snoring Time',
  snoreCountLabel: 'Snore Count (Avg.)',
  emptyOverview: 'No scored nights in this period yet.',
  loadingLabel: 'Loading progress…',
} as const;

export type DayColumnModel = {
  readonly summary: DailyScoreSummary;
  readonly weekdayLabel: string;
  readonly dayNumberLabel: string;
  readonly bandLabel: string;
  readonly band: SnoreScoreBand;
};

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

export const segmentOptions = [
  {
    value: '7d' as TrendPeriod,
    label: historyCopy.segment7Label,
    accessibilityLabel: 'Show last 7 days',
  },
  {
    value: '30d' as TrendPeriod,
    label: historyCopy.segment30Label,
    accessibilityLabel: 'Show last 30 days',
  },
] as const;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function bandLabel(band: SnoreScoreBand): string {
  switch (band) {
    case 'mild':
      return 'Mild';
    case 'moderate':
      return 'Moderate';
    case 'heavy':
      return 'Heavy';
  }
}

export function bandColorToken(
  band: SnoreScoreBand,
): 'successText' | 'warning' | 'alertText' {
  switch (band) {
    case 'mild':
      return 'successText';
    case 'moderate':
      return 'warning';
    case 'heavy':
      return 'alertText';
  }
}

/** Map scored days only — empty nights are omitted from the strip. */
export function toDayColumns(
  daily: readonly DailyScoreSummary[],
): readonly DayColumnModel[] {
  const columns: DayColumnModel[] = [];
  for (const summary of daily) {
    if (!summary.snoreScore) {
      continue;
    }
    const date = new Date(`${summary.date}T12:00:00`);
    columns.push({
      summary,
      weekdayLabel: WEEKDAYS[date.getDay()] ?? '',
      dayNumberLabel: String(date.getDate()),
      bandLabel: bandLabel(summary.snoreScore.band),
      band: summary.snoreScore.band,
    });
  }
  return columns;
}

export function formatRangeLegend(startedAt: number, endedAt: number): string {
  const start = new Date(startedAt);
  const end = new Date(endedAt - 1);
  return `${MONTHS[start.getMonth()]} ${start.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}`;
}

function formatDelta(ratio: number | null): { label: string; positive: boolean } {
  if (ratio === null) {
    return { label: '—', positive: false };
  }
  const pct = Math.round(Math.abs(ratio) * 100);
  // Lower snore score / snoring is an improvement.
  const improved = ratio < 0;
  return {
    label: `${improved ? '↓' : '↑'} ${pct}%`,
    positive: improved,
  };
}

function scoreBandFromAverage(value: number): SnoreScoreBand {
  if (value < 35) {
    return 'mild';
  }
  if (value < 65) {
    return 'moderate';
  }
  return 'heavy';
}

export function toComparisonRows(comparison: PeriodComparison): readonly ComparisonRowModel[] {
  const scoreDelta = formatDelta(comparison.averageSnoreScore.changeRatio);
  const timeDelta = formatDelta(comparison.totalSnoringMs.changeRatio);
  const countDelta = formatDelta(comparison.snoreCount.changeRatio);

  const prevBand = scoreBandFromAverage(comparison.averageSnoreScore.previous);
  const currBand = scoreBandFromAverage(comparison.averageSnoreScore.current);
  const prevToken = bandColorToken(prevBand);
  const currToken = bandColorToken(currBand);

  return [
    {
      id: 'score',
      label: historyCopy.avgScoreLabel,
      previousLabel: bandLabel(prevBand),
      previousColor: prevToken === 'successText' ? 'fg' : prevToken,
      currentLabel: bandLabel(currBand),
      currentColor: currToken,
      deltaLabel: scoreDelta.label,
      deltaPositive: scoreDelta.positive,
    },
    {
      id: 'time',
      label: historyCopy.snoringTimeLabel,
      previousLabel: `${Math.round(comparison.totalSnoringMs.previous / 60_000)} mins`,
      previousColor: 'fg',
      currentLabel: `${Math.round(comparison.totalSnoringMs.current / 60_000)} mins`,
      currentColor: timeDelta.positive ? 'successText' : 'fg',
      deltaLabel: timeDelta.label,
      deltaPositive: timeDelta.positive,
    },
    {
      id: 'count',
      label: historyCopy.snoreCountLabel,
      previousLabel: String(Math.round(comparison.snoreCount.previous)),
      previousColor: 'fg',
      currentLabel: String(Math.round(comparison.snoreCount.current)),
      currentColor: countDelta.positive ? 'successText' : 'fg',
      deltaLabel: countDelta.label,
      deltaPositive: countDelta.positive,
    },
  ];
}

/** Sparkline 0–1 from daily snore scores (inverted so “better” trends upward). */
export function sparklineFromDaily(
  daily: readonly DailyScoreSummary[],
): readonly number[] {
  const values = daily
    .map((d) => d.snoreScore?.value)
    .filter((v): v is number => typeof v === 'number');
  if (values.length === 0) {
    return [];
  }
  return values.map((v) => Math.max(0, Math.min(1, 1 - v / 100)));
}

export function improvementPercentLabel(comparison: PeriodComparison): string | null {
  const ratio = comparison.averageSnoreScore.changeRatio;
  if (ratio === null || ratio >= 0) {
    return null;
  }
  return `${Math.round(Math.abs(ratio) * 100)}%`;
}
