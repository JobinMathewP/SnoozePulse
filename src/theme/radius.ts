/**
 * Corner radius scale, in density-independent pixels.
 *
 * `md` is measured, not chosen: on summary-screen.jpg the metric card's top-left arc runs
 * from (51,276) to (31,300), a 24 px sweep, and home-screen.jpg's status card measures the
 * same within a pixel. The mockups are 853 px wide against a 412 dp reference viewport, a
 * scale of 2.07, so 24 px lands at 12 dp. The remaining steps extend that anchor.
 *
 * `full` is for elements the images render as a stadium: the "Slide to end session" track
 * (150 px tall) and the history segmented control (86 px tall) are both radius = height / 2.
 */

export const radius = {
  none: 0,
  /**
   * summary-screen.jpg — "68 dB" peak callout badge corner. Sampled at (492,1150)-(560,1180);
   * the corner sweep runs ~7 px at the mockup's 2.07 scale, landing at ~4 dp.
   */
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
