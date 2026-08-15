import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import {
  Button,
  Card,
  CardRow,
  InfoDialog,
  MetricCard,
  Screen,
  SectionHeader,
  TimelineCard,
} from '@/components/ui';
import { TOUCH_TARGET } from '@/components/ui/touchTarget';
import { CalendarSheet } from '@/features/calendar';
import { useInsights, useSnippetPlayback } from '@/hooks';
import type { SessionDetail } from '@/store';
import { colors, fontFamily, fontSize, lineHeight, radius, spacing } from '@/theme';
import type { SleepSession, SnoreEvent } from '@/types';

import { DateNavigator } from './DateNavigator';
import {
  formatClock,
  formatClockRange,
  formatDurationShort,
  formatMinutesLabel,
  formatPercentOfSleep,
  formatSummaryDateLabel,
  loudestDisplay,
  playableSnippetCount,
  SNIPPET_LIST_LIMIT,
  summaryCopy,
  toSnippetRows,
} from './format';
import { AiInsightsCard } from './AiInsightsCard';
import { deriveAiInsights } from './aiInsights';
import { LoudestEpisodeCard } from './LoudestEpisodeCard';
import { deriveScoreBreakdown } from './scoreBreakdown';
import { SummaryMetricsStrip } from './SummaryMetricsStrip';
import { summaryCardStyle, SummaryIconTile } from './SummaryIconTile';
import { SnippetRow } from './SnippetRow';
import { deriveTimelineFromSession } from './timeline';

