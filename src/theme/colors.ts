/**
 * Colour tokens.
 *
 * The five base tokens are fixed by docs/ui-guidelines.md and are reproduced verbatim.
 *
 * Every other value is sampled from a reference image in docs/ (ADR-06). Sampling is done
 * over a region, never a single pixel, because JPEG ringing makes any lone pixel unreliable:
 *
 *   solid fills  mean of the region.
 *   glyphs and   median of the pixels at or above 75% of the region's peak luminance, which
 *   thin strokes is the stroke core; for coloured glyphs, the most saturated pixels instead.
 *
 * Each token below records the image and the element it came from. Coordinates are in the
 * source image's own pixel space (all four screens are 853x1844).
 */

export const colors = {
  // ---------------------------------------------------------------------------
  // Base tokens. docs/ui-guidelines.md, reproduced exactly. Not sampled.
  // ---------------------------------------------------------------------------
  background: '#0B0F17',
  surface: '#161F30',
  primary: '#6366F1',
  alert: '#F43F5E',
  success: '#10B981',

  // ---------------------------------------------------------------------------
  // Backgrounds
  // ---------------------------------------------------------------------------
  /**
   * summary-screen.jpg — page fill beside cards, (8,500)-(40,700). Mean ~#030B1B;
   * #05081D keeps a navy (not purple) cast while lifting slightly above pure black.
   */
  bgApp: '#05081D',
  /** active-session.jpg — screen background, (300,1500)-(600,1600). True black, AMOLED. */
  bgOled: '#000000',

  // ---------------------------------------------------------------------------
  // Surfaces
  // ---------------------------------------------------------------------------
  /** home-screen.jpg — status card interior, (600,1233)-(750,1260). history-screen.jpg reads #081228. */
  card: '#081127',
  /**
   * summary-screen.jpg — metric card fill, dark pixels mean over (90,290)-(200,350) → #0C1527.
   * Nudged one step lighter so cards separate from `bgApp` on AMOLED.
   */
  cardElevated: '#0D1829',
  /** home-screen.jpg — tab bar band, (9,1670)-(60,1700). Fades to #010A1E at its lower edge. */
  tabbar: '#051027',
  /** active-session.jpg — "Slide to end session" track, (620,1660)-(760,1710). */
  pill: '#1E1E1E',

  // ---------------------------------------------------------------------------
  // Borders
  // ---------------------------------------------------------------------------
  /** history-screen.jpg — card left edge at x=46, y=780. summary-screen.jpg edge reads #1C2536. */
  borderCard: '#1F2940',
  /**
   * summary-screen.jpg — hairline card edge at low contrast (audit ~5–6% opacity feel).
   * Solid stand-in for a translucent stroke on AMOLED.
   */
  borderCardSubtle: '#121A2A',

  // ---------------------------------------------------------------------------
  // Text tints
  // ---------------------------------------------------------------------------
  /**
   * Peak white, corroborated on home-screen.jpg heading, active-session.jpg clock and
   * history-screen.jpg section title. Stroke-core median reads #F9F9F9; the 6/255 shortfall
   * is JPEG smoothing, so the design value is plain white.
   */
  fg: '#FFFFFF',
  /** home-screen.jpg — "Track your snoring. Understand your sleep." subtitle. */
  fgBody: '#CCD0E0',
  /** summary-screen.jpg — "8.5% of sleep". Corroborated by axis labels #C6C8D7, home caption #C1C7D9. */
  fgCaption: '#C4C9D8',
  /** active-session.jpg — "Monitoring your sleep and snoring...". Neutral grey, not blue-tinted. */
  fgOled: '#BEC1C5',

  // ---------------------------------------------------------------------------
  // Status colours
  // ---------------------------------------------------------------------------
  /** summary-screen.jpg — snore-score dots, saturated median over (620,370)-(760,400). */
  warning: '#F38D07',
  /** home-screen.jpg — "Battery Low" label. summary-screen.jpg "256" reads #F9505A. */
  alertText: '#FB3B46',
  /** home-screen.jpg — "Microphone Access" label. history-screen.jpg "14%" reads #22DE71. */
  successText: '#03F982',

  // ---------------------------------------------------------------------------
  // Active session accent
  // ---------------------------------------------------------------------------
  /** active-session.jpg — "SLEEP SESSION ACTIVE" status text. */
  accentActive: '#03FD8C',
  /** active-session.jpg — live waveform bars, (400,940)-(560,1160). */
  accentWaveform: '#01F08A',

  // ---------------------------------------------------------------------------
  // Hero start button. A ring-lit disc: bright at the rim, dark at the centre.
  // ---------------------------------------------------------------------------
  /** home-screen.jpg — disc centre fill, sampled at (320,837) and (480,837). */
  heroCore: '#101968',
  /** home-screen.jpg — fill immediately inside the ring, (185,827)-(205,847). */
  heroEdge: '#3532E3',
  /** home-screen.jpg — the white ring itself, stroke-core median over (160,815)-(180,860). */
  heroRing: '#E5E7FE',
  /** home-screen.jpg — glow immediately outside the ring, (640,827)-(660,847). */
  heroGlow: '#4B48DC',

  // ---------------------------------------------------------------------------
  // Snoring timeline bars. Each bar runs low to peak bottom-to-top.
  // ---------------------------------------------------------------------------
  /** summary-screen.jpg — bar base, p75 luminance of saturated pixels (300,1380)-(340,1420). */
  timelineLow: '#1F1C7B',
  /** summary-screen.jpg — bar midpoint (300,1300)-(340,1340); mid-stack reads purple-blue. */
  timelineMid: '#6642B9',
  /** summary-screen.jpg — loudest bar crown near peak callout (~x=492,y=1200). */
  timelinePeak: '#FC4144',

  // ---------------------------------------------------------------------------
  // Tab bar icons
  // ---------------------------------------------------------------------------
  /** home-screen.jpg — selected "Home" icon, (104,1685)-(148,1728). */
  tabActive: '#4843FC',
  /** home-screen.jpg — unselected "History" icon, (302,1685)-(342,1728). */
  tabInactive: '#858CA4',

  // ---------------------------------------------------------------------------
  // AI Insights card — sampled from the "AI Insights" mockup the user provided on
  // 2026-08-08 while iterating on Task 6.8. Each insight owns a distinct accent so a
  // reader can identify the five metrics at a glance without reading labels.
  // ---------------------------------------------------------------------------
  /** Insights outer card fill, mockup neutral near-black behind the header row. */
  insightSurface: '#111116',
  /** Inner tile fill (featured + 3-col grid + Sound Mix), one step lighter than surface. */
  insightTile: '#17171D',
  /** Icon glow halo behind circular icons — very-low-opacity backdrop hint. */
  insightHalo: '#242430',

  /** AI Accuracy accent — target/bullseye tile ("Excellent"). */
  insightAiAccuracy: '#5B9DFF',
  /** Snoring Level accent — lungs tile ("Low" ↔ "Heavy"). */
  insightSnoringLevel: '#3EE580',
  /** Pattern accent — waveform tile ("Consistent"). */
  insightPattern: '#2FD9C5',
  /** Rhythm accent — heartbeat tile ("Stable"). */
  insightRhythm: '#E93D7B',
  /** Sound Mix accent — bar chart tile (numeric counts). */
  insightSoundMix: '#F3A620',
} as const;

export type ColorToken = keyof typeof colors;
