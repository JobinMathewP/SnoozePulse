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
  /**
   * Modal scrim behind bottom sheets (calendar picker, confirmations). Not sampled — there
   * is no reference image for a modal; a 60%-black veil is the platform-neutral default that
   * dims the page without tinting it (ADR-30).
   */
  scrim: 'rgba(0, 0, 0, 0.6)',

  // ---------------------------------------------------------------------------
  // Calendar history view (ADR-30). These are from the user's explicit redesign
  // spec, not sampled from a docs/ mockup — the history calendar is a new design
  // direction. The palette deliberately diverges from Apple Fitness's neon rings
  // (cyan → blue instead of pink/red) to avoid a copycat rejection (Guideline 4.1).
  // ---------------------------------------------------------------------------
  /** Deep midnight page fill for the floating calendar sheet. */
  calBg: '#0B0D17',
  /** Inactive ring track — a shade above the background, not a tint of the active ring. */
  calRingTrack: '#1A1D2D',
  /** Quiet-sleep ring gradient start (cyan). */
  calRingStart: '#00F2FE',
  /** Quiet-sleep ring gradient end (blue). */
  calRingEnd: '#4FACFE',
  /** Faded weekday labels / secondary text on the calendar. */
  calWeekday: '#7A819C',
  /** Translucent circular control background (close button). */
  calControl: 'rgba(255, 255, 255, 0.10)',

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
  /**
   * assets/new_images/home-screen-moke.png — bloom on the circular start art,
   * saturated pixels (180,720)–(250,900) → #8A4FF6.
   */
  heroGlow: '#8A4FF6',

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
  /**
   * assets/new_images/home-screen-moke.png — selected Home house, saturated pixels
   * (40,1680)–(250,1800) → #723EFB.
   */
  tabActive: '#723EFB',
  /**
   * assets/new_images/home-screen-moke.png — inactive History bars, (480,1690)–(720,1780)
   * mid-luminance glyphs → #636885.
   */
  tabInactive: '#636885',

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

  // ---------------------------------------------------------------------------
  // Onboarding (first-run). Sampled from assets/new_images/allscreen.png (1536×1024,
  // four phones). Do not reuse these on Home/History — the rest of the product stays on
  // the indigo `primary` / `tabActive` family (ADR-06).
  // ---------------------------------------------------------------------------
  /**
   * CTA fill. Phone 1 button core, vertical sample at (188, 748)–(188, 756) → #4D36BA.
   * Phone 2 button core (576, 780)–(576, 792) corroborates #4C38B9.
   */
  onboardAccent: '#4D36BA',
  /**
   * Heading highlight (“while you sleep”, “privacy”). Saturated glyphs on phones 2–3
   * (cols 2–3, y≈90–180) mean #694ADE.
   */
  onboardAccentMuted: '#694ADE',
  /**
   * Idle progress dots. Neutral mid-gray cluster in phone 1 header band (80–300, 50–110)
   * where max-min < 20 → #242630.
   */
  onboardDotIdle: '#242630',
  /**
   * Name-field fill. Phone 4 input band, dark pixels (max < 60) over (1198, 540)–(1490, 640)
   * → #0B1321.
   */
  onboardInputFill: '#0B1321',

  // ---------------------------------------------------------------------------
  // Settings (ADR-30 chrome). Sampled from assets/new_images/settings-screen.png
  // (853×1844). Do not reuse these on Home/History/onboarding.
  // ---------------------------------------------------------------------------
  /**
   * Uppercase section labels (“PROFILE”). Left band (40,248)–(160,272); chroma-filtered
   * core of the lavender glyphs → #8B72EC.
   */
  settingsSection: '#8B72EC',
  /**
   * Card surface. Profile card interior mean over (50,300)–(400,400) → #1B1B41.
   * Data/About/Legal cards corroborate #1C1F3E–#1D2040.
   */
  settingsCard: '#1B1B41',
  /**
   * Card hairline. Legal-card saturated edge (80,1300)–(400,1360) sat12 → #2A285A.
   */
  settingsCardBorder: '#2A285A',
  /**
   * Edit outline / avatar / icon glow. PROFILE glyph core #8B72EC; Edit-pill saturated
   * pixels (600,300)–(830,400) top → #9774F2. Use the glyph core so labels and chrome match.
   */
  settingsAccent: '#8B72EC',
  /**
   * Rounded-square behind Ionicons. Legal first-row tile mean (48,1280)–(110,1340) → #21214C.
   */
  settingsIconTile: '#21214C',
  /**
   * Delete-row glyph. Red pixels (40,825)–(820,895), chroma ≥ 40, core → #F75166.
   */
  settingsDestructive: '#F75166',

  // ---------------------------------------------------------------------------
  // Home (premium mock). Sampled from assets/new_images/home-screen-moke.png
  // (853×1844). Do not reuse onboard / settings tokens here.
  // ---------------------------------------------------------------------------
  /**
   * Greeting (“Good morning, …”). Saturated glyphs (200,220)–(650,265) core → #A883FE.
   */
  homeGreeting: '#A883FE',
  /**
   * Status / Last-night card fill. Dark pixels (80,1040)–(400,1120) → #06081F.
   */
  homeCard: '#06081F',
  /**
   * Status-card left hairline. Mid-luminance edge (40,1040)–(70,1180) → #121135.
   */
  homeCardBorder: '#121135',
  /**
   * Environment waveform / snore-ring stroke. Saturated ring pixels (60,1500)–(280,1640)
   * → #743EFB.
   */
  homeAccent: '#743EFB',
  /**
   * Snore-score ring highlight. Last-night label core (50,1420)–(250,1470) → #AA81FF.
   */
  homeRingStart: '#AA81FF',
  /**
   * Snore-score ring deep stop. Same family as `tabActive` (#723EFB).
   */
  homeRingEnd: '#723EFB',
  /**
   * Soft disc behind the active Home tab icon. (180,1688)–(280,1788) purple wash → #2D1D6C.
   */
  homeTabPill: '#2D1D6C',
  /**
   * Vertical divider in Last night. (380,1500)–(460,1620) mean → #100F33.
   */
  homeDivider: '#100F33',
  /**
   * Ready battery / mic glyphs. Microphone check core (600,1140)–(830,1220) → #22E37C.
   */
  homeReady: '#22E37C',
} as const;

export type ColorToken = keyof typeof colors;
