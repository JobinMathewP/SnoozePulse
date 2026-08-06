import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { CardRow, MetricCard, Screen, SectionHeader, TimelineCard } from '@/components/ui';
import { useInsights, useSnippetPlayback } from '@/hooks';
import type { SessionDetail } from '@/store';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';
import type { SleepSession, SnoreEvent } from '@/types';
import { TIMELINE_BUCKET_DURATION_MS } from '@/utils';

import { DateNavigator } from './DateNavigator';
import {
  bucketStartFromBarId,
  bucketsToTimelineBars,
  formatClock,
  formatClockRange,
  formatDurationShort,
  formatMinutesLabel,
  formatPercentOfSleep,
  formatSummaryDateLabel,
  loudestDisplay,
  loudestEventInBucket,
  peakCalloutFromSummary,
  summaryCopy,
  toSnippetRows,
} from './format';
import { LoudestEpisodeCard } from './LoudestEpisodeCard';
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

type SummaryScreenProps = {
  readonly sessionId: string;
};

/**
 * Morning Summary — live session detail via store → analytics (ADR-12).
 * Timeline taps and snippet rows play through AudioService (Task 5.4).
 */
export function SummaryScreen({ sessionId }: SummaryScreenProps) {
  const router = useRouter();
  const { loadSessionDetail, listRecentSessions } = useInsights();
  const { playback, playSnippet, pauseSnippet, stopSnippet } = useSnippetPlayback();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [sessions, setSessions] = useState<readonly SleepSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [detailResult, listResult] = await Promise.all([
        loadSessionDetail(sessionId),
        listRecentSessions(),
      ]);
      if (cancelled) {
        return;
      }
      if (!detailResult.ok) {
        setDetail(null);
        setErrorMessage(detailResult.error.message);
        setLoading(false);
        return;
      }
      setDetail(detailResult.value);
      setErrorMessage(null);
      if (listResult.ok) {
        setSessions(listResult.value.filter((s) => s.endedAt !== null));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, loadSessionDetail, listRecentSessions]);

  useEffect(() => {
    return () => {
      void stopSnippet();
    };
  }, [sessionId, stopSnippet]);

  const toggleEventPlayback = (event: SnoreEvent): void => {
    if (event.audioPath === null) {
      return;
    }
    if (playback.eventId === event.id && playback.playing) {
      void pauseSnippet();
      return;
    }
    void playSnippet(event.id, event.audioPath);
  };

  const goNeighbor = (direction: -1 | 1) => {
    // sessions are newest-first; previous night is higher index.
    const index = sessions.findIndex((s) => s.id === sessionId);
    if (index < 0) {
      return;
    }
    const next = sessions[index + direction];
    if (!next) {
      return;
    }
    router.replace({
      pathname: '/session/[id]/summary',
      params: { id: next.id },
    });
  };

  if (loading) {
    return (
      <Screen variant="fixed" background="app" edges={['left', 'right', 'bottom']} testID="summary-screen">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ color: colors.fgCaption, fontFamily: fontFamily.regular, fontSize: fontSize.body }}>
            {summaryCopy.loadingLabel}
          </Text>
        </View>
      </Screen>
    );
  }

  if (!detail) {
    return (
      <Screen variant="fixed" background="app" edges={['left', 'right', 'bottom']} testID="summary-screen">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm }}>
          <Text
            style={{
              color: colors.fg,
              fontFamily: fontFamily.semibold,
              fontSize: fontSize.title,
              textAlign: 'center',
            }}
          >
            {summaryCopy.emptyTitle}
          </Text>
          <Text
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.body,
              lineHeight: lineHeight.body,
              textAlign: 'center',
            }}
          >
            {errorMessage ?? summaryCopy.emptyBody}
          </Text>
        </View>
      </Screen>
    );
  }

  const { summary, buckets, events } = detail;
  const bars = bucketsToTimelineBars(buckets);
  const peakCallout = peakCalloutFromSummary(summary, buckets);
  const snippets = toSnippetRows(events);
  const loudest = loudestDisplay(summary);
  const loudestEpisode = summary.loudestEpisode;
  const dateAnchor = summary.range.endedAt;
  const progress =
    playback.durationMs > 0 ? playback.positionMs / playback.durationMs : 0;

  return (
    <Screen
      variant="scroll"
      background="app"
      edges={['left', 'right', 'bottom']}
      testID="summary-screen"
    >
      <DateNavigator
        label={formatSummaryDateLabel(dateAnchor)}
        onPrev={() => {
          goNeighbor(1);
        }}
        onNext={() => {
          goNeighbor(-1);
        }}
        onCalendar={noop}
        testID="summary-date-navigator"
      />

      <View style={{ gap: spacing.sm }}>
        <SummaryMetricsStrip
          sleepDurationValue={formatDurationShort(summary.durationMs)}
          sleepDurationCaption={formatClockRange(summary.range.startedAt, summary.range.endedAt)}
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
            value={formatMinutesLabel(summary.totalSnoringMs)}
            caption={formatPercentOfSleep(summary.snoringShare)}
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
            value={String(Math.round(summary.peakDb))}
            unit={summaryCopy.peakLoudnessUnit}
            caption={
              summary.peakAt !== null
                ? `at ${formatClock(summary.peakAt)}`
                : formatDurationShort(summary.durationMs)
            }
            trailingIcon={<PeakWaveGlyph />}
            testID="summary-metric-peak"
          />
        </CardRow>

        {loudest && loudestEpisode ? (
          <LoudestEpisodeCard
            timeLabel={loudest.timeLabel}
            detailLabel={loudest.detailLabel}
            playable={loudestEpisode.audioPath !== null}
            playing={playback.eventId === loudestEpisode.id && playback.playing}
            onPlay={() => {
              toggleEventPlayback(loudestEpisode);
            }}
            testID="summary-loudest-episode"
          />
        ) : null}

        {bars.length > 0 ? (
          <TimelineCard
            bars={bars}
            peakCallout={peakCallout}
            onBarPress={(bar) => {
              const bucketStart = bucketStartFromBarId(bar.id);
              if (bucketStart === null) {
                return;
              }
              const event = loudestEventInBucket(
                events,
                bucketStart,
                TIMELINE_BUCKET_DURATION_MS,
              );
              if (!event) {
                return;
              }
              toggleEventPlayback(event);
            }}
            onInfoPress={noop}
            testID="summary-timeline"
          />
        ) : null}

        {snippets.length > 0 ? (
          <View style={{ gap: spacing.xs }}>
            <SectionHeader title={summaryCopy.snippetsTitle} />
            {snippets.map((snippet) => {
              const active = playback.eventId === snippet.event.id;
              return (
                <SnippetRow
                  key={snippet.event.id}
                  snippet={snippet}
                  playing={active && playback.playing}
                  progress={active ? progress : 0}
                  onPlay={() => {
                    toggleEventPlayback(snippet.event);
                  }}
                  emphasizeTime
                  testID={`summary-snippet-${snippet.event.id}`}
                />
              );
            })}
          </View>
        ) : null}

        <Text
          style={{
            color: colors.fgCaption,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.caption,
            textAlign: 'center',
            marginTop: spacing.sm,
          }}
        >
          {formatClockRange(summary.range.startedAt, summary.range.endedAt)} ·{' '}
          {formatDurationShort(summary.durationMs)}
        </Text>
      </View>

      <View style={{ height: spacing.lg }} />
    </Screen>
  );
}
