import { Image } from 'expo-image';

import { spacing } from '@/theme';

const WAVEFORM_MARK = require('../../../assets/images/home/waveform-mark.png') as number;

type BrandMarkProps = {
  readonly size?: number;
};

/**
 * Header waveform mark from assets/new_images/home-screen-sidelogo.png.
 * The source is ~2:1, so width is twice the requested height.
 */
export function BrandMark({ size = spacing.xl }: BrandMarkProps) {
  return (
    <Image
      source={WAVEFORM_MARK}
      contentFit="contain"
      accessibilityElementsHidden
      style={{ width: size * 2, height: size }}
    />
  );
}

export const HOME_WAVEFORM_MARK = WAVEFORM_MARK;
