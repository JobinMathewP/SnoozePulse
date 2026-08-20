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

export const missedNightCopy = {
  microphone: {
    title: "Tonight's tracking couldn't start.",
    body: 'Microphone permission is required.',
  },
  battery: {
    title: "Tonight's tracking couldn't start.",
    body: 'Battery was too low.',
  },
  schedule: {
    title: "Tonight's tracking couldn't start.",
    body: 'Set a bedtime and wake time in Settings.',
  },
  engine: {
    title: "Tonight's tracking couldn't start.",
    body: 'Tracking was interrupted before it could finish.',
  },
} as const;

export const batterySavedCopy = {
  caption: "SnoozePulse saved last night's tracking before the battery ran out.",
} as const;

export const chargerReminderCopy = {
  title: "Tonight's tracking",
  subtitle:
    "Your phone isn't charging. For the best experience, connect your charger before bed.",
  accessibilityLabel:
    "Tonight's tracking. Your phone isn't charging. For the best experience, connect your charger before bed.",
} as const;

/**
 * Home headline when automatic tracking is on. Start stays on the hero as an override
 * (prd.md §6); these strings are the primary daily message.
 */
export const tonightCopy = {
  armedHeadline: "Tonight's tracking is on.",
  armedSubhead: (bedtime: string) =>
    `SnoozePulse will start around ${bedtime} when your phone is settled.`,
  waitingHeadline: "Tonight's tracking is waiting.",
  waitingSubhead: 'SnoozePulse will start when your phone stays settled.',
  monitoringHeadline: "Tonight's tracking is on.",
  monitoringSubhead: 'SnoozePulse is monitoring now.',
  readyHeadline: 'Your sleep summary is ready.',
  readySubhead: 'See how you slept last night.',
  unarmedHeadline: "Tonight's tracking isn't armed.",
  unarmedSubhead: 'Set a bedtime and wake time in Settings.',
  overrideCaption: 'Start anyway',
  overrideAccessibilityLabel: 'Start a sleep session anyway',
  inProgressCaption: 'Session in progress',
  openActiveAccessibilityLabel: 'Return to the active sleep session',
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
