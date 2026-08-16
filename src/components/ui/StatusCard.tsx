import { type ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

import { Card } from './Card';
import { TOUCH_TARGET } from './touchTarget';

/**
 * Home readiness rows from home-screen-moke.png:
 *
 * - `alert`         — Battery Low (red icon / trailing)
 * - `success`       — Microphone / Battery Ready (green icon / trailing)
 * - `informational` — Environment (violet waveform)
 *
 * Titles stay white; tone is carried by the icon and trailing affordance.
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

/**
 * Home readiness row: leading icon, title + subtitle, optional trailing element.
 */
export function StatusCard({
  tone: _tone,
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
  const chrome = {
    backgroundColor: colors.homeCard,
    borderColor: colors.homeCardBorder,
  };
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
            color: colors.fg,
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
      <Card width="full" style={[{ minHeight: TOUCH_TARGET }, chrome, style]} testID={testID}>
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
      style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }, chrome, style]}
      testID={testID}
    >
      {body}
    </Card>
  );
}
