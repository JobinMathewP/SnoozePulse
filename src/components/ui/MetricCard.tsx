import { type ReactNode } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

import { Card, type CardWidth } from './Card';

type MetricCardProps = {
  /** Small label above the value — "Sleep Duration", "Total Snoring Time". */
  readonly label: string;
  /** Primary readout — "7h 48m", "256", "42 mins". */
  readonly value: string;
  /** Optional unit rendered after the value at a smaller size — "dB". */
  readonly unit?: string;
  /** Caption under the value — "11:32 PM - 7:20 AM", "8.5% of sleep". */
  readonly caption?: string;
  readonly trailingIcon?: ReactNode;
  /**
   * Value colour. Defaults to `fg`. Pass `alertText` for the red snore count on Summary,
   * or `warning` for the Moderate score.
   */
  readonly valueColor?: string;
  readonly width?: CardWidth;
  readonly tone?: 'default' | 'elevated';
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
  readonly accessibilityLabel?: string;
};

/**
 * Metric surface used by the Summary strip (thirds) and the half-width pair.
 *
 * Large value + optional unit, caption underneath, optional trailing icon. Width is
 * delegated to `Card` so a `CardRow` of halves or thirds lays out correctly.
 */
export function MetricCard({
  label,
  value,
  unit,
  caption,
  trailingIcon,
  valueColor = colors.fg,
  width = 'full',
  tone = 'elevated',
  style,
  testID,
  accessibilityLabel,
}: MetricCardProps) {
  const a11y =
    accessibilityLabel ?? [label, unit ? `${value} ${unit}` : value, caption].filter(Boolean).join('. ');

  return (
    <Card width={width} tone={tone} style={style} testID={testID}>
      <View accessible accessibilityLabel={a11y} style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm }}>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              color: colors.fgCaption,
              fontFamily: fontFamily.medium,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
            }}
          >
            {label}
          </Text>
          {trailingIcon}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, flexWrap: 'wrap' }}>
          <Text
            style={{
              color: valueColor,
              fontFamily: fontFamily.bold,
              fontSize: width === 'third' ? fontSize.heading : fontSize.display,
              lineHeight: width === 'third' ? lineHeight.heading : lineHeight.display,
            }}
          >
            {value}
          </Text>
          {unit ? (
            <Text
              style={{
                color: valueColor,
                fontFamily: fontFamily.medium,
                fontSize: fontSize.body,
                lineHeight: lineHeight.body,
              }}
            >
              {unit}
            </Text>
          ) : null}
        </View>
        {caption ? (
          <Text
            numberOfLines={2}
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
            }}
          >
            {caption}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
