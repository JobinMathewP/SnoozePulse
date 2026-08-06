/**
 * Active Session static copy and audio-level band labels.
 */

export const activeSessionCopy = {
  status: 'SLEEP SESSION ACTIVE',
  monitoring: 'Monitoring your sleep and snoring...',
  audioLevelLabel: 'Audio level',
  slideLabel: 'Slide to end session',
  slideAccessibilityLabel: 'End sleep session',
  slideAccessibilityHint:
    'Double tap to end the session, or slide the handle all the way to the right',
  recordingIndicatorAccessibilityLabel: 'Microphone in use',
} as const;

export type AudioLevelBand = 'Low' | 'Moderate' | 'High';

/** Shared-value level (0–1) → human label. */
export function audioLevelBand(level: number): AudioLevelBand {
  if (level < 0.35) {
    return 'Low';
  }
  if (level < 0.7) {
    return 'Moderate';
  }
  return 'High';
}

/** Band from engine dB (throttled store path). */
export function audioLevelBandFromDb(decibel: number): AudioLevelBand {
  if (decibel < 40) {
    return 'Low';
  }
  if (decibel < 60) {
    return 'Moderate';
  }
  return 'High';
}
