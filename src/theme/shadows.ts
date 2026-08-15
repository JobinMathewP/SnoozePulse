/**
 * Elevation tokens.
 *
 * The reference screens are deliberately flat: cards separate from the background with a
 * 1 px border (see `colors.borderCard`), not a drop shadow, which is what keeps an AMOLED
 * layout from looking muddy. So the scale is short on purpose.
 *
 * `heroGlow` is the exception. The circular start art on home-screen-moke.png is lit by a
 * violet halo; that bloom is reproduced with a shadow. Colour is sampled `colors.heroGlow`.
 *
 * Each token carries both a React Native style object and the equivalent CSS string. Only
 * the style objects are consumed today: elevation is applied natively rather than through a
 * Tailwind utility, because React Native maps shadows onto `elevation` on Android and
 * `shadow*` props on iOS rather than onto a CSS box-shadow. The `css` field exists so a
 * future web target, or a NativeWind release with fuller box-shadow support, has the same
 * values to draw on without anyone re-deriving them.
 */

import { colors } from './colors';

export interface Shadow {
  readonly shadowColor: string;
  readonly shadowOffset: { readonly width: number; readonly height: number };
  readonly shadowOpacity: number;
  readonly shadowRadius: number;
  readonly elevation: number;
  readonly css: string;
}

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    css: 'none',
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.24,
    shadowRadius: 3,
    elevation: 1,
    css: '0 1px 3px rgb(0 0 0 / 0.24)',
  },
  raised: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 4,
    css: '0 4px 10px rgb(0 0 0 / 0.32)',
  },
  heroGlow: {
    shadowColor: colors.heroGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 28,
    elevation: 12,
    css: `0 0 28px ${colors.heroGlow}`,
  },
  /** Settings icon-tile bloom. Colour is sampled `settingsAccent`; spread is modest so cards stay readable. */
  settingsGlow: {
    shadowColor: colors.settingsAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
    css: `0 0 10px ${colors.settingsAccent}`,
  },
} as const satisfies Record<string, Shadow>;

export type ShadowToken = keyof typeof shadows;
