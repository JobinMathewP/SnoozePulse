import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors, fontFamily, fontSize, lineHeight, radius, spacing } from '@/theme';

import { Card } from './Card';
import { SectionHeader } from './SectionHeader';
import { hitSlopForVisualSize, TOUCH_TARGET } from './touchTarget';

/** Default Y-axis ceiling matching summary-screen.jpg (0–80 dB). */
const DEFAULT_MAX_DB = 80;

export type TimelineBarModel = {
  readonly id: string;
  /** Tick under the bar — empty string hides the label but keeps the column. */
  readonly timeLabel: string;
  readonly averageDb: number;
  readonly peakDb: number;
};

export type TimelinePeakCallout = {
  readonly barId: string;
  /** Text inside the callout bubble — "68 dB". */
  readonly label: string;
};

type TimelineCardProps = {
  readonly bars: readonly TimelineBarModel[];
  readonly maxDb?: number;
  readonly peakCallout?: TimelinePeakCallout;
  readonly onBarPress: (bar: TimelineBarModel) => void;
  readonly onInfoPress?: () => void;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

/** Chart body ~70–90 dp plot from summary-screen.jpg — delicate, not Material-tall. */
const CALLOUT_ROW = spacing.lg;
const PLOT_HEIGHT = spacing.xl * 2 + spacing.md;
const AXIS_WIDTH = spacing.xl;

/**
 * Summary "Snoring Timeline": fine gradient bars, quiet axes, small peak callout.
 */
export function TimelineCard({
  bars,
  maxDb = DEFAULT_MAX_DB,
  peakCallout,
  onBarPress,
  onInfoPress,
  style,
  testID,
}: TimelineCardProps) {
  const yTicks = [maxDb, maxDb * 0.75, maxDb * 0.5, maxDb * 0.25, 0] as const;
  const peakIndex = peakCallout ? bars.findIndex((bar) => bar.id === peakCallout.barId) : -1;

  return (
    <Card width="full" tone="elevated" corner="md" border="subtle" inset="compact" style={style} testID={testID}>
      <SectionHeader
        title="Snoring Timeline"
        onInfoPress={onInfoPress}
        infoAccessibilityLabel="About snoring timeline"
      />
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: AXIS_WIDTH, paddingRight: spacing.xs / 2 }}>
          <Text
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
              textAlign: 'right',
              height: CALLOUT_ROW,
              opacity: 0.55,
            }}
          >
            (dB)
          </Text>
          <View style={{ height: PLOT_HEIGHT, justifyContent: 'space-between' }}>
            {yTicks.map((tick) => (
              <Text
                key={tick}
                style={{
                  color: colors.fgCaption,
                  fontFamily: fontFamily.regular,
                  fontSize: fontSize.caption,
                  lineHeight: fontSize.caption,
                  textAlign: 'right',
                  opacity: 0.55,
                }}
              >
                {Math.round(tick)}
              </Text>
            ))}
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ height: CALLOUT_ROW }}>
            {peakCallout && peakIndex >= 0 ? (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: `${((peakIndex + 0.5) / bars.length) * 100}%`,
                }}
              >
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: colors.alertText,
                    backgroundColor: colors.bgApp,
                    borderRadius: radius.xs,
                    paddingHorizontal: spacing.xs,
                    paddingVertical: spacing.xs / 2,
                    transform: [{ translateX: -(spacing.lg / 2 + spacing.xs) }],
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color: colors.alertText,
                      fontFamily: fontFamily.medium,
                      fontSize: fontSize.caption,
                      lineHeight: fontSize.caption,
                    }}
                  >
                    {peakCallout.label}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          <View style={{ height: PLOT_HEIGHT }}>
            <Svg
              width="100%"
              height={PLOT_HEIGHT}
              style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
            >
              {yTicks.map((tick) => {
                const y = PLOT_HEIGHT - (tick / maxDb) * PLOT_HEIGHT;
                return (
                  <Line
                    key={`grid-${tick}`}
                    x1="0"
                    y1={y}
                    x2="100%"
                    y2={y}
                    stroke={colors.fg}
                    strokeOpacity={0.06}
                    strokeWidth={1}
                  />
                );
              })}
              {peakIndex >= 0 && bars[peakIndex]
                ? (() => {
                    const peakIntensity = Math.min(
                      1,
                      Math.max(0, bars[peakIndex]!.peakDb / maxDb),
                    );
                    const peakBarTop = PLOT_HEIGHT - peakIntensity * PLOT_HEIGHT;
                    return (
                      <Line
                        x1={`${((peakIndex + 0.5) / bars.length) * 100}%`}
                        y1={0}
                        x2={`${((peakIndex + 0.5) / bars.length) * 100}%`}
                        y2={peakBarTop}
                        stroke={colors.alertText}
                        strokeOpacity={0.6}
                        strokeWidth={1}
                        strokeDasharray="2 3"
                      />
                    );
                  })()
                : null}
            </Svg>

            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end' }}>
              {bars.map((bar) => {
                const intensity = Math.min(1, Math.max(0, bar.peakDb / maxDb));
                const barHeight = Math.max(spacing.xs, intensity * PLOT_HEIGHT);

                return (
                  <Pressable
                    key={bar.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Snore level ${Math.round(bar.peakDb)} decibels at ${bar.timeLabel || 'this time'}`}
                    accessibilityHint="Double tap to play audio for this time range"
                    hitSlop={hitSlopForVisualSize(TOUCH_TARGET)}
                    onPress={() => {
                      onBarPress(bar);
                    }}
                    style={{
                      flex: 1,
                      minWidth: spacing.sm,
                      minHeight: TOUCH_TARGET,
                      height: Math.max(PLOT_HEIGHT, TOUCH_TARGET),
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                    }}
                  >
                    <Svg width="45%" height={barHeight}>
                      <Defs>
                        <LinearGradient id={`timeline-${bar.id}`} x1="0" y1="1" x2="0" y2="0">
                          <Stop offset="0%" stopColor={colors.timelineLow} />
                          <Stop offset="45%" stopColor={colors.timelineMid} />
                          <Stop offset="100%" stopColor={colors.timelinePeak} />
                        </LinearGradient>
                      </Defs>
                      <Rect
                        x="0"
                        y="0"
                        width="100%"
                        height={barHeight}
                        rx={1}
                        fill={`url(#timeline-${bar.id})`}
                      />
                    </Svg>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ marginTop: spacing.xs, height: lineHeight.caption, position: 'relative' }}>
            {bars.map((bar, index) => {
              if (!bar.timeLabel) {
                return null;
              }
              const isLast = index === bars.length - 1;
              const isFirst = index === 0;
              return (
                <Text
                  key={`label-${bar.id}`}
                  numberOfLines={1}
                  style={{
                    position: 'absolute',
                    left: isLast ? undefined : isFirst ? 0 : `${(index / Math.max(bars.length - 1, 1)) * 100}%`,
                    right: isLast ? 0 : undefined,
                    transform: isFirst || isLast ? undefined : [{ translateX: -(spacing.xl / 2 + spacing.xs) }],
                    width: spacing.xl + spacing.md,
                    color: colors.fgCaption,
                    fontFamily: fontFamily.regular,
                    fontSize: fontSize.caption,
                    lineHeight: lineHeight.caption,
                    textAlign: isLast ? 'right' : isFirst ? 'left' : 'center',
                    opacity: 0.55,
                  }}
                >
                  {bar.timeLabel}
                </Text>
              );
            })}
          </View>
        </View>
      </View>
      <Text
        style={{
          marginTop: spacing.sm,
          color: colors.primary,
          fontFamily: fontFamily.regular,
          fontSize: fontSize.caption,
          lineHeight: lineHeight.caption,
          textAlign: 'center',
          opacity: 0.9,
        }}
      >
        Tap on any bar to hear audio
      </Text>
    </Card>
  );
}
