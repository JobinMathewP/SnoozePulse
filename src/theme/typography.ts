/**
 * Typography tokens.
 *
 * Inter is bundled rather than relying on a platform face, so Android and iOS render
 * identically (ADR-07). The family names below are the keys `@expo-google-fonts/inter`
 * registers with `expo-font`; using any other string silently falls back to the system face.
 *
 * Sizes are a scale in scale-independent pixels. ADR-06 governs colour only, so these are
 * not sampled; `body` is pinned to the 14 sp floor docs/ui-guidelines.md sets, and `metric`
 * exists for the oversized readouts the reference screens lead with ("7h 48m", "11:47").
 */

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const fontSize = {
  caption: 12,
  body: 14,
  bodyLg: 16,
  title: 20,
  heading: 24,
  display: 32,
  metric: 44,
} as const;

export const lineHeight = {
  caption: 16,
  body: 20,
  bodyLg: 24,
  title: 28,
  heading: 32,
  display: 40,
  metric: 52,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export type FontFamilyToken = keyof typeof fontFamily;
export type FontSizeToken = keyof typeof fontSize;
