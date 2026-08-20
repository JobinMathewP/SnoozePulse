import { BATTERY_SAVE_THRESHOLD } from '@/utils';

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

/**
 * Time-of-day greeting, optionally personalised with the display name (ADR-30). Neutral
 * ("Good evening") when the name was skipped, so the header never shows a dangling comma.
 * `hour` is injected so the pure string is trivially testable.
 */
export function greeting(displayName: string | null, hour: number): string {
  const partOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const base = `Good ${partOfDay}`;
  const name = displayName?.trim();
  return name && name.length > 0 ? `${base}, ${name}` : base;
}

export const lastNightCopy = {
  title: 'Last night',
  emptyTitle: 'No sessions yet',
  emptyBody: 'Start your first sleep session to see your snore summary here.',
  viewAccessibilityLabel: 'View your most recent sleep summary',
  scoreLabel: 'Snore score',
  durationLabel: 'Duration',
} as const;

/** Same charge fraction as the in-session save-and-stop guard (ADR-34). */
export const BATTERY_LOW_THRESHOLD = BATTERY_SAVE_THRESHOLD;

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
