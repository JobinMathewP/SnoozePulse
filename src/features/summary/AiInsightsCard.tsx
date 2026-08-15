import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps, type ReactNode, useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors, fontFamily, fontSize, lineHeight, radius, spacing } from '@/theme';

import {
  AI_INSIGHTS_COPY,
  type AiInsight,
  type AiInsightsView,
  type SoundMix,
} from './aiInsights';

/**
 * "AI Insights" card on Summary — replaces the old Detection Breakdown row list.
 *
 * Layout mirrors the mockup shared during Task 6.8: a heading with a pulsing AI icon, one
 * featured insight (AI Accuracy) in an inner tile, a 3-column grid of secondary insights
 * (Snoring Level / Pattern / Rhythm), and a wide Sound Mix summary underneath.
 *
 * The tone/label mapping is decided by `deriveAiInsights`; this component is pure
 * presentation.
 */
export type AiInsightsCardProps = {
  readonly view: AiInsightsView;
  readonly testID?: string;
};

const ICON_CIRCLE = spacing.xl + spacing.md;
const FEATURED_ICON = spacing.xl + spacing.md + spacing.xs;
const AI_ICON = spacing.xl + spacing.md;

export function AiInsightsCard({ view, testID }: AiInsightsCardProps) {
  return (
    <View testID={testID} style={{ gap: spacing.md }}>
      <View
        style={{
          backgroundColor: colors.settingsCard,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.settingsCardBorder,
          padding: spacing.md,
          gap: spacing.md,
        }}
      >
        <AiHeader />
        <FeaturedInsight insight={view.featured} />
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          {view.secondary.map((insight, index) => (
            <View key={insight.id} style={{ flex: 1 }}>
              <SecondaryTile insight={insight} appearIndex={index} />
            </View>
          ))}
        </View>
        <SoundMixCard mix={view.soundMix} />
      </View>
    </View>
  );
}

function AiHeader() {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.9 - (pulse.value - 1) * 3,
  }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <View
        style={{
          width: AI_ICON,
          height: AI_ICON,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: AI_ICON,
              height: AI_ICON,
              borderRadius: AI_ICON / 2,
              backgroundColor: colors.insightAiAccuracy,
              opacity: 0.2,
            },
            haloStyle,
          ]}
        />
        <View
          style={{
            width: AI_ICON - spacing.xs,
            height: AI_ICON - spacing.xs,
            borderRadius: (AI_ICON - spacing.xs) / 2,
            backgroundColor: colors.insightAiAccuracy,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: colors.fg,
              fontFamily: fontFamily.bold,
              fontSize: fontSize.caption,
              lineHeight: fontSize.caption,
              letterSpacing: 1,
            }}
          >
            AI
          </Text>
        </View>
      </View>
      <Text
        style={{
          color: colors.fg,
          fontFamily: fontFamily.semibold,
          fontSize: fontSize.title,
          lineHeight: lineHeight.title,
        }}
      >
        {AI_INSIGHTS_COPY.header}
      </Text>
    </View>
  );
}

function FeaturedInsight({ insight }: { readonly insight: AiInsight }) {
  return (
    <View
      style={{
        backgroundColor: colors.insightTile,
        borderRadius: radius.lg,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
      }}
    >
      <IconBadge
        color={insight.accent}
        size={FEATURED_ICON}
        icon={<Ionicons name="locate-outline" size={FEATURED_ICON * 0.55} color={insight.accent} />}
      />
      <View style={{ flex: 1, gap: spacing.xs / 2 }}>
        <Text
          style={{
            color: colors.fgCaption,
            fontFamily: fontFamily.medium,
            fontSize: fontSize.body,
            lineHeight: lineHeight.body,
          }}
        >
          {insight.label}
        </Text>
        <Text
          style={{
            color: insight.accent,
            fontFamily: fontFamily.bold,
            fontSize: fontSize.display,
            lineHeight: lineHeight.display,
          }}
        >
          {insight.value}
        </Text>
        <DotStrip color={insight.accent} filled={insight.dots} appearIndex={0} />
      </View>
    </View>
  );
}

