/**
 * The single source of truth for every visual constant in the app.
 *
 * Nothing outside this folder may declare a colour, spacing step, radius, font size or
 * elevation. The Tailwind `@theme` block in global.css is generated from these values by
 * `build-css.ts`, so a token changed here changes both the native styles and the utility
 * classes.
 */

export { colors, type ColorToken } from './colors';
export { spacing, type SpacingToken } from './spacing';
export { radius, type RadiusToken } from './radius';
export { shadows, type Shadow, type ShadowToken } from './shadows';
export {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  type FontFamilyToken,
  type FontSizeToken,
} from './typography';
