import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors } from '@/theme';

type PrivacyHeroProps = {
  readonly size?: number;
};

/**
 * Shield-in-orbit from the privacy mockup: lock on a violet shield, phone and waveform
 * nodes on a faint ring. Drawn, not a bitmap — there is no screen-3 asset.
 */
export function PrivacyHero({ size = 180 }: PrivacyHeroProps) {
  const c = size / 2;
  return (
    <Svg
      accessibilityElementsHidden
      importantForAccessibility="no"
      width={size}
      height={size}
      viewBox="0 0 180 180"
    >
      <Defs>
        <LinearGradient id="shieldFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.onboardAccentMuted} />
          <Stop offset="1" stopColor={colors.onboardAccent} />
        </LinearGradient>
      </Defs>
      <Circle
        cx={c}
        cy={c}
        r={78}
        fill="none"
        stroke={colors.onboardAccent}
        strokeWidth={1.5}
        opacity={0.35}
      />
      <Circle
        cx={c}
        cy={c}
        r={62}
        fill="none"
        stroke={colors.onboardAccentMuted}
        strokeWidth={1}
        opacity={0.25}
        strokeDasharray="4 6"
      />
      {/* Phone node — left */}
      <Circle cx={28} cy={90} r={14} fill={colors.cardElevated} stroke={colors.onboardAccentMuted} />
      <Path
        d="M24 84 h8 a1.5 1.5 0 0 1 1.5 1.5 v9 a1.5 1.5 0 0 1-1.5 1.5 h-8 a1.5 1.5 0 0 1-1.5-1.5 v-9 A1.5 1.5 0 0 1 24 84 z"
        fill={colors.onboardAccentMuted}
      />
      {/* Waveform node — right */}
      <Circle cx={152} cy={90} r={14} fill={colors.cardElevated} stroke={colors.onboardAccentMuted} />
      <Path
        d="M144 90 h4 l2-5 3 10 3-8 2 3 h4"
        fill="none"
        stroke={colors.onboardAccentMuted}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Shield */}
      <Path
        d="M90 38 l32 12 v28 c0 22-14 36-32 44-18-8-32-22-32-44 V50 z"
        fill="url(#shieldFill)"
      />
      {/* Lock */}
      <Path
        d="M90 78 a8 8 0 0 1 8 8 v4 h-16 v-4 a8 8 0 0 1 8-8 z"
        fill="none"
        stroke={colors.fg}
        strokeWidth={2.2}
      />
      <Path d="M80 90 h20 v16 h-20 z" fill={colors.fg} />
    </Svg>
  );
}