function SecondaryTile({
  insight,
  appearIndex,
}: {
  readonly insight: AiInsight;
  readonly appearIndex: number;
}) {
  const iconName = iconNameFor(insight.id);
  return (
    <View
      style={{
        backgroundColor: colors.insightTile,
        borderRadius: radius.lg,
        padding: spacing.sm,
        gap: spacing.xs,
        alignItems: 'flex-start',
        minHeight: spacing.xl * 3 + spacing.md,
      }}
    >
      <IconBadge
        color={insight.accent}
        size={ICON_CIRCLE}
        icon={
          <Ionicons
            name={iconName}
            size={ICON_CIRCLE * 0.55}
            color={insight.accent}
          />
        }
      />
      <Text
        style={{
          color: colors.fgCaption,
          fontFamily: fontFamily.medium,
          fontSize: fontSize.caption,
          lineHeight: lineHeight.caption,
        }}
      >
        {insight.label}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          color: insight.accent,
          fontFamily: fontFamily.bold,
          fontSize: fontSize.title,
          lineHeight: lineHeight.title,
        }}
      >
        {insight.value}
      </Text>
      <DotStrip color={insight.accent} filled={insight.dots} appearIndex={appearIndex + 1} />
    </View>
  );
}

function SoundMixCard({ mix }: { readonly mix: SoundMix }) {
  const accent = colors.insightSoundMix;
  return (
    <View
      style={{
        backgroundColor: colors.insightTile,
        borderRadius: radius.lg,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
      }}
    >
      <IconBadge
        color={accent}
        size={ICON_CIRCLE}
        icon={<Ionicons name="bar-chart-outline" size={ICON_CIRCLE * 0.55} color={accent} />}
      />
      <View style={{ flex: 1, gap: spacing.xs / 2 }}>
        <Text
          style={{
            color: colors.fgCaption,
            fontFamily: fontFamily.medium,
            fontSize: fontSize.body,
            lineHeight: lineHeight.body,
          }}
        >
          {AI_INSIGHTS_COPY.soundMixLabel}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'baseline' }}>
          <CountReadout accent={accent} count={mix.snoringCount} label={AI_INSIGHTS_COPY.snoresSuffix} />
          <CountReadout accent={accent} count={mix.snortCount} label={AI_INSIGHTS_COPY.snortsSuffix} />
        </View>
      </View>
    </View>
  );
}

function CountReadout({
  accent,
  count,
  label,
}: {
  readonly accent: string;
  readonly count: number;
  readonly label: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs / 2 }}>
      <Text
        style={{
          color: accent,
          fontFamily: fontFamily.bold,
          fontSize: fontSize.heading,
          lineHeight: lineHeight.heading,
        }}
      >
        {count}
      </Text>
      <Text
        style={{
          color: colors.fg,
          fontFamily: fontFamily.medium,
          fontSize: fontSize.body,
          lineHeight: lineHeight.body,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function IconBadge({
  color,
  size,
  icon,
}: {
  readonly color: string;
  readonly size: number;
  readonly icon: ReactNode;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.insightHalo,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: 0.14,
        }}
      />
      {icon}
    </View>
  );
}

function DotStrip({
  color,
  filled,
  appearIndex,
}: {
  readonly color: string;
  readonly filled: number;
  readonly appearIndex: number;
}) {
  const dots = [0, 1, 2, 3, 4] as const;
  const size = spacing.xs + spacing.xs / 4;
  return (
    <View
      accessible
      accessibilityLabel={`${filled} of 5`}
      style={{ flexDirection: 'row', gap: spacing.xs / 2 }}
    >
      {dots.map((index) => (
        <AnimatedDot
          key={index}
          index={index}
          appearGroup={appearIndex}
          size={size}
          active={index < filled}
          color={color}
        />
      ))}
    </View>
  );
}

function AnimatedDot({
  index,
  appearGroup,
  size,
  active,
  color,
}: {
  readonly index: number;
  readonly appearGroup: number;
  readonly size: number;
  readonly active: boolean;
  readonly color: string;
}) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    const groupDelay = appearGroup * 80;
    const dotDelay = index * 60;
    opacity.value = withDelay(
      groupDelay + dotDelay,
      withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }),
    );
  }, [appearGroup, index, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: active ? color : colors.borderCard,
        },
        style,
      ]}
    />
  );
}

function iconNameFor(id: AiInsight['id']): ComponentProps<typeof Ionicons>['name'] {
  switch (id) {
    case 'snoringLevel':
      return 'fitness-outline';
    case 'pattern':
      return 'analytics-outline';
    case 'rhythm':
      return 'heart-outline';
    case 'aiAccuracy':
    default:
      return 'locate-outline';
  }
}

