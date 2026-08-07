import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fontFamily, fontSize, lineHeight, radius, spacing } from '@/theme';

import { TOUCH_TARGET } from './touchTarget';

export type SegmentOption<T extends string> = {
  readonly value: T;
  readonly label: string;
  readonly accessibilityLabel?: string;
};

type SegmentedControlProps<T extends string> = {
  readonly options: readonly SegmentOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

/**
 * Capsule 7 Days / 30 Days control from history-screen.jpg.
 * Selected segment uses the indigo `primary` fill; track uses `pill`.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
  testID,
}: SegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      style={[
        {
          flexDirection: 'row',
          backgroundColor: colors.pill,
          borderRadius: radius.full,
          padding: spacing.xs,
          minHeight: TOUCH_TARGET,
        },
        style,
      ]}
      testID={testID}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            onPress={() => {
              onChange(option.value);
            }}
            style={{
              flex: 1,
              minHeight: TOUCH_TARGET,
              borderRadius: radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.sm,
              backgroundColor: selected ? colors.primary : colors.pill,
            }}
          >
            <Text
              style={{
                color: selected ? colors.fg : colors.fgCaption,
                fontFamily: selected ? fontFamily.semibold : fontFamily.medium,
                fontSize: fontSize.body,
                lineHeight: lineHeight.body,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
