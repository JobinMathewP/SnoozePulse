import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors } from '@/theme';

type ProfileHeroProps = {
  readonly size?: number;
};

/**
 * Profile disc + heart badge from the name mockup. Drawn, not a bitmap — there is no
 * screen-4 asset.
 */
export function ProfileHero({ size = 160 }: ProfileHeroProps) {
  return (
    <Svg
      accessibilityElementsHidden
      importantForAccessibility="no"
      width={size}
      height={size}
      viewBox="0 0 160 160"
    >
      <Defs>
        <LinearGradient id="profileFill" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.onboardAccentMuted} />
          <Stop offset="1" stopColor={colors.onboardAccent} />
        </LinearGradient>
      </Defs>
      <Circle cx={80} cy={80} r={70} fill="url(#profileFill)" opacity={0.35} />
      <Circle cx={80} cy={80} r={56} fill="url(#profileFill)" />
      <Circle cx={80} cy={62} r={18} fill={colors.fg} opacity={0.95} />
      <Path d="M48 118 c0-22 14-34 32-34 s32 12 32 34" fill={colors.fg} opacity={0.95} />
      {/* Heart badge */}
      <Circle cx={118} cy={118} r={18} fill={colors.onboardAccentMuted} />
      <Path
        d="M118 128 c-8-6-12-10-12-15 a7 7 0 0 1 12-5 a7 7 0 0 1 12 5 c0 5-4 9-12 15 z"
        fill={colors.fg}
      />
    </Svg>
  );
}
