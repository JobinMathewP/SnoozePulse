import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { Card } from '@/components/ui';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

import { loudestEpisodeDisplay, summaryCopy } from './mock';

type LoudestEpisodeCardProps = {
  readonly onPlay: () => void;
  readonly testID?: string;
};

const MINI_WEIGHTS = [
  0.3, 0.55, 0.8, 0.45, 0.95, 0.6, 0.35, 0.7, 0.5, 0.85, 0.4, 0.65, 0.5, 0.75, 0.55, 0.9, 0.4,
] as const;

/** Compact outlined play — visual ~28 dp; hitSlop expands the target. */
const PLAY = spacing.lg + spacing.xs;

/**
 * “Loudest Snore Episode” — dense row matching summary-screen.jpg (~40 dp tall).
 */
export function LoudestEpisodeCard({ onPlay, testID }: LoudestEpisodeCardProps) {
  const waveWidth = spacing.xl * 4 + spacing.md;
  const waveHeight = spacing.md + spacing.xs;
  const gap = spacing.xs / 2;
  const barWidth = (waveWidth - gap * (MINI_WEIGHTS.length - 1)) / MINI_WEIGHTS.length;

  return (
    <Card width="full" tone="elevated" corner="md" border="subtle" inset="compact" testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: spacing.xs / 2, minWidth: 0 }}>
          <Text
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
              opacity: 0.65,
            }}
          >
            {summaryCopy.loudestTitle}
          </Text>
          <Text
            style={{
              color: colors.fg,
              fontFamily: fontFamily.semibold,
              fontSize: fontSize.title,
              lineHeight: lineHeight.title,
            }}
          >
            {loudestEpisodeDisplay.timeLabel}
          </Text>
          <Text
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
              opacity: 0.6,
            }}
          >
            {loudestEpisodeDisplay.detailLabel}
          </Text>
        </View>

        <Svg width={waveWidth} height={waveHeight}>
          {MINI_WEIGHTS.map((weight, index) => {
            const h = Math.max(spacing.xs / 2, weight * waveHeight);
            return (
              <Rect
                key={index}
                x={index * (barWidth + gap)}
                y={(waveHeight - h) / 2}
                width={barWidth}
                height={h}
                rx={barWidth / 2}
                fill={colors.alertText}
              />
            );
          })}
        </Svg>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Play loudest snore episode"
          hitSlop={spacing.sm}
          onPress={onPlay}
          style={{
            width: PLAY,
            height: PLAY,
            borderRadius: PLAY / 2,
            borderWidth: 1.5,
            borderColor: colors.fg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="play" size={fontSize.caption} color={colors.fg} />
        </Pressable>
      </View>
    </Card>
  );
}
