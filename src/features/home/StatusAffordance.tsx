import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

type StatusGlyphProps = {
  readonly name: keyof typeof Ionicons.glyphMap;
  readonly color: string;
};

export function StatusGlyph({ name, color }: StatusGlyphProps) {
  return (
    <Ionicons
      accessibilityElementsHidden
      importantForAccessibility="no"
      name={name}
      size={fontSize.heading}
      color={color}
    />
  );
}

type StatusCheckProps = {
  readonly color?: string;
};

/** Trailing check used on the mic and calibration cards in home-screen.jpg. */
export function StatusCheck({ color = colors.successText }: StatusCheckProps) {
  return (
    <View
      style={{
        width: spacing.xl,
        height: spacing.xl,
        borderRadius: spacing.xl / 2,
        borderWidth: 1,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons
        accessibilityElementsHidden
        importantForAccessibility="no"
        name="checkmark"
        size={fontSize.bodyLg}
        color={color}
      />
    </View>
  );
}

type BatteryPercentProps = {
  readonly percent: number | null;
  readonly color: string;
};

export function BatteryPercent({ percent, color }: BatteryPercentProps) {
  return (
    <Text
      style={{
        color,
        fontFamily: fontFamily.bold,
        fontSize: fontSize.bodyLg,
        lineHeight: lineHeight.bodyLg,
      }}
    >
      {percent === null ? '—' : `${percent}%`}
    </Text>
  );
}
