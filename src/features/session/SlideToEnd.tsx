import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { TOUCH_TARGET } from '@/components/ui/touchTarget';
import { colors, fontFamily, fontSize, lineHeight, radius, spacing } from '@/theme';

import { activeSessionCopy } from './copy';

type SlideToEndProps = {
  readonly onEnd: () => void;
  readonly testID?: string;
};

const THUMB = spacing.xl + spacing.md;
const TRACK_HEIGHT = spacing.xl + spacing.lg;
/** Fraction of travel required before the session ends. */
const COMPLETE_AT = 0.85;

/**
 * “Slide to end session” control from active-session.jpg.
 *
 * Pan gesture via react-native-gesture-handler. Screen readers get an activate action that
 * ends the session without sliding (accessible alternative).
 */
export function SlideToEnd({ onEnd, testID }: SlideToEndProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const maxTravel = Math.max(0, trackWidth - THUMB - spacing.xs * 2);

  const finish = () => {
    onEnd();
  };

  const pan = Gesture.Pan()
    .onBegin(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      const next = Math.min(maxTravel, Math.max(0, startX.value + event.translationX));
      translateX.value = next;
    })
    .onEnd(() => {
      if (maxTravel > 0 && translateX.value / maxTravel >= COMPLETE_AT) {
        translateX.value = withSpring(maxTravel);
        runOnJS(finish)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const onTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={activeSessionCopy.slideAccessibilityLabel}
      accessibilityHint={activeSessionCopy.slideAccessibilityHint}
      accessibilityActions={[{ name: 'activate', label: activeSessionCopy.slideAccessibilityLabel }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'activate') {
          finish();
        }
      }}
      testID={testID}
      onLayout={onTrackLayout}
      style={{
        height: TRACK_HEIGHT,
        borderRadius: radius.full,
        backgroundColor: colors.pill,
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Text
        pointerEvents="none"
        style={{
          position: 'absolute',
          alignSelf: 'center',
          color: colors.fg,
          fontFamily: fontFamily.medium,
          fontSize: fontSize.body,
          lineHeight: lineHeight.body,
        }}
      >
        {activeSessionCopy.slideLabel}
      </Text>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: spacing.xs,
              width: THUMB,
              height: THUMB,
              borderRadius: THUMB / 2,
              backgroundColor: colors.fg,
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: TOUCH_TARGET,
              minHeight: TOUCH_TARGET,
            },
            thumbStyle,
          ]}
        >
          <Ionicons
            accessibilityElementsHidden
            importantForAccessibility="no"
            name="play-forward"
            size={fontSize.bodyLg}
            color={colors.bgOled}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
