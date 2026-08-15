import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type DimensionValue,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TOUCH_TARGET } from '@/components/ui/touchTarget';
import { useInsights } from '@/hooks';
import { colors, fontFamily, fontSize, lineHeight, radius, spacing } from '@/theme';
import type { SleepSession } from '@/types';

import { DayRing } from './DayRing';
import {
  aggregateByDay,
  buildMonthCells,
  calendarCopy,
  groupSessionCountsByDay,
  historyMonthRange,
  isoLocalFromMs,
  monthIndexAtCenter,
  monthLabel,
  monthShortLabel,
  monthsBetween,
  quietFraction,
  sessionsForDay,
  WEEKDAY_LABELS,
  type DayAggregate,
  type YearMonth,
} from './models';
import {
  RubberBandScrollView,
  type RubberBandScrollViewHandle,
} from './RubberBandScrollView';

type CalendarSheetProps = {
  readonly visible: boolean;
  readonly onClose: () => void;
  /** Called with the chosen session id; the caller navigates (and typically unmounts this sheet). */
  readonly onSelectSession: (id: string) => void;
  /**
   * Local "now" captured by the opener (not `Date.now()` during render). Drives the current
   * month, today highlight, and the 7-lead / next-month window so the grid can paint immediately.
   */
  readonly initialDateMs: number;
  /** Prefetched nights; when omitted the sheet loads them in the background. */
  readonly sessions?: readonly SleepSession[];
  readonly testID?: string;
};

const DAY_CELL_HEIGHT = 60;
const RING_SIZE = 30;
const RING_STROKE = 3.5;
const COLUMN_WIDTH: DimensionValue = `${100 / 7}%`;
const HISTORY_LIMIT = 2000;

type MonthLayout = { readonly y: number; readonly height: number };

function formatStartClock(ms: number): string {
  const d = new Date(ms);
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) {
    hours = 12;
  }
  return `${hours}:${minutes < 10 ? `0${minutes}` : minutes} ${meridiem}`;
}

function completedSessions(list: readonly SleepSession[]): readonly SleepSession[] {
  return list.filter((s) => s.endedAt !== null);
}

/**
 * Sleep history calendar (ADR-30). Monday-first continuous scroll: seven empty months before
 * the first recorded night through next month after today. Nights are keyed by bedtime
 * (`startedAt`). The current month is centered on every open.
 */
