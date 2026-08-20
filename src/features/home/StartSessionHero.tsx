import { Image } from 'expo-image';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { TOUCH_TARGET } from '@/components/ui/touchTarget';
import { colors, fontFamily, fontSize, lineHeight, shadows, spacing } from '@/theme';

import { homeCopy } from './copy';

const START_ART = require('../../../assets/images/home/start-session.png') as number;

/** Circular start control — near the ~224–256 dp band of the premium mock. */
const HERO_SIZE = spacing.xl * 8;
/**
 * PNG disc is ~0.74 of the square (black padding around the rim). Scale art so the
 * purple circle fills the button; glow then sits on that same rim.
 */
const ART_SCALE = 1 / 0.74;
/** Room for the breathing bloom just outside the filled disc. */
const HALO_PAD = spacing.md;

const PRESS_MS = 180;
/** One half of the breathe cycle; reverse-repeat mirrors the same gradual curve. */
const GLOW_MS = 1600;
const pressEasing = Easing.out(Easing.cubic);
/** Symmetric ease — same gradual rise and fall (not a sudden punch-in). */
const glowEasing = Easing.inOut(Easing.sin);

type StartSessionHeroProps = {
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly busy?: boolean;
  readonly testID?: string;
};

/**
 * Tappable start-session art. Art is scaled so the PNG's purple disc fills the control.
 * Glow is a bright Reanimated bloom + ring on that rim (not in the black padding).
 */
export function StartSessionHero({
  accessibilityLabel,
  onPress,
  disabled = false,
  busy = false,
  testID,
}: StartSessionHeroProps) {
  const pressScale = useSharedValue(1);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (disabled || busy) {
      cancelAnimation(glow);
      glow.value = withTiming(0, { duration: 220 });
      return;
    }

    // Reverse-repeat so glow-in and glow-out share the same gradual curve.
    glow.value = withRepeat(
      withTiming(1, { duration: GLOW_MS, easing: glowEasing }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(glow);
    };
  }, [busy, disabled, glow]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const bloomStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + glow.value * 0.06 }],
    opacity: 0.35 + glow.value * 0.4,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + glow.value * 0.045 }],
    opacity: 0.55 + glow.value * 0.45,
  }));

  const pressIn = () => {
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value
    pressScale.value = withTiming(0.96, { duration: PRESS_MS, easing: pressEasing });
  };

  const pressOut = () => {
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value
    pressScale.value = withTiming(1, { duration: PRESS_MS, easing: pressEasing });
  };

  const outer = HERO_SIZE + HALO_PAD * 2;
  const artSize = Math.round(HERO_SIZE * ART_SCALE);

  return (
    <Animated.View
      style={[
        { width: outer, height: outer, alignItems: 'center', justifyContent: 'center' },
        pressStyle,
      ]}
    >
      {/* Soft fill — same diameter as the button so bloom hugs the purple rim. */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: HERO_SIZE,
            height: HERO_SIZE,
            borderRadius: HERO_SIZE / 2,
            backgroundColor: colors.heroGlow,
          },
          bloomStyle,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: HERO_SIZE,
            height: HERO_SIZE,
            borderRadius: HERO_SIZE / 2,
            borderWidth: 3,
            borderColor: colors.heroGlow,
          },
          ringStyle,
        ]}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled, busy }}
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
          borderRadius: HERO_SIZE / 2,
          ...shadows.heroGlow,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <View
          style={{
            width: HERO_SIZE,
            height: HERO_SIZE,
            borderRadius: HERO_SIZE / 2,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.bgOled,
          }}
        >
          <Image
            source={START_ART}
            contentFit="cover"
            style={{ width: artSize, height: artSize }}
            accessibilityElementsHidden
          />
          {!busy ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: spacing.xl,
                right: spacing.xl,
                bottom: spacing.lg + spacing.xs,
                alignItems: 'center',
                gap: spacing.xs / 4,
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  color: colors.fg,
                  fontFamily: fontFamily.bold,
                  fontSize: fontSize.body,
                  lineHeight: lineHeight.body,
                  textAlign: 'center',
                  letterSpacing: 0.8,
                }}
              >
                {homeCopy.heroLabel}
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  color: colors.fg,
                  fontFamily: fontFamily.semibold,
                  fontSize: fontSize.caption,
                  lineHeight: lineHeight.caption,
                  textAlign: 'center',
                  letterSpacing: 0.6,
                }}
              >
                {homeCopy.heroSublabel}
              </Text>
            </View>
          ) : (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.scrim,
              }}
            >
              <ActivityIndicator color={colors.fg} />
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
