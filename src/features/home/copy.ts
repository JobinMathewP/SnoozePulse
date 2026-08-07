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
  calibratingLabel: 'Measuring environment…',
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
  deniedSubtitle: 'Permission required — tap here to open Settings',
  undeterminedTitle: 'Microphone Access',
  undeterminedSubtitle: 'Permission needed before recording',
  openSettingsAccessibilityLabel: 'Open system settings for microphone access',
} as const;

export const homeErrorCopy = {
  recoverLabel: 'Dismiss and return',
  recoverAccessibilityLabel: 'Dismiss session error and return to ready state',
  retryLabel: 'Try again',
  retryAccessibilityLabel: 'Retry starting a sleep session',
} as const;

export const calibrationCopy = {
  pendingTitle: 'Environment',
  pendingSubtitle: 'Measured while you sleep',
  quietSubtitle: 'Quiet environment',
  moderateSubtitle: 'Moderate environment',
  noisySubtitle: 'Noisy environment',
} as const;
