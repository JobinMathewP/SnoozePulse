import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '@/theme';

type PhotoBackdropProps = {
  /** Metro `require()` of a bundled PNG. */
  readonly source: number;
};

/**
 * Full-bleed bedroom photo plus a bottom-to-top dark scrim so the CTA and caption stay
 * readable. Gradient is SVG — no extra package (ADR / plan: no expo-linear-gradient).
 */
export function PhotoBackdrop({ source }: PhotoBackdropProps) {
  return (
    <>
      <Image
        source={source}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
        accessibilityIgnoresInvertColors
      />
      <Svg
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="onboardPhotoScrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.bgApp} stopOpacity="0.2" />
            <Stop offset="0.4" stopColor={colors.bgApp} stopOpacity="0.45" />
            <Stop offset="1" stopColor={colors.bgApp} stopOpacity="0.94" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#onboardPhotoScrim)" />
      </Svg>
    </>
  );
}
