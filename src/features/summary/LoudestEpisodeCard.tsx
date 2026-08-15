import { Pressable, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { Card } from '@/components/ui';
import { hitSlopForVisualSize } from '@/components/ui/touchTarget';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

import { summaryCopy } from './format';
import { summaryCardStyle, SummaryIconTile } from './SummaryIconTile';

type LoudestEpisodeCardProps = {
  readonly timeLabel: string;
  readonly detailLabel: string;
  readonly onPlay: () => void;
  readonly playable?: boolean;
  readonly playing?: boolean;
  readonly testID?: string;
};

const MINI_WEIGHTS = [
  0.3, 0.55, 0.8, 0.45, 0.95, 0.6, 0.35, 0.7, 0.5, 0.85, 0.4, 0.65, 0.5, 0.75, 0.55, 0.9, 0.4,
] as const;

/** Compact outlined play — visual ~28 dp; hitSlop expands to 44. */
const PLAY = spacing.lg + spacing.xs;

/**
 * “Loudest Snore Episode” — dense row matching summary-screen.jpg (~40 dp tall).
 */
export function LoudestEpisodeCard({
  timeLabel,
  detailLabel,
  onPlay,
  playable = true,
  playing = false,
  testID,
}: LoudestEpisodeCardProps) {
  const waveWidth = spacing.xl * 4 + spacing.md;
  const waveHeight = spacing.md + spacing.xs;
  const gap = spacing.xs / 2;
  const barWidth = (waveWidth - gap * (MINI_WEIGHTS.length - 1)) / MINI_WEIGHTS.length;

  return (
    <Card
      width="full"
      tone="elevated"
      corner="lg"
      border="subtle"
      inset="compact"
      style={summaryCardStyle}
      testID={testID}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
          <Text
            style={{
              color: colors.settingsSection,
              fontFamily: fontFamily.semibold,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
              textTransform: 'uppercase',
              letterSpacing: 1,
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
            {timeLabel}
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
            {detailLabel}
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
          accessibilityLabel={
            playable
              ? playing
                ? 'Pause loudest snore episode'
                : 'Play loudest snore episode'
              : 'No audio for loudest snore episode'
          }
          accessibilityState={{ disabled: !playable }}
          disabled={!playable}
          hitSlop={hitSlopForVisualSize(PLAY)}
          onPress={onPlay}
        >
          <SummaryIconTile name={playing ? 'pause' : 'play'} color={playable ? colors.fg : colors.fgCaption} />
        </Pressable>
      </View>
    </Card>
  );
}
