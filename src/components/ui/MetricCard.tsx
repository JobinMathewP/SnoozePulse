import { type ReactNode } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fontFamily, fontSize, lineHeight, radius, spacing } from '@/theme';

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
  /** Extra content under the value row — e.g. snore-score dots on Summary. */
  readonly belowValue?: ReactNode;
  readonly trailingIcon?: ReactNode;
  /**
   * Value colour. Defaults to `fg`. Pass `alertText` for the red snore count on Summary,
   * or `warning` for the Moderate score.
   */
  readonly valueColor?: string;
  readonly width?: CardWidth;
  readonly tone?: 'default' | 'elevated';
  readonly corner?: keyof typeof radius;
  readonly border?: 'default' | 'subtle';
  readonly inset?: 'comfortable' | 'compact';
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
  readonly accessibilityLabel?: string;
};

/**
 * Compact metric surface for Summary half-cards (summary-screen.jpg).
 * Only the value is bold; labels stay quiet. No min-height — height follows content.
 */
export function MetricCard({
  label,
  value,
  unit,
  caption,
  belowValue,
  trailingIcon,
  valueColor = colors.fg,
  width = 'full',
  tone = 'elevated',
  corner = 'md',
  border = 'default',
  inset = 'compact',
  style,
  testID,
  accessibilityLabel,
}: MetricCardProps) {
  const a11y =
    accessibilityLabel ?? [label, unit ? `${value} ${unit}` : value, caption].filter(Boolean).join('. ');

  return (
    <Card width={width} tone={tone} corner={corner} border={border} inset={inset} style={style} testID={testID}>
      <View accessible accessibilityLabel={a11y} style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.xs }}>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
              opacity: 0.65,
            }}
          >
            {label}
          </Text>
          {trailingIcon}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs / 2, flexWrap: 'wrap' }}>
          <Text
            numberOfLines={1}
            style={{
              color: valueColor,
              fontFamily: fontFamily.bold,
              fontSize: fontSize.heading,
              lineHeight: lineHeight.heading,
              flexShrink: 1,
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
        {belowValue}
        {caption ? (
          <Text
            numberOfLines={2}
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
              opacity: 0.6,
            }}
          >
            {caption}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
