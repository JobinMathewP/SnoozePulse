/**
 * Active Session static copy and audio-level band labels.
 */

export const activeSessionCopy = {
  status: 'SLEEP SESSION ACTIVE',
  monitoring: 'Monitoring your sleep and snoring...',
  backgroundHint: 'Safe to lock your phone. Recording continues in the background.',
  lowPowerWaveformLabel: 'Low-power mode — waveform paused',
  /**
   * Task 6.7: retained for callers that still want a room-noise band label. The record
   * screen replaces its loudness-detector readout with a classifier-driven pill and
   * therefore no longer surfaces this string.
   */
  audioLevelLabel: 'Room sound',
  detectionListeningLabel: 'Listening for snoring',
  detectionActiveLabel: 'Snoring detected',
  detectionConfidenceLabel: 'Confidence',
  roomNoiseLabel: 'Room noise (60 s)',
  roomNoiseUnit: 'dB',
  detectionStateAccessibilityLabel:
    'Classifier state — updates while the microphone is listening',
  slideLabel: 'Slide to end session',
  slideAccessibilityLabel: 'End sleep session',
  slideAccessibilityHint:
    'Double tap to end the session, or slide the handle all the way to the right',
  recordingIndicatorAccessibilityLabel: 'Microphone in use',
  recoverHomeLabel: 'Return home',
  recoverHomeAccessibilityLabel: 'End failed session and return home',
  storageWarningDismissLabel: 'Dismiss',
  storageWarningDismissAccessibilityLabel: 'Dismiss storage warning',
  /** Too-short discard confirmation (ADR-30). */
  tooShortTitle: 'End session already?',
  tooShortBody:
    "Sessions under 5 minutes aren't saved — there isn't enough to analyze yet. End now and discard this recording?",
  tooShortDiscardLabel: 'Discard',
  tooShortDiscardAccessibilityLabel: 'Discard this short session and return home',
  tooShortKeepLabel: 'Keep recording',
  tooShortKeepAccessibilityLabel: 'Dismiss and keep recording',
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

/**
 * Task 6.7 — format the classifier's throttled probability as an integer percent for
 * the record screen. `NaN` and out-of-range values are clamped to `0 %` so the string
 * never breaks the header layout.
 */
export function formatConfidencePercent(confidence: number): string {
  if (!Number.isFinite(confidence)) {
    return '0%';
  }
  const clamped = Math.max(0, Math.min(1, confidence));
  return `${Math.round(clamped * 100)}%`;
}

/**
 * Task 6.7 — format the rolling noise floor. Reads "—" until the estimator has produced
 * its first non-zero sample so we do not lie about the room being 0 dB during warmup.
 */
export function formatNoiseFloor(noiseFloorDb: number): string {
  if (!Number.isFinite(noiseFloorDb) || noiseFloorDb <= 0) {
    return '—';
  }
  return `${Math.round(noiseFloorDb)}`;
}
