import { type ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { colors, fontFamily, fontSize, lineHeight, radius, shadows, spacing } from '@/theme';

/** ui-guidelines.md minimum touch target. */
const TOUCH_TARGET = 44;

/** Press animation duration — within the 150–250 ms band from ui-guidelines.md. */
const PRESS_MS = 180;

/** Hero disc diameter, scaled from the home-screen.jpg circle (~250 dp at the mockup density). */
const HERO_SIZE = spacing.xl * 7 + spacing.md;

const pressEasing = Easing.out(Easing.cubic);

type ButtonVariant = 'primary' | 'hero';

type ButtonProps = {
  readonly label: string;
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  readonly variant?: ButtonVariant;
  /** Extra content above the label inside the hero disc (moon icon, etc.). */
  readonly icon?: ReactNode;
  readonly disabled?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

/**
 * Pressable control with a standard primary pill and the Home hero disc.
 *
 * The hero variant is built only from sampled tokens: radial fill `heroCore` → `heroEdge`,
 * ring `heroRing`, and glow `shadows.heroGlow` (ADR-06). Press scale is Reanimated.
 */
export function Button({
  label,
  accessibilityLabel,
  onPress,
  variant = 'primary',
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

  if (variant === 'hero') {
    const ringWidth = spacing.xs;
    const inner = HERO_SIZE - ringWidth * 2;

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
            width: HERO_SIZE,
            height: HERO_SIZE,
            minWidth: TOUCH_TARGET,
            minHeight: TOUCH_TARGET,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: HERO_SIZE / 2,
            ...shadows.heroGlow,
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <Svg width={HERO_SIZE} height={HERO_SIZE} style={{ position: 'absolute' }}>
            <Defs>
              <RadialGradient id="heroFill" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={colors.heroCore} />
                <Stop offset="70%" stopColor={colors.heroCore} />
                <Stop offset="100%" stopColor={colors.heroEdge} />
              </RadialGradient>
            </Defs>
            <Circle
              cx={HERO_SIZE / 2}
              cy={HERO_SIZE / 2}
              r={HERO_SIZE / 2 - ringWidth / 2}
              fill="url(#heroFill)"
              stroke={colors.heroRing}
              strokeWidth={ringWidth}
            />
          </Svg>
          <View
            style={{
              width: inner,
              height: inner,
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              paddingHorizontal: spacing.lg,
            }}
          >
            {icon}
            <Text
              style={{
                color: colors.fg,
                fontFamily: fontFamily.bold,
                fontSize: fontSize.body,
                lineHeight: lineHeight.body,
                textAlign: 'center',
                textTransform: 'uppercase',
              }}
            >
              {label}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

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