export function CalendarSheet({
  visible,
  onClose,
  onSelectSession,
  initialDateMs,
  sessions: sessionsProp,
  testID,
}: CalendarSheetProps) {
  const { listRecentSessions } = useInsights();
  const insets = useSafeAreaInsets();

  const todayIso = isoLocalFromMs(initialDateMs);
  const currentYm = useMemo<YearMonth>(() => {
    const d = new Date(initialDateMs);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [initialDateMs]);

  const [loadedSessions, setLoadedSessions] = useState<readonly SleepSession[]>(
    sessionsProp ? completedSessions(sessionsProp) : [],
  );
  const [centerMonthIdx, setCenterMonthIdx] = useState(-1);
  const [pickerIso, setPickerIso] = useState<string | null>(null);

  const scrollRef = useRef<RubberBandScrollViewHandle>(null);
  const monthLayouts = useRef<MonthLayout[]>([]);
  const viewportHeight = useRef(0);
  const didInitialScroll = useRef(false);

  const sessions = sessionsProp ? completedSessions(sessionsProp) : loadedSessions;

  // Background fetch only when the parent did not prefetch. State is set in the async
  // continuation so the grid never waits on SQLite to appear.
  useEffect(() => {
    if (sessionsProp !== undefined) {
      return;
    }
    let cancelled = false;
    listRecentSessions(HISTORY_LIMIT).then((result) => {
      if (cancelled) {
        return;
      }
      setLoadedSessions(result.ok ? completedSessions(result.value) : []);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionsProp, listRecentSessions]);

  const countsByIso = useMemo(() => groupSessionCountsByDay(sessions), [sessions]);
  const aggregates = useMemo(() => aggregateByDay(sessions), [sessions]);

  const months = useMemo<readonly YearMonth[]>(() => {
    const { start, end } = historyMonthRange(sessions, currentYm);
    return monthsBetween(start, end);
  }, [sessions, currentYm]);

  const currentMonthIdx = useMemo(
    () => months.findIndex((m) => m.year === currentYm.year && m.month === currentYm.month),
    [months, currentYm],
  );

  const centerCurrentMonth = useCallback(() => {
    if (didInitialScroll.current) {
      return;
    }
    const idx = currentMonthIdx;
    const layout = idx >= 0 ? monthLayouts.current[idx] : undefined;
    const viewport = viewportHeight.current;
    if (layout === undefined || viewport <= 0) {
      return;
    }
    const y = Math.max(0, layout.y + layout.height / 2 - viewport / 2);
    scrollRef.current?.scrollTo({ y, animated: false });
    didInitialScroll.current = true;
  }, [currentMonthIdx]);

  const pickSession = (id: string) => {
    onSelectSession(id);
    onClose();
  };

  const onDayPress = (iso: string) => {
    const forDay = sessionsForDay(sessions, iso);
    if (forDay.length === 0) {
      return;
    }
    if (forDay.length === 1) {
      pickSession(forDay[0].id);
      return;
    }
    setPickerIso(iso);
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = monthIndexAtCenter(
      monthLayouts.current,
      event.nativeEvent.contentOffset.y,
      event.nativeEvent.layoutMeasurement.height,
    );
    if (idx >= 0 && idx !== centerMonthIdx) {
      setCenterMonthIdx(idx);
    }
  };

  const fallbackIdx = currentMonthIdx >= 0 ? currentMonthIdx : months.length - 1;
  const effectiveCenterIdx =
    centerMonthIdx < 0
      ? fallbackIdx
      : Math.min(centerMonthIdx, Math.max(0, months.length - 1));
  const titleMonth = months[Math.max(0, effectiveCenterIdx)];
  const daySessions = pickerIso ? sessionsForDay(sessions, pickerIso) : [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={{ flex: 1, backgroundColor: colors.scrim }}>
        <View
          style={{
            flex: 1,
            marginTop: spacing.sm,
            backgroundColor: colors.calBg,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
          }}
        >
          <View
            style={{
              paddingTop: insets.top + spacing.sm,
              paddingHorizontal: spacing.md,
              paddingBottom: spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              accessibilityRole="header"
              style={{
                color: colors.fg,
                fontFamily: fontFamily.semibold,
                fontSize: fontSize.bodyLg,
                lineHeight: lineHeight.bodyLg,
              }}
            >
              {titleMonth ? monthLabel(titleMonth.year, titleMonth.month) : calendarCopy.title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={calendarCopy.closeAccessibilityLabel}
              onPress={onClose}
              hitSlop={spacing.sm}
              style={{
                position: 'absolute',
                right: spacing.md,
                top: insets.top + spacing.xs,
                width: TOUCH_TARGET,
                height: TOUCH_TARGET,
                borderRadius: radius.full,
                backgroundColor: colors.calControl,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={fontSize.title} color={colors.fg} />
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: 'row',
              paddingHorizontal: spacing.md,
              paddingBottom: spacing.xs,
            }}
          >
            {WEEKDAY_LABELS.map((label, i) => (
              <Text
                key={`${label}-${i}`}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  color: colors.calWeekday,
                  fontFamily: fontFamily.medium,
                  fontSize: fontSize.caption,
                }}
              >
                {label}
              </Text>
            ))}
          </View>

          <RubberBandScrollView
            ref={scrollRef}
            onScroll={onScroll}
            onLayout={(e) => {
              viewportHeight.current = e.nativeEvent.layout.height;
              centerCurrentMonth();
            }}
            onContentSizeChange={() => {
              centerCurrentMonth();
            }}
            contentContainerStyle={{
              paddingHorizontal: spacing.md,
              paddingBottom: insets.bottom,
            }}
          >
            {months.map((m, index) => (
              <MonthBlock
                key={`${m.year}-${m.month}`}
                year={m.year}
                month={m.month}
                countsByIso={countsByIso}
                aggregates={aggregates}
                todayIso={todayIso}
                onDayPress={onDayPress}
                onLayout={(y, height) => {
                  monthLayouts.current[index] = { y, height };
                  if (index === currentMonthIdx) {
                    centerCurrentMonth();
                  }
                }}
              />
            ))}
          </RubberBandScrollView>
        </View>
      </View>

      <Modal
        visible={pickerIso !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerIso(null)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={calendarCopy.multiClose}
          onPress={() => setPickerIso(null)}
          style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}
        >
          <Pressable
            onPress={() => undefined}
            style={{
              backgroundColor: colors.calBg,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingHorizontal: spacing.md,
              paddingTop: spacing.md,
              paddingBottom: insets.bottom + spacing.lg,
              gap: spacing.sm,
            }}
          >
            <Text
              accessibilityRole="header"
              style={{
                color: colors.fg,
                fontFamily: fontFamily.semibold,
                fontSize: fontSize.bodyLg,
                lineHeight: lineHeight.bodyLg,
              }}
            >
              {calendarCopy.multiTitle}
            </Text>
            <ScrollView style={{ maxHeight: TOUCH_TARGET * 5 }}>
              {daySessions.map((s) => (
                <Pressable
                  key={s.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Open session from ${formatStartClock(s.startedAt)}`}
                  onPress={() => pickSession(s.id)}
                  style={{
                    minHeight: TOUCH_TARGET,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: spacing.sm,
                    borderRadius: radius.md,
                    backgroundColor: colors.calRingTrack,
                    marginBottom: spacing.xs,
                  }}
                >
                  <Text
                    style={{
                      color: colors.fg,
                      fontFamily: fontFamily.medium,
                      fontSize: fontSize.body,
                    }}
                  >
                    {formatStartClock(s.startedAt)}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={fontSize.body}
                    color={colors.calWeekday}
                  />
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}

type MonthBlockProps = {
  readonly year: number;
  readonly month: number;
  readonly countsByIso: Map<string, number>;
  readonly aggregates: Map<string, DayAggregate>;
  readonly todayIso: string;
  readonly onDayPress: (iso: string) => void;
  readonly onLayout: (y: number, height: number) => void;
};

function MonthBlock({
  year,
  month,
  countsByIso,
  aggregates,
  todayIso,
  onDayPress,
  onLayout,
}: MonthBlockProps) {
  const cells = buildMonthCells(year, month, countsByIso);
  const leading = cells.findIndex((c) => c !== null);
  const leadingBlanks = leading === -1 ? 0 : leading;

  return (
    <View
      onLayout={(e) => {
        onLayout(e.nativeEvent.layout.y, e.nativeEvent.layout.height);
      }}
    >
      <View
        style={{
          marginTop: spacing.lg,
          marginBottom: spacing.xs,
          marginLeft: `${(leadingBlanks / 7) * 100}%`,
        }}
      >
        <Text
          style={{
            color: colors.fg,
            fontFamily: fontFamily.bold,
            fontSize: fontSize.title,
            lineHeight: lineHeight.title,
          }}
        >
          {monthShortLabel(month)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((cell, index) => {
          if (cell === null) {
            return (
              <View
                key={`pad-${index}`}
                style={{ width: COLUMN_WIDTH, height: DAY_CELL_HEIGHT }}
              />
            );
          }
          const quiet = quietFraction(aggregates.get(cell.iso));
          const isToday = cell.iso === todayIso;
          const isFuture = cell.iso > todayIso;
          const hasData = cell.sessionCount > 0;

          let numberColor: string = colors.calWeekday;
          if (isToday) {
            numberColor = colors.calRingStart;
          } else if (hasData || !isFuture) {
            numberColor = colors.fg;
          }

          return (
            <Pressable
              key={cell.iso}
              accessibilityRole="button"
              accessibilityLabel={calendarCopy.dayAccessibilityLabel(
                cell.iso,
                cell.sessionCount,
                quiet,
              )}
              disabled={!hasData}
              onPress={() => onDayPress(cell.iso)}
              style={{
                width: COLUMN_WIDTH,
                height: DAY_CELL_HEIGHT,
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: spacing.xs,
                paddingTop: spacing.xs,
              }}
            >
              <Text
                style={{
                  color: numberColor,
                  fontFamily: isToday ? fontFamily.bold : fontFamily.medium,
                  fontSize: fontSize.body,
                  lineHeight: lineHeight.body,
                }}
              >
                {cell.day}
              </Text>
              <DayRing
                size={RING_SIZE}
                strokeWidth={RING_STROKE}
                progress={quiet}
                gradientId={`ring-${cell.iso}`}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
