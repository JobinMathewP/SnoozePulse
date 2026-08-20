import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { Card } from '@/components/ui';
import { colors, fontFamily, fontSize, lineHeight, radius, spacing } from '@/theme';
import type { MissedNightReason, SleepSession } from '@/types';

import { lastNightCopy, missedNightCopy } from './copy';

type LastNightCardProps = {
  readonly session: SleepSession | null;
  readonly missedReason: MissedNightReason | null;
  readonly batterySavedCaption: string | null;
  readonly loading: boolean;
  readonly onView: () => void;
  readonly testID?: string;
};

const RING_SIZE = spacing.xl * 3;
const RING_STROKE = spacing.sm;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const homeChrome = {
  backgroundColor: colors.homeCard,
  borderColor: colors.homeCardBorder,
} as const;

/** Compact `Hh Mm` duration for the card, kept local so Home does not import Summary. */
function formatDuration(startedAt: number, endedAt: number | null): string {
  const ms = Math.max(0, (endedAt ?? startedAt) - startedAt);
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}

function SnoreScoreRing({ value }: { readonly value: number | null }) {
  const progress = value === null ? 0 : Math.min(1, Math.max(0, value / 100));
  const dash = RING_CIRCUMFERENCE * progress;
  const gap = RING_CIRCUMFERENCE - dash;
  const label = value !== null ? String(Math.round(value)) : '—';

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="homeSnoreRing" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={colors.homeRingStart} />
            <Stop offset="100%" stopColor={colors.homeRingEnd} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={colors.homeDivider}
          strokeWidth={RING_STROKE}
          fill="none"
        />
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke="url(#homeSnoreRing)"
          strokeWidth={RING_STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        />
      </Svg>
      <Text
        style={{
          color: colors.fg,
          fontFamily: fontFamily.bold,
          fontSize: fontSize.title,
          lineHeight: lineHeight.title,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

/**
 * Home "Last night" entry (ADR-30). Snore-score ring and duration from the newest completed
 * session; opens Summary. Empty state stays honest on a fresh install.
 */
export function LastNightCard({
  session,
  missedReason,
  batterySavedCaption,
  loading,
  onView,
  testID,
}: LastNightCardProps) {
  if (loading) {
    return (
      <Card width="full" tone="elevated" corner="md" border="subtle" style={homeChrome} testID={testID}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <ActivityIndicator color={colors.homeAccent} />
          <Text
            style={{
              color: colors.homeGreeting,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.body,
            }}
          >
            {lastNightCopy.title}
          </Text>
        </View>
      </Card>
    );
  }

  if (missedReason !== null) {
    const copy = missedNightCopy[missedReason];
    return (
      <Card width="full" tone="elevated" corner="md" border="subtle" style={homeChrome} testID={testID}>
        <View
          accessible
          accessibilityRole="text"
          accessibilityLabel={`${copy.title} ${copy.body}`}
          style={{ gap: spacing.xs / 2 }}
        >
          <Text
            style={{
              color: colors.homeGreeting,
              fontFamily: fontFamily.medium,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
            }}
          >
            {lastNightCopy.title}
          </Text>
          <Text
            accessibilityRole="header"
            style={{
              color: colors.fg,
              fontFamily: fontFamily.semibold,
              fontSize: fontSize.bodyLg,
              lineHeight: lineHeight.bodyLg,
            }}
          >
            {copy.title}
          </Text>
          <Text
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.body,
              lineHeight: lineHeight.body,
            }}
          >
            {copy.body}
          </Text>
        </View>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card width="full" tone="elevated" corner="md" border="subtle" style={homeChrome} testID={testID}>
        <View style={{ gap: spacing.xs / 2 }}>
          <Text
            style={{
              color: colors.homeGreeting,
              fontFamily: fontFamily.medium,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
            }}
          >
            {lastNightCopy.title}
          </Text>
          <Text
            style={{
              color: colors.fg,
              fontFamily: fontFamily.semibold,
              fontSize: fontSize.bodyLg,
              lineHeight: lineHeight.bodyLg,
            }}
          >
            {lastNightCopy.emptyTitle}
          </Text>
          <Text
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.body,
              lineHeight: lineHeight.body,
            }}
          >
            {lastNightCopy.emptyBody}
          </Text>
        </View>
      </Card>
    );
  }

  const bedTile = spacing.xl + spacing.sm;

  return (
    <Card
      width="full"
      tone="elevated"
      corner="md"
      border="subtle"
      style={homeChrome}
      onPress={onView}
      accessibilityLabel={lastNightCopy.viewAccessibilityLabel}
      testID={testID}
    >
      <Text
        style={{
          color: colors.homeGreeting,
          fontFamily: fontFamily.medium,
          fontSize: fontSize.caption,
          lineHeight: lineHeight.caption,
          marginBottom: spacing.sm,
        }}
      >
        {lastNightCopy.title}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, alignItems: 'center', gap: spacing.xs }}>
          <SnoreScoreRing value={session.snoreScore} />
          <Text
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
            }}
          >
            {lastNightCopy.scoreLabel}
          </Text>
        </View>
        <View
          style={{
            width: 1,
            alignSelf: 'stretch',
            backgroundColor: colors.homeDivider,
            marginHorizontal: spacing.md,
          }}
        />
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View
            style={{
              width: bedTile,
              height: bedTile,
              borderRadius: radius.full,
              backgroundColor: colors.homeTabPill,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              accessibilityElementsHidden
              importantForAccessibility="no"
              name="bed-outline"
              size={fontSize.title}
              color={colors.homeAccent}
            />
          </View>
          <View style={{ gap: spacing.xs / 2, minWidth: 0 }}>
            <Text
              style={{
                color: colors.fg,
                fontFamily: fontFamily.bold,
                fontSize: fontSize.title,
                lineHeight: lineHeight.title,
              }}
            >
              {formatDuration(session.startedAt, session.endedAt)}
            </Text>
            <Text
              style={{
                color: colors.fgCaption,
                fontFamily: fontFamily.regular,
                fontSize: fontSize.caption,
              }}
            >
              {lastNightCopy.durationLabel}
            </Text>
          </View>
        </View>
      </View>
      {batterySavedCaption !== null ? (
        <Text
          accessibilityRole="text"
          accessibilityLabel={batterySavedCaption}
          style={{
            color: colors.fgCaption,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.caption,
            lineHeight: lineHeight.caption,
            marginTop: spacing.sm,
          }}
        >
          {batterySavedCaption}
        </Text>
      ) : null}
    </Card>
  );
}
