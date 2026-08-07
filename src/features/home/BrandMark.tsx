import Svg, { Circle, Path } from 'react-native-svg';

import { colors, spacing } from '@/theme';

type BrandMarkProps = {
  readonly size?: number;
};

/**
 * Crescent + “Zz” mark from home-screen.jpg, drawn with the sampled primary accent.
 */
export function BrandMark({ size = spacing.xl }: BrandMarkProps) {
  return (
    <Svg
      accessibilityElementsHidden
      importantForAccessibility="no"
      width={size}
      height={size}
      viewBox="0 0 32 32"
    >
      <Path
        d="M18.5 3.8C12.2 5.2 7.5 10.8 7.5 17.5c0 7.2 5.8 13 13 13 2.6 0 5-.8 7-2.1C24.2 30.8 18.5 33 12.2 33 5.5 33 0 27.5 0 20.8 0 12.2 6.4 5 15 3.5c1.2-.2 2.4 0 3.5.3z"
        fill={colors.tabActive}
      />
      <Path
        d="M22.2 9.2h1.6l.4 1.4h1.5l-1.2.9.5 1.4-1.2-.9-1.2.9.5-1.4-1.2-.9h1.5z"
        fill={colors.tabActive}
      />
      <Path
        d="M26.4 5.6h1.2l.3 1h1.1l-.9.7.3 1.1-.9-.7-.9.7.3-1.1-.9-.7h1.1z"
        fill={colors.tabActive}
      />
    </Svg>
  );
}

type HeroMoonIconProps = {
  readonly size?: number;
};

/**
 * Crescent + stars + Zz inside the Home hero disc (home-screen.jpg).
 */
export function HeroMoonIcon({ size = spacing.xl + spacing.md }: HeroMoonIconProps) {
  return (
    <Svg
      accessibilityElementsHidden
      importantForAccessibility="no"
      width={size}
      height={size}
      viewBox="0 0 64 64"
    >
      <Path
        d="M36.5 8c-11 2.2-19 12-19 23.5C17.5 45.5 28 56 41.5 56c4.4 0 8.5-1.2 12-3.3C47 58.5 37.5 62 27 62 12.5 62 1 50.5 1 36 1 20.5 12.5 7.5 27.5 5.5c3-.4 6-.2 9 2.5z"
        fill={colors.fg}
      />
      {/* Stars */}
      <Path d="M44 14l1.2 3.6H49l-3 2.2 1.2 3.6-3-2.2-3 2.2 1.2-3.6-3-2.2h3.8z" fill={colors.fg} />
      <Path d="M52 8l.8 2.4H56l-2 1.5.8 2.4-2-1.5-2 1.5.8-2.4-2-1.5h2.4z" fill={colors.fg} />
      <Circle cx="48.5" cy="22" r="1.2" fill={colors.fg} />
      {/* Zz */}
      <Path
        d="M42 28h8l-7 8h7v3h-10l7-8h-5z"
        fill={colors.fg}
      />
      <Path
        d="M51 20h5.5l-4.5 5h4.5v2H49l4.5-5H49z"
        fill={colors.fg}
      />
    </Svg>
  );
}
