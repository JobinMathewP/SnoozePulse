import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors, fontFamily, fontSize, lineHeight, radius, spacing } from '@/theme';

import { Card } from './Card';
import { SectionHeader } from './SectionHeader';

/** ui-guidelines.md minimum touch target. */
const TOUCH_TARGET = 44;

/** Default Y-axis ceiling matching summary-screen.jpg (0–80 dB). */
const DEFAULT_MAX_DB = 80;

export type TimelineBarModel = {
  readonly id: string;
  /** Short tick label under the bar — "11p", "3a". */
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

const CHART_HEIGHT = spacing.xl * 4 + spacing.md;
const AXIS_WIDTH = spacing.xl + spacing.sm;
const BAR_GAP = spacing.xs;
const PLOT_HEIGHT = CHART_HEIGHT - spacing.lg;

/**
 * Summary "Snoring Timeline": gradient bars, dB axis, time axis, peak callout.
 *
 * Bar fills use the sampled `timelineLow` → `timelineMid` → `timelinePeak` stops (ADR-06).
 * Geometry is derived from props once per render — nothing is allocated from a frame loop.
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

  return (
    <Card width="full" tone="elevated" style={style} testID={testID}>
      <SectionHeader
        title="Snoring Timeline"
        onInfoPress={onInfoPress}
        infoAccessibilityLabel="About snoring timeline"
      />
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: AXIS_WIDTH, height: PLOT_HEIGHT, justifyContent: 'space-between', paddingRight: spacing.xs }}>
          {yTicks.map((tick) => (
            <Text
              key={tick}
              style={{
                color: colors.fgCaption,
                fontFamily: fontFamily.regular,
                fontSize: fontSize.caption,
                lineHeight: lineHeight.caption,
                textAlign: 'right',
              }}
            >
              {Math.round(tick)}
            </Text>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ height: PLOT_HEIGHT, flexDirection: 'row', alignItems: 'flex-end' }}>
            {bars.map((bar) => {
              const intensity = Math.min(1, Math.max(0, bar.peakDb / maxDb));
              const barHeight = Math.max(spacing.sm, intensity * PLOT_HEIGHT);
              const isPeak = peakCallout?.barId === bar.id;

              return (
                <Pressable
                  key={bar.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Snore level ${Math.round(bar.peakDb)} decibels at ${bar.timeLabel}`}
                  accessibilityHint="Double tap to play audio for this time range"
                  onPress={() => {
                    onBarPress(bar);
                  }}
                  style={{
                    flex: 1,
                    minWidth: TOUCH_TARGET / 2,
                    minHeight: TOUCH_TARGET,
                    height: PLOT_HEIGHT,
                    marginHorizontal: BAR_GAP / 2,
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                  }}
                >
                  {isPeak ? (
                    <View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        top: 0,
                        zIndex: 1,
                        backgroundColor: colors.alertText,
                        borderRadius: radius.sm,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.xs / 2,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.fg,
                          fontFamily: fontFamily.semibold,
                          fontSize: fontSize.caption,
                          lineHeight: lineHeight.caption,
                        }}
                      >
                        {peakCallout.label}
                      </Text>
                    </View>
                  ) : null}
                  <Svg width="100%" height={barHeight}>
                    <Defs>
                      <LinearGradient id={`timeline-${bar.id}`} x1="0" y1="1" x2="0" y2="0">
                        <Stop offset="0%" stopColor={colors.timelineLow} />
                        <Stop offset="55%" stopColor={colors.timelineMid} />
                        <Stop offset="100%" stopColor={colors.timelinePeak} />
                      </LinearGradient>
                    </Defs>
                    <Rect
                      x="0"
                      y="0"
                      width="100%"
                      height={barHeight}
                      rx={spacing.xs / 2}
                      fill={`url(#timeline-${bar.id})`}
                    />
                  </Svg>
                </Pressable>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', marginTop: spacing.xs }}>
            {bars.map((bar) => (
              <Text
                key={bar.id}
                numberOfLines={1}
                style={{
                  flex: 1,
                  marginHorizontal: BAR_GAP / 2,
                  color: colors.fgCaption,
                  fontFamily: fontFamily.regular,
                  fontSize: fontSize.caption,
                  lineHeight: lineHeight.caption,
                  textAlign: 'center',
                }}
              >
                {bar.timeLabel}
              </Text>
            ))}
          </View>
          <Text
            style={{
              marginTop: spacing.xs,
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
              textAlign: 'left',
            }}
          >
            (dB)
          </Text>
        </View>
      </View>
      <Text
        style={{
          marginTop: spacing.sm,
          color: colors.primary,
          fontFamily: fontFamily.medium,
          fontSize: fontSize.caption,
          lineHeight: lineHeight.caption,
          textAlign: 'center',
        }}
      >
        Tap on any bar to hear audio
      </Text>
    </Card>
  );
}
