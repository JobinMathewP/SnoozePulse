import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { TOUCH_TARGET } from '@/components/ui/touchTarget';
import { colors, shadows, spacing } from '@/theme';

const START_ART = require('../../../assets/images/home/start-session.png') as number;

/** Circular start control — near the ~224–256 dp band of the premium mock. */
const HERO_SIZE = spacing.xl * 8;

const PRESS_MS = 180;
const pressEasing = Easing.out(Easing.cubic);

type StartSessionHeroProps = {
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly busy?: boolean;
  readonly testID?: string;
};

/**
 * Tappable start-session art from assets/images/home/start-session.png.
 * The illustration is the control; there is no on-disc START label.
 */
export function StartSessionHero({
  accessibilityLabel,
  onPress,
  disabled = false,
  busy = false,
  testID,
}: StartSessionHeroProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pressIn = () => {
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value
    scale.value = withTiming(0.96, { duration: PRESS_MS, easing: pressEasing });
  };

  const pressOut = () => {
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value
    scale.value = withTiming(1, { duration: PRESS_MS, easing: pressEasing });
  };

  return (
    <Animated.View style={animatedStyle}>
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
          overflow: 'hidden',
          ...shadows.heroGlow,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Image
          source={START_ART}
          contentFit="contain"
          style={{ width: HERO_SIZE, height: HERO_SIZE }}
          accessibilityElementsHidden
        />
        {busy ? (
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
        ) : null}
      </Pressable>
    </Animated.View>
  );
}
