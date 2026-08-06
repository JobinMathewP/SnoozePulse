import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { CardRow, MetricCard, Screen, SectionHeader, TimelineCard } from '@/components/ui';
import { colors, fontSize, spacing } from '@/theme';

import { DateNavigator } from './DateNavigator';
import { LoudestEpisodeCard } from './LoudestEpisodeCard';
import {
  bucketsToTimelineBars,
  mockSessionBuckets,
  mockSessionSummary,
  mockSnippets,
  mockTimelinePeakCallout,
  summaryCopy,
} from './mock';
import { SummaryMetricsStrip } from './SummaryMetricsStrip';
import { SnippetRow } from './SnippetRow';

const noop = (): void => undefined;

const snoreBandLabel = (band: string): string => {
  switch (band) {
    case 'mild':
      return 'Mild';
    case 'heavy':
      return 'Heavy';
    case 'moderate':
    default:
      return 'Moderate';
  }
};

function ClockGlyph() {
  return (
    <Ionicons
      accessibilityElementsHidden
      importantForAccessibility="no"
      name="time-outline"
      size={fontSize.body}
      color={colors.fgCaption}
    />
  );
}

function PeakWaveGlyph() {
  return (
    <Svg
      accessibilityElementsHidden
      importantForAccessibility="no"
      width={fontSize.body}
      height={fontSize.body}
      viewBox="0 0 24 24"
    >
      <Path
        d="M3 12h2l2-4 3 8 3-6 2 2h4"
        stroke={colors.alertText}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Morning Summary — dense Apple Health–style layout from docs/summary-screen.jpg.
 */
export function SummaryScreen() {
  const summary = mockSessionSummary;
  const bars = bucketsToTimelineBars(mockSessionBuckets);

  return (
    <Screen
      variant="scroll"
      background="app"
      edges={['left', 'right', 'bottom']}
      testID="summary-screen"
    >
      <DateNavigator
        label={summaryCopy.dateLabel}
        onPrev={noop}
        onNext={noop}
        onCalendar={noop}
        testID="summary-date-navigator"
      />

      <View style={{ gap: spacing.sm }}>
        <SummaryMetricsStrip
          snoreCount={summary.snoreCount}
          snoreScoreLabel={snoreBandLabel(summary.snoreScore.band)}
          filledDots={summary.snoreScore.filledDots}
          testID="summary-metrics-strip"
        />

        <CardRow>
          <MetricCard
            width="half"
            tone="elevated"
            corner="md"
            border="subtle"
            inset="compact"
            label={summaryCopy.snoringTimeLabel}
            value={summaryCopy.snoringTimeValue}
            caption={summaryCopy.snoringTimeCaption}
            trailingIcon={<ClockGlyph />}
            testID="summary-metric-snoring-time"
          />
          <MetricCard
            width="half"
            tone="elevated"
            corner="md"
            border="subtle"
            inset="compact"
            label={summaryCopy.peakLoudnessLabel}
            value={summaryCopy.peakLoudnessValue}
            unit={summaryCopy.peakLoudnessUnit}
            caption={summaryCopy.peakLoudnessCaption}
            trailingIcon={<PeakWaveGlyph />}
            testID="summary-metric-peak"
          />
        </CardRow>

        <LoudestEpisodeCard onPlay={noop} testID="summary-loudest-episode" />

        <TimelineCard
          bars={bars}
          peakCallout={mockTimelinePeakCallout}
          onBarPress={noop}
          onInfoPress={noop}
          testID="summary-timeline"
        />

        <View style={{ gap: spacing.xs }}>
          <SectionHeader title={summaryCopy.snippetsTitle} />
          {mockSnippets.map((snippet) => (
            <SnippetRow
              key={snippet.event.id}
              snippet={snippet}
              onPlay={noop}
              emphasizeTime
              testID={`summary-snippet-${snippet.event.id}`}
            />
          ))}
        </View>
      </View>

      <View style={{ height: spacing.lg }} />
    </Screen>
  );
}
