import { type ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

import { Card } from './Card';
import { TOUCH_TARGET } from './touchTarget';

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
  /** When set, the whole card is a press target (e.g. Open Settings for mic deny). */
  readonly onPress?: () => void;
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
  onPress,
}: StatusCardProps) {
  const label = accessibilityLabel ?? `${title}. ${subtitle}`;
  const body = (
    <View
      accessible={onPress === undefined}
      accessibilityLabel={onPress === undefined ? label : undefined}
      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
    >
      <View style={{ width: spacing.xl, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
        <Text
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
  );

  if (onPress) {
    return (
      <Card width="full" style={[{ minHeight: TOUCH_TARGET }, style]} testID={testID}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: TOUCH_TARGET }}
        >
          {body}
        </Pressable>
      </Card>
    );
  }

  return (
    <Card
      width="full"
      style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }, style]}
      testID={testID}
    >
      {body}
    </Card>
  );
}
