/**
 * Static Home copy and battery threshold — not mock session data.
 */

export const homeCopy = {
  brandName: 'SnoozePulse',
  headline: "Ready for a better night's sleep?",
  /** Three sentences — wrap to three lines on the reference width. */
  subhead: 'Track your snoring. Understand your sleep. Wake up refreshed.',
  heroLabel: 'START',
  heroSublabel: 'SLEEP SESSION',
  heroAccessibilityLabel: 'Start sleep session',
  settingsAccessibilityLabel: 'Open settings',
  startingLabel: 'Starting…',
  calibratingLabel: 'Calibrating ambient noise…',
} as const;

/** Fraction of charge at or below which the battery card uses the alert tone. */
export const BATTERY_LOW_THRESHOLD = 0.2;

export const batteryCopy = {
  lowTitle: 'Battery Low',
  lowSubtitle: 'Plug in charger recommended',
  okTitle: 'Battery Ready',
  okSubtitle: 'Sufficient for overnight recording',
} as const;

export const microphoneCopy = {
  grantedTitle: 'Microphone Access',
  grantedSubtitle: 'Permission granted',
  deniedTitle: 'Microphone Access',
  deniedSubtitle: 'Permission required — tap Start to allow',
  undeterminedTitle: 'Microphone Access',
  undeterminedSubtitle: 'Permission needed before recording',
} as const;

export const calibrationCopy = {
  pendingTitle: 'Ambient Noise Calibration',
  pendingSubtitle: 'Will calibrate when you start',
  quietSubtitle: 'Calibrated - Quiet Environment',
  moderateSubtitle: 'Calibrated - Moderate Environment',
  noisySubtitle: 'Calibrated - Noisy Environment',
} as const;
