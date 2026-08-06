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
  /** home-screen.jpg — page background beside the hero, (600,300)-(760,380). */
  bgApp: '#070E1E',
  /** active-session.jpg — screen background, (300,1500)-(600,1600). True black, AMOLED. */
  bgOled: '#000000',

  // ---------------------------------------------------------------------------
  // Surfaces
  // ---------------------------------------------------------------------------
  /** home-screen.jpg — status card interior, (600,1233)-(750,1260). history-screen.jpg reads #081228. */
  card: '#081127',
  /** summary-screen.jpg — metric card interior, (320,285)-(580,305). Summary cards sit one step lighter. */
  cardElevated: '#0D1729',
  /** home-screen.jpg — tab bar band, (9,1670)-(60,1700). Fades to #010A1E at its lower edge. */
  tabbar: '#051027',
  /** active-session.jpg — "Slide to end session" track, (620,1660)-(760,1710). */
  pill: '#1E1E1E',

  // ---------------------------------------------------------------------------
  // Borders
  // ---------------------------------------------------------------------------
  /** history-screen.jpg — card left edge at x=46, y=780. summary-screen.jpg edge reads #1C2536. */
  borderCard: '#1F2940',

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
  /** summary-screen.jpg — "Moderate" snore score. Its dot scale reads #FEA401. */
  warning: '#FFA901',
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
  /** summary-screen.jpg — bar base, x=244 y=1325. */
  timelineLow: '#27299A',
  /** summary-screen.jpg — bar midpoint, x=244 y=1285. */
  timelineMid: '#4841DB',
  /** summary-screen.jpg — loudest bar crown, x=244 y=1200. */
  timelinePeak: '#FD4046',

  // ---------------------------------------------------------------------------
  // Tab bar icons
  // ---------------------------------------------------------------------------
  /** home-screen.jpg — selected "Home" icon, (104,1685)-(148,1728). */
  tabActive: '#4843FC',
  /** home-screen.jpg — unselected "History" icon, (302,1685)-(342,1728). */
  tabInactive: '#858CA4',
} as const;

export type ColorToken = keyof typeof colors;
