import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { Card } from '@/components/ui';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

import type { SnippetRowModel } from './format';

type SnippetRowProps = {
  readonly snippet: SnippetRowModel;
  readonly onPlay: () => void;
  /** Snippet times use alert red in summary-screen.jpg. */
  readonly emphasizeTime?: boolean;
  readonly testID?: string;
};

const MINI_WEIGHTS = [0.4, 0.7, 0.35, 0.9, 0.55, 0.75, 0.45, 0.65, 0.5, 0.8] as const;

/** Visual play disc — list-row scale; hitSlop preserves accessibility. */
const PLAY = spacing.lg;

/**
 * Thin list-like snore snippet row (summary-screen.jpg).
 */
export function SnippetRow({ snippet, onPlay, emphasizeTime = false, testID }: SnippetRowProps) {
  const waveWidth = spacing.xl * 2;
  const waveHeight = spacing.sm + spacing.xs;
  const gap = spacing.xs / 2;
  const barWidth = (waveWidth - gap * (MINI_WEIGHTS.length - 1)) / MINI_WEIGHTS.length;
  const timeColor = emphasizeTime ? colors.alertText : colors.fg;

  return (
    <Card width="full" tone="elevated" corner="md" border="subtle" inset="compact" testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Play snore snippet at ${snippet.timeLabel}`}
          hitSlop={spacing.sm}
          onPress={onPlay}
          style={{
            width: PLAY,
            height: PLAY,
            borderRadius: PLAY / 2,
            borderWidth: 1.5,
            borderColor: colors.alertText,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="play" size={fontSize.caption} color={colors.fg} />
        </Pressable>

        <View style={{ flex: 1, gap: 0, minWidth: 0 }}>
          <Text
            style={{
              color: timeColor,
              fontFamily: fontFamily.semibold,
              fontSize: fontSize.body,
              lineHeight: lineHeight.body,
            }}
          >
            {snippet.timeLabel}
          </Text>
          <Text
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
              opacity: 0.7,
            }}
          >
            {snippet.durationLabel}
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
                width={Math.max(1, barWidth)}
                height={h}
                rx={1}
                fill={colors.fg}
              />
            );
          })}
        </Svg>

        <Text
          style={{
            color: colors.fgCaption,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.caption,
            lineHeight: lineHeight.caption,
            minWidth: spacing.lg,
            textAlign: 'right',
          }}
        >
          {snippet.lengthLabel}
        </Text>
      </View>
    </Card>
  );
}
