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

import { TOUCH_TARGET } from './touchTarget';

/** Press animation duration — within the 150–250 ms band from ui-guidelines.md. */
const PRESS_MS = 180;

/**
 * Solid disc diameter. home-screen.jpg ring spans ~225–250 dp at the mockup density;
 * xl*7+lg lands at 248 — within the Task 2.5 correction band.
 */
const HERO_DISC = spacing.xl * 7 + spacing.lg;

/** Gap between the solid ring and the faint dotted orbit in home-screen.jpg. */
const HERO_ORBIT_PAD = spacing.md;

const HERO_SIZE = HERO_DISC + HERO_ORBIT_PAD * 2;

const pressEasing = Easing.out(Easing.cubic);

type ButtonVariant = 'primary' | 'hero';

type ButtonProps = {
  readonly label: string;
  /**
   * Second line inside the hero disc ("SLEEP SESSION" under "START" on Home).
   * Ignored for the primary variant.
   */
  readonly sublabel?: string;
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
 * ring `heroRing`, dotted orbit `heroGlow`, and glow `shadows.heroGlow` (ADR-06).
 * Press scale is Reanimated.
 */
export function Button({
  label,
  sublabel,
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
    const centre = HERO_SIZE / 2;
    const discRadius = HERO_DISC / 2;
    const inner = HERO_DISC - ringWidth * 2;

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
              cx={centre}
              cy={centre}
              r={centre - spacing.xs / 2}
              fill="none"
              stroke={colors.heroGlow}
              strokeWidth={spacing.xs / 2}
              strokeDasharray={`${spacing.xs} ${spacing.sm}`}
              opacity={0.85}
            />
            <Circle
              cx={centre}
              cy={centre}
              r={discRadius - ringWidth / 2}
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
            <View style={{ alignItems: 'center', gap: spacing.xs / 2 }}>
              <Text
                style={{
                  color: colors.fg,
                  fontFamily: fontFamily.bold,
                  fontSize: fontSize.title,
                  lineHeight: lineHeight.title,
                  textAlign: 'center',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </Text>
              {sublabel ? (
                <Text
                  style={{
                    color: colors.fg,
                    fontFamily: fontFamily.semibold,
                    fontSize: fontSize.caption,
                    lineHeight: lineHeight.caption,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                  }}
                >
                  {sublabel}
                </Text>
              ) : null}
            </View>
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
