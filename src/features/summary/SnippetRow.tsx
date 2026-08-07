import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { Card } from '@/components/ui';
import { hitSlopForVisualSize } from '@/components/ui/touchTarget';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

import type { SnippetRowModel } from './format';

type SnippetRowProps = {
  readonly snippet: SnippetRowModel;
  readonly onPlay: () => void;
  /** True when this row's snippet is the active player and currently playing. */
  readonly playing?: boolean;
  /** 0–1 progress when this row is the active player. */
  readonly progress?: number;
  /**
   * When true, the row uses the "loudest episode" treatment from summary-screen.jpg: red
   * time text, red-outlined play button, red mini-waveform. Other rows stay in the neutral
   * white treatment. Only one row per session is emphasized — the one matching
   * `SessionSummary.loudestEpisode`.
   */
  readonly emphasizeTime?: boolean;
  readonly testID?: string;
};

const MINI_WEIGHTS = [0.4, 0.7, 0.35, 0.9, 0.55, 0.75, 0.45, 0.65, 0.5, 0.8] as const;

/** Visual play disc — list-row scale; hitSlop preserves 44×44. */
const PLAY = spacing.lg;

/**
 * Thin list-like snore snippet row (summary-screen.jpg).
 * Null `audioPath` disables play without crashing (Task 5.4).
 */
export function SnippetRow({
  snippet,
  onPlay,
  playing = false,
  progress = 0,
  emphasizeTime = false,
  testID,
}: SnippetRowProps) {
  const waveWidth = spacing.xl * 2;
  const waveHeight = spacing.sm + spacing.xs;
  const gap = spacing.xs / 2;
  const barWidth = (waveWidth - gap * (MINI_WEIGHTS.length - 1)) / MINI_WEIGHTS.length;
  const timeColor = emphasizeTime ? colors.alertText : colors.fg;
  const emphasisColor = emphasizeTime ? colors.alertText : colors.fg;
  const playable = snippet.event.audioPath !== null;
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <Card width="full" tone="elevated" corner="md" border="subtle" inset="compact" testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            playable
              ? playing
                ? `Pause snore snippet at ${snippet.timeLabel}`
                : `Play snore snippet at ${snippet.timeLabel}`
              : `No audio for snore snippet at ${snippet.timeLabel}`
          }
          accessibilityState={{ disabled: !playable }}
          disabled={!playable}
          hitSlop={hitSlopForVisualSize(PLAY)}
          onPress={onPlay}
          style={{
            width: PLAY,
            height: PLAY,
            borderRadius: PLAY / 2,
            borderWidth: 1.5,
            borderColor: playable ? emphasisColor : colors.fgCaption,
            opacity: playable ? 1 : 0.4,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={playing ? 'pause' : 'play'}
            size={fontSize.caption}
            color={colors.fg}
          />
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
          {playing || clampedProgress > 0 ? (
            <View
              style={{
                marginTop: spacing.xs / 2,
                height: 2,
                borderRadius: 1,
                backgroundColor: colors.fg,
                opacity: 0.15,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${clampedProgress * 100}%`,
                  height: '100%',
                  backgroundColor: colors.alertText,
                }}
              />
            </View>
          ) : null}
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
                fill={emphasisColor}
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