function SummaryHeader() {
  const router = useRouter();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={summaryCopy.backAccessibilityLabel}
        onPress={() => {
          router.back();
        }}
        style={{
          width: TOUCH_TARGET,
          height: TOUCH_TARGET,
          borderRadius: radius.full,
          backgroundColor: colors.settingsCard,
          borderWidth: 1,
          borderColor: colors.settingsCardBorder,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        testID="summary-back"
      >
        <Ionicons name="chevron-back" size={fontSize.title} color={colors.fg} />
      </Pressable>
      <Text
        accessibilityRole="header"
        style={{
          flex: 1,
          color: colors.fg,
          fontFamily: fontFamily.bold,
          fontSize: fontSize.heading,
          lineHeight: lineHeight.heading,
        }}
      >
        {summaryCopy.title}
      </Text>
    </View>
  );
}

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

type SummaryScreenProps = {
  readonly sessionId: string;
  /** True when this night was opened from the calendar — Back reopens the sheet first. */
  readonly fromCalendar?: boolean;
};

/**
 * Morning Summary — live session detail via store → analytics (ADR-12).
 * Snippet rows and the loudest episode play through AudioService (Task 5.4).
 * The night's calendar day is bedtime (`startedAt`), never wake time.
 */
export function SummaryScreen({ sessionId, fromCalendar = false }: SummaryScreenProps) {
  const router = useRouter();
  const navigation = useNavigation();
  const { loadSessionDetail, listRecentSessions } = useInsights();
  const { playback, playSnippet, pauseSnippet, stopSnippet } = useSnippetPlayback();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [sessions, setSessions] = useState<readonly SleepSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarNowMs, setCalendarNowMs] = useState<number | null>(null);
  const [calendarReturnDone, setCalendarReturnDone] = useState(false);
  const [timelineInfoOpen, setTimelineInfoOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
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
  }, [sessionId, loadSessionDetail, listRecentSessions, reloadToken]);

  useEffect(() => {
    return () => {
      void stopSnippet();
    };
  }, [sessionId, stopSnippet]);

  // First Back after a calendar-opened night reopens the sheet; closing it (X or Back)
  // then lets the next Back pop to History.
  useEffect(() => {
    if (!fromCalendar || calendarReturnDone) {
      return;
    }
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      if (calendarOpen) {
        setCalendarOpen(false);
        setCalendarReturnDone(true);
        return;
      }
      setCalendarNowMs(Date.now());
      setCalendarOpen(true);
    });
    return unsubscribe;
  }, [fromCalendar, calendarReturnDone, calendarOpen, navigation]);

  const closeCalendar = () => {
    setCalendarOpen(false);
    if (fromCalendar) {
      setCalendarReturnDone(true);
    }
  };

  const openCalendar = () => {
    setCalendarNowMs(Date.now());
    setCalendarOpen(true);
  };

  const calendarParams = fromCalendar ? { fromCalendar: '1' } : {};

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
      params: { id: next.id, ...calendarParams },
    });
  };

  if (loading) {
    return (
      <Screen variant="fixed" background="app" edges={['top', 'left', 'right', 'bottom']} testID="summary-screen">
        <View style={{ flex: 1, gap: spacing.md, paddingTop: spacing.sm }}>
          <SummaryHeader />
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.fgCaption, fontFamily: fontFamily.regular, fontSize: fontSize.body }}>
              {summaryCopy.loadingLabel}
            </Text>
          </View>
        </View>
      </Screen>
    );
  }

  if (!detail) {
    return (
      <Screen variant="fixed" background="app" edges={['top', 'left', 'right', 'bottom']} testID="summary-screen">
        <View style={{ flex: 1, gap: spacing.md, paddingTop: spacing.sm }}>
          <SummaryHeader />
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
          {errorMessage ? (
            <Button
              variant="primary"
              label={summaryCopy.retryLabel}
              accessibilityLabel={summaryCopy.retryAccessibilityLabel}
              onPress={() => {
                setReloadToken((n) => n + 1);
              }}
              testID="summary-retry"
            />
          ) : null}
          </View>
        </View>
      </Screen>
    );
  }

  const { summary, events } = detail;
  const timeline = deriveTimelineFromSession(events, summary);
  const snippets = toSnippetRows(events);
  const clipped = playableSnippetCount(events) > SNIPPET_LIST_LIMIT;
  const loudest = loudestDisplay(summary);
  const loudestEpisode = summary.loudestEpisode;
  const dateAnchor = summary.range.startedAt;
  const scoreBreakdown = deriveScoreBreakdown(events, summary);
  const aiInsights = deriveAiInsights(scoreBreakdown);
  const progress =
    playback.durationMs > 0 ? playback.positionMs / playback.durationMs : 0;

  return (
    <Screen
      variant="scroll"
      background="app"
      edges={['top', 'left', 'right', 'bottom']}
      contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.sm }}
      testID="summary-screen"
    >
      <SummaryHeader />
      <DateNavigator
        label={formatSummaryDateLabel(dateAnchor)}
        onPrev={() => {
          goNeighbor(1);
        }}
        onNext={() => {
          goNeighbor(-1);
        }}
        onCalendar={openCalendar}
        testID="summary-date-navigator"
      />

      {calendarOpen && calendarNowMs !== null ? (
        <CalendarSheet
          visible
          onClose={closeCalendar}
          initialDateMs={calendarNowMs}
          sessions={sessions}
          onSelectSession={(id) => {
            if (id !== sessionId) {
              router.replace({
                pathname: '/session/[id]/summary',
                params: { id, fromCalendar: '1' },
              });
              return;
            }
            closeCalendar();
          }}
          testID="summary-calendar-sheet"
        />
      ) : null}

      <InfoDialog
        visible={timelineInfoOpen}
        title={summaryCopy.timelineInfoTitle}
        message={summaryCopy.timelineInfoBody}
        dismissLabel={summaryCopy.infoDismissLabel}
        dismissAccessibilityLabel={summaryCopy.infoDismissAccessibilityLabel}
        onDismiss={() => {
          setTimelineInfoOpen(false);
        }}
        testID="summary-timeline-info"
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
            corner="lg"
            border="subtle"
            inset="compact"
            style={summaryCardStyle}
            label={summaryCopy.snoringTimeLabel}
            value={formatMinutesLabel(summary.totalSnoringMs)}
            caption={formatPercentOfSleep(summary.snoringShare)}
            trailingIcon={<SummaryIconTile name="time-outline" />}
            testID="summary-metric-snoring-time"
          />
          <MetricCard
            width="half"
            tone="elevated"
            corner="lg"
            border="subtle"
            inset="compact"
            style={summaryCardStyle}
            label={summaryCopy.peakLoudnessLabel}
            value={String(Math.round(summary.peakDb))}
            unit={summaryCopy.peakLoudnessUnit}
            caption={
              summary.peakAt !== null
                ? `at ${formatClock(summary.peakAt)}`
                : formatDurationShort(summary.durationMs)
            }
            trailingIcon={<SummaryIconTile name="pulse-outline" color={colors.alertText} />}
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

        {events.length > 0 ? (
          <AiInsightsCard view={aiInsights} testID="summary-ai-insights" />
        ) : null}

        {timeline.bars.length > 0 ? (
          <TimelineCard
            bars={timeline.bars}
            peakCallout={timeline.peakCallout}
            onInfoPress={() => {
              setTimelineInfoOpen(true);
            }}
            testID="summary-timeline"
          />
        ) : null}

        {snippets.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <SectionHeader title={summaryCopy.snippetsTitle} tone="premium" />
            <Card
              width="full"
              tone="elevated"
              corner="lg"
              border="subtle"
              inset="compact"
              style={summaryCardStyle}
            >
              {snippets.map((snippet, index) => {
                const active = playback.eventId === snippet.event.id;
                const isLoudest =
                  loudestEpisode !== null && snippet.event.id === loudestEpisode.id;
                return (
                  <View key={snippet.event.id}>
                    {index > 0 ? (
                      <View style={{ height: 1, backgroundColor: colors.settingsCardBorder }} />
                    ) : null}
                    <SnippetRow
                      snippet={snippet}
                      playing={active && playback.playing}
                      progress={active ? progress : 0}
                      onPlay={() => {
                        toggleEventPlayback(snippet.event);
                      }}
                      emphasizeTime={isLoudest}
                      testID={`summary-snippet-${snippet.event.id}`}
                    />
                  </View>
                );
              })}
            </Card>
            {clipped ? (
              <Text
                style={{
                  color: colors.fgCaption,
                  fontFamily: fontFamily.regular,
                  fontSize: fontSize.caption,
                  lineHeight: lineHeight.caption,
                  paddingHorizontal: spacing.xs,
                }}
              >
                {summaryCopy.snippetsCaption}
              </Text>
            ) : null}
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
