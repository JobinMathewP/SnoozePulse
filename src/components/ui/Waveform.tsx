import { useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { type SharedValue, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

import { colors, spacing } from '@/theme';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** Fixed relative bar heights — allocated once, never per frame (ADR-13 / PRD §8). */
const BAR_WEIGHTS = [
  0.22, 0.35, 0.55, 0.4, 0.7, 0.95, 0.6, 0.45, 0.8, 0.5, 0.3, 0.65, 0.9, 0.55, 0.4, 0.75, 0.85,
  0.5, 0.35, 0.6, 0.95, 0.7, 0.45, 0.3, 0.55, 0.8, 0.65, 0.4, 0.5, 0.75, 0.9, 0.6, 0.35, 0.5,
  0.7, 0.85, 0.55, 0.4, 0.65, 0.95, 0.75, 0.45, 0.3, 0.6, 0.8, 0.5, 0.35, 0.55,
] as const;

const DEFAULT_BAR_COUNT = 40;
const DEFAULT_HEIGHT = spacing.xl * 3;
const BAR_GAP = spacing.xs / 2;

type WaveBarProps = {
  readonly weight: number;
  readonly x: number;
  readonly barWidth: number;
  readonly height: number;
  readonly level: SharedValue<number>;
  readonly color: string;
};

function WaveBar({ weight, x, barWidth, height, level, color }: WaveBarProps) {
  const animatedProps = useAnimatedProps(() => {
    // `level` is 0–1. Mirror around the vertical centre like active-session.jpg.
    const clamped = Math.min(1, Math.max(0, level.value));
    const barHeight = Math.max(barWidth, clamped * weight * height * 0.5);
    const y = height / 2 - barHeight;
    return {
      y,
      height: barHeight * 2,
    };
  }, [weight, height, barWidth]);

  return (
    <AnimatedRect
      animatedProps={animatedProps}
      x={x}
      width={barWidth}
      rx={barWidth / 2}
      ry={barWidth / 2}
      fill={color}
      // Static initial geometry; animatedProps overwrite y/height on the UI thread.
      y={height / 2}
      height={barWidth}
    />
  );
}

export type WaveformProps = {
  /**
   * Live audio level in the range 0–1.
   * Must be a Reanimated shared value — never a React state number (ADR-13).
   */
  readonly level: SharedValue<number>;
  readonly barCount?: number;
  readonly height?: number;
  readonly color?: string;
  readonly width?: number;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

/**
 * Mirrored bar visualiser for Active Session.
 *
 * Reads `level` only through `useAnimatedProps` on the UI thread. Updating the shared
 * value at 10 Hz must not re-render this component — see `WaveformProof`.
 */
export function Waveform({
  level,
  barCount = DEFAULT_BAR_COUNT,
  height = DEFAULT_HEIGHT,
  color = colors.accentWaveform,
  width: explicitWidth,
  style,
  testID,
}: WaveformProps) {
  const width = explicitWidth ?? spacing.xl * 10;
  const count = Math.min(barCount, BAR_WEIGHTS.length);
  const barWidth = (width - BAR_GAP * (count - 1)) / count;

  const bars = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        weight: BAR_WEIGHTS[index] ?? 0.5,
        x: index * (barWidth + BAR_GAP),
      })),
    [count, barWidth],
  );

  return (
    <View
      accessible
      accessibilityLabel="Live audio waveform"
      accessibilityRole="image"
      style={style}
      testID={testID}
    >
      <Svg width={width} height={height}>
        {bars.map((bar) => (
          <WaveBar
            key={bar.index}
            weight={bar.weight}
            x={bar.x}
            barWidth={barWidth}
            height={height}
            level={level}
            color={color}
          />
        ))}
      </Svg>
    </View>
  );
}
