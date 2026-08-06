import Svg, { Path, Text as SvgText } from 'react-native-svg';

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
        d="M18.2 4.2c-5.8 1.2-10 6.3-10 12.3 0 6.8 5.5 12.3 12.3 12.3 2.4 0 4.6-.7 6.5-1.9C23.2 29.8 18 32 12.4 32 5.6 32 0 26.4 0 19.6 0 11.2 6.2 4.2 14.2 3c1.3-.2 2.7-.1 4 .2z"
        fill={colors.tabActive}
      />
      <SvgText
        x="22"
        y="12"
        fill={colors.tabActive}
        fontSize="7"
        fontWeight="700"
        textAnchor="middle"
      >
        Z
      </SvgText>
      <SvgText
        x="26"
        y="8"
        fill={colors.tabActive}
        fontSize="5"
        fontWeight="700"
        textAnchor="middle"
      >
        z
      </SvgText>
    </Svg>
  );
}

type HeroMoonIconProps = {
  readonly size?: number;
};

/** Moon glyph centred in the Home hero disc. */
export function HeroMoonIcon({ size = spacing.xl + spacing.sm }: HeroMoonIconProps) {
  return (
    <Svg
      accessibilityElementsHidden
      importantForAccessibility="no"
      width={size}
      height={size}
      viewBox="0 0 48 48"
    >
      <Path
        d="M28.5 6.5c-8.2 1.6-14.3 8.8-14.3 17.4 0 9.7 7.8 17.5 17.5 17.5 3.2 0 6.2-.9 8.8-2.4C35.2 43.2 27.4 46 19 46 8.5 46 0 37.5 0 27 0 15.4 8.8 5.8 20 4.2c2.7-.4 5.4-.2 8.5 2.3z"
        fill={colors.fg}
      />
      <SvgText x="34" y="16" fill={colors.fg} fontSize="9" fontWeight="700" textAnchor="middle">
        Z
      </SvgText>
      <SvgText x="40" y="10" fill={colors.fg} fontSize="6" fontWeight="700" textAnchor="middle">
        z
      </SvgText>
    </Svg>
  );
}
