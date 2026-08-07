/**
 * Minimum interactive target from docs/ui-guidelines.md.
 * Accessibility floor — not a visual theme token.
 */
export const TOUCH_TARGET = 44;

/**
 * Symmetric hitSlop so a visually small control still meets {@link TOUCH_TARGET}.
 */
export function hitSlopForVisualSize(visualSize: number): number {
  return Math.max(0, Math.ceil((TOUCH_TARGET - visualSize) / 2));
}
