import { Ionicons } from '@expo/vector-icons';
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
 * Standalone cards look tappable; prefer {@link StatusStack} for read-only facts.
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
  /** When set, the row is a press target (e.g. Open Settings for mic deny). */
  readonly onPress?: () => void;
  /**
   * Render the row only, for {@link StatusStack}. Info rows stay text; press rows
   * keep a chevron so they are the only control in the stack.
   */
  readonly embed?: boolean;
};

type StatusStackProps = {
  readonly children: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

function StatusRowBody({
  title,
  subtitle,
  icon,
  trailing,
  showChevron,
}: {
  readonly title: string;
  readonly subtitle: string;
  readonly icon: ReactNode;
  readonly trailing?: ReactNode;
  readonly showChevron: boolean;
}) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
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
        <View style={{ marginLeft: spacing.sm, alignItems: 'center', justifyContent: 'center' }}>
          {trailing}
        </View>
      ) : null}
      {showChevron ? (
        <Ionicons
          accessibilityElementsHidden
          importantForAccessibility="no"
          name="chevron-forward"
          size={fontSize.body}
          color={colors.fgCaption}
        />
      ) : null}
    </View>
  );
}

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
  embed = false,
}: StatusCardProps) {
  const label = accessibilityLabel ?? `${title}. ${subtitle}`;
  const chrome = {
    backgroundColor: colors.homeCard,
    borderColor: colors.homeCardBorder,
  } as const;
  const row = (
    <StatusRowBody
      title={title}
      subtitle={subtitle}
      icon={icon}
      trailing={trailing}
      showChevron={onPress !== undefined}
    />
  );

  if (onPress) {
    const pressable = (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: TOUCH_TARGET }}
      >
        {row}
      </Pressable>
    );
    if (embed) {
      return (
        <View testID={testID} style={style}>
          {pressable}
        </View>
      );
    }
    return (
      <Card width="full" style={[{ minHeight: TOUCH_TARGET }, chrome, style]} testID={testID}>
        {pressable}
      </Card>
    );
  }

  if (embed) {
    return (
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={label}
        testID={testID}
        style={style}
      >
        {row}
      </View>
    );
  }

  return (
    <Card
      width="full"
      style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }, chrome, style]}
      testID={testID}
    >
      <View accessible accessibilityRole="text" accessibilityLabel={label} style={{ flex: 1 }}>
        {row}
      </View>
    </Card>
  );
}

/** One Home status panel so battery / mic / environment read as facts, not a stack of buttons. */
export function StatusStack({ children, style, testID }: StatusStackProps) {
  return (
    <Card
      width="full"
      tone="elevated"
      corner="md"
      border="subtle"
      style={[
        {
          backgroundColor: colors.homeCard,
          borderColor: colors.homeCardBorder,
          gap: spacing.sm,
        },
        style,
      ]}
      testID={testID}
    >
      {children}
    </Card>
  );
}

export function StatusDivider() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ height: 1, backgroundColor: colors.homeDivider }}
    />
  );
}
