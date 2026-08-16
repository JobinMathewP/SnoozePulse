import { type ReactNode } from 'react';
import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors, fontFamily, fontSize, lineHeight, radius, spacing } from '@/theme';

import { TOUCH_TARGET } from './touchTarget';

/** Press animation duration — within the 150–250 ms band from ui-guidelines.md. */
const PRESS_MS = 180;

const pressEasing = Easing.out(Easing.cubic);

type ButtonProps = {
  readonly label: string;
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  readonly variant?: 'primary';
  readonly icon?: ReactNode;
  readonly disabled?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

/**
 * Primary pill control. Home's circular start art lives in `StartSessionHero`, not here.
 */
export function Button({
  label,
  accessibilityLabel,
  onPress,
  icon,
  disabled = false,
  style,
  testID,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pressIn = () => {
    // Reanimated shared values are intentionally mutated; the React Compiler lint does not
    // model `.value` writes.
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value
    scale.value = withTiming(0.96, { duration: PRESS_MS, easing: pressEasing });
  };

  const pressOut = () => {
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value
    scale.value = withTiming(1, { duration: PRESS_MS, easing: pressEasing });
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        testID={testID}
        style={{
          minWidth: TOUCH_TARGET,
          minHeight: TOUCH_TARGET,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderRadius: radius.md,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
          flexDirection: 'row',
          gap: spacing.sm,
        }}
      >
        {icon}
        <Text
          style={{
            color: colors.fg,
            fontFamily: fontFamily.semibold,
            fontSize: fontSize.body,
            lineHeight: lineHeight.body,
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
