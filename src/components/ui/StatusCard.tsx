import { type ReactNode } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

import { Card } from './Card';

/**
 * The three Home readiness states visible in home-screen.jpg:
 *
 * - `alert`         — Battery Low (red title)
 * - `success`       — Microphone Access (green title)
 * - `informational` — Ambient Noise Calibration (indigo title)
 */
export type StatusCardTone = 'alert' | 'success' | 'informational';

type StatusCardProps = {
  readonly tone: StatusCardTone;
  readonly title: string;
  readonly subtitle: string;
  /** Leading glyph — battery, mic, waveform, etc. */
  readonly icon: ReactNode;
  /** Trailing value ("18%") or checkmark. */
  readonly trailing?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
  readonly accessibilityLabel?: string;
};

const titleColor = (tone: StatusCardTone): string => {
  switch (tone) {
    case 'alert':
      return colors.alertText;
    case 'success':
      return colors.successText;
    case 'informational':
      return colors.primary;
  }
};

/**
 * Home readiness row: leading icon, title + subtitle, optional trailing element.
 *
 * Composes `Card` at full width so spacing and border match the other surfaces.
 */
export function StatusCard({
  tone,
  title,
  subtitle,
  icon,
  trailing,
  style,
  testID,
  accessibilityLabel,
}: StatusCardProps) {
  return (
    <Card
      width="full"
      style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }, style]}
      testID={testID}
    >
      <View
        accessible
        accessibilityLabel={accessibilityLabel ?? `${title}. ${subtitle}`}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
      >
        <View style={{ width: spacing.xl, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
        <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            style={{
              color: titleColor(tone),
              fontFamily: fontFamily.semibold,
              fontSize: fontSize.body,
              lineHeight: lineHeight.body,
            }}
          >
            {title}
          </Text>
          <Text
            numberOfLines={2}
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
            }}
          >
            {subtitle}
          </Text>
        </View>
        {trailing ? (
          <View style={{ marginLeft: spacing.sm, alignItems: 'center', justifyContent: 'center' }}>{trailing}</View>
        ) : null}
      </View>
    </Card>
  );
}
