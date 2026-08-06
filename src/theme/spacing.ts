/**
 * Spacing scale, in density-independent pixels.
 *
 * Fixed by docs/ui-guidelines.md. These five steps are the only spacing values in the
 * product; no layout may introduce an intermediate number.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export type SpacingToken = keyof typeof spacing;
