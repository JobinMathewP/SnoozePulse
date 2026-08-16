import { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  Platform,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const RUBBER_DIM = 180;

function rubber(x: number, dim: number): number {
  return x / (1 + Math.abs(x) / dim);
}

export type RubberBandScrollViewHandle = {
  scrollTo: (opts: { y: number; animated?: boolean }) => void;
};

type RubberBandScrollViewProps = Omit<ScrollViewProps, 'onScroll'> & {
  readonly children: React.ReactNode;
  readonly onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  readonly contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * Fitness-style rubber-band at both edges. iOS keeps native bounce. Android has no rubber-band
 * overscroll, so we translate the content with a diminishing pull while the finger is past the
 * edge, then spring back on release.
 */
export const RubberBandScrollView = forwardRef<
  RubberBandScrollViewHandle,
  RubberBandScrollViewProps
>(function RubberBandScrollView(
  { children, onScroll, contentContainerStyle, onLayout, ...rest },
  ref,
) {
  const scrollRef = useRef<Animated.ScrollView>(null);
  const overscroll = useSharedValue(0);
  const scrollY = useRef(0);
  const maxScroll = useRef(0);
  const lastPageY = useRef(0);
  const pulled = useRef(0);

  useImperativeHandle(ref, () => ({
    scrollTo: (opts) => {
      scrollRef.current?.scrollTo(opts);
    },
  }));

  const bandStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: overscroll.value }],
  }));

  const releaseBand = () => {
    pulled.current = 0;
    overscroll.value = withSpring(0, { damping: 20, stiffness: 220 });
  };

  if (Platform.OS === 'ios') {
    return (
      <Animated.ScrollView
        ref={scrollRef}
        bounces
        alwaysBounceVertical
        onLayout={onLayout}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={contentContainerStyle}
        {...rest}
      >
        {children}
      </Animated.ScrollView>
    );
  }

  return (
      <Animated.ScrollView
      ref={scrollRef}
      {...rest}
      bounces={false}
      overScrollMode="never"
      onLayout={onLayout}
      scrollEventThrottle={16}
      contentContainerStyle={contentContainerStyle}
      onScroll={(event) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        scrollY.current = contentOffset.y;
        maxScroll.current = Math.max(0, contentSize.height - layoutMeasurement.height);
        onScroll?.(event);
      }}
      onTouchStart={(event) => {
        lastPageY.current = event.nativeEvent.pageY;
        pulled.current = 0;
      }}
      onTouchMove={(event) => {
        const pageY = event.nativeEvent.pageY;
        const dy = pageY - lastPageY.current;
        lastPageY.current = pageY;
        const atTop = scrollY.current <= 0;
        const atBottom = scrollY.current >= maxScroll.current - 0.5;
        if (atTop && dy > 0) {
          pulled.current += dy;
          overscroll.value = rubber(pulled.current, RUBBER_DIM);
          return;
        }
        if (atBottom && dy < 0) {
          pulled.current += dy;
          overscroll.value = rubber(pulled.current, RUBBER_DIM);
          return;
        }
        if (pulled.current !== 0) {
          releaseBand();
        }
      }}
      onTouchEnd={releaseBand}
      onTouchCancel={releaseBand}
      onScrollEndDrag={releaseBand}
    >
      <Animated.View style={bandStyle}>{children}</Animated.View>
    </Animated.ScrollView>
  );
});
