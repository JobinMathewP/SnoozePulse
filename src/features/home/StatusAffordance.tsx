import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

import { HOME_WAVEFORM_MARK } from './BrandMark';

type StatusIconProps = {
  readonly color: string;
  readonly size?: number;
};

/** Battery body + tip, tinted by readiness tone (home-screen.jpg). */
export function BatteryStatusIcon({ color, size = fontSize.heading }: StatusIconProps) {
  return (
    <Svg
      accessibilityElementsHidden
      importantForAccessibility="no"
      width={size}
      height={size}
      viewBox="0 0 24 24"
    >
      <Rect x="2" y="7" width="16" height="10" rx="2" stroke={color} strokeWidth="2" fill="none" />
      <Path d="M20 10v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="5" y="10" width="8" height="4" rx="0.5" fill={color} />
    </Svg>
  );
}

/** Microphone glyph for the permission card. */
export function MicStatusIcon({ color, size = fontSize.heading }: StatusIconProps) {
  return (
    <Svg
      accessibilityElementsHidden
      importantForAccessibility="no"
      width={size}
      height={size}
      viewBox="0 0 24 24"
    >
      <Rect x="9" y="2" width="6" height="11" rx="3" fill={color} />
      <Path
        d="M5 11a7 7 0 0 0 14 0"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M12 18v3M9 21h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** Vertical pulse / waveform for the Environment card — rolling noise floor (ADR-25). */
export function PulseStatusIcon({ color, size = fontSize.heading }: StatusIconProps) {
  return (
    <Svg
      accessibilityElementsHidden
      importantForAccessibility="no"
      width={size}
      height={size}
      viewBox="0 0 24 24"
    >
      <Path d="M4 12h2l2-5 3 10 3-8 2 3h4" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

type StatusCheckProps = {
  readonly color?: string;
};

/** Filled success disc with white check — mic / calibration trailing affordance. */
export function StatusCheck({ color = colors.homeReady }: StatusCheckProps) {
  const size = spacing.xl;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons
        accessibilityElementsHidden
        importantForAccessibility="no"
        name="checkmark"
        size={fontSize.bodyLg}
        color={colors.fg}
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

/** Mini waveform trailing the Environment row (home-screen-moke.png). */
export function WaveformTrail() {
  const width = spacing.xl + spacing.md;
  const height = spacing.md + spacing.xs;
  return (
    <Image
      source={HOME_WAVEFORM_MARK}
      contentFit="contain"
      accessibilityElementsHidden
      style={{ width, height }}
    />
  );
}
