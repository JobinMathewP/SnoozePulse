/**
 * Active Session mock copy and level bands.
 *
 * The 10 Hz waveform stream is generated in `useMockAudioLevel`; this file holds only
 * static strings and thresholds. Deleted wholesale in Task 5.3.
 */

export const activeSessionCopy = {
  status: 'SLEEP SESSION ACTIVE',
  monitoring: 'Monitoring your sleep and snoring...',
  audioLevelLabel: 'Audio level',
  slideLabel: 'Slide to end session',
  slideAccessibilityLabel: 'End sleep session',
  slideAccessibilityHint: 'Double tap to end the session, or slide the handle all the way to the right',
  recordingIndicatorAccessibilityLabel: 'Microphone in use',
} as const;

export type AudioLevelBand = 'Low' | 'Moderate' | 'High';

/** Shared-value level (0–1) → human label. Thresholds are mock placeholders. */
export function audioLevelBand(level: number): AudioLevelBand {
  if (level < 0.35) {
    return 'Low';
  }
  if (level < 0.7) {
    return 'Moderate';
  }
  return 'High';
}

/** Mock generator cadence — matches ADR-13 / architecture (~10 Hz). */
export const MOCK_AUDIO_HZ = 10;
