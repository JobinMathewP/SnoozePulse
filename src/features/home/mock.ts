/**
 * Home mock copy and readiness fixtures.
 *
 * Battery percentage is live (`expo-battery`). Microphone and calibration stay mock until
 * the permission / calibration services land. Deleted wholesale in Task 5.3.
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
} as const;

/** Fraction of charge at or below which the battery card uses the alert tone. */
export const BATTERY_LOW_THRESHOLD = 0.2;

export const batteryCopy = {
  lowTitle: 'Battery Low',
  lowSubtitle: 'Plug in charger recommended',
  okTitle: 'Battery Ready',
  okSubtitle: 'Sufficient for overnight recording',
} as const;

export const mockMicrophoneStatus = {
  tone: 'success' as const,
  title: 'Microphone Access',
  subtitle: 'Permission granted',
};

export const mockCalibrationStatus = {
  tone: 'informational' as const,
  title: 'Ambient Noise Calibration',
  subtitle: 'Calibrated - Quiet Environment',
};
