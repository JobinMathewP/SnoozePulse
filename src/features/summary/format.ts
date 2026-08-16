import type { SessionSummary, SnoreEvent } from '@/types';

/**
 * Static Summary labels and presentation helpers (no fixture data).
 */

export const summaryCopy = {
  sleepDurationLabel: 'Sleep Duration',
  snoreCountLabel: 'Snore Count',
  snoreCountCaption: 'Total snores',
  snoreScoreLabel: 'Snore Score',
  snoringTimeLabel: 'Total Snoring Time',
  snoringTimeCaptionSuffix: ' of sleep',
  peakLoudnessLabel: 'Peak Loudness',
  peakLoudnessUnit: 'dB',
  loudestTitle: 'Loudest Snore Episode',
  snippetsTitle: 'Snore Audio Snippets',
  snippetsCaption: 'Loudest 10 from this night',
  title: 'Sleep Summary',
  backAccessibilityLabel: 'Go back',
  prevDayAccessibilityLabel: 'Previous session',
  nextDayAccessibilityLabel: 'Next session',
  calendarAccessibilityLabel: 'Open calendar',
  emptyTitle: 'No session data',
  emptyBody: 'Complete a sleep session to see your summary.',
  loadingLabel: 'Loading summary…',
  retryLabel: 'Try again',
  retryAccessibilityLabel: 'Retry loading summary',
  timelineInfoTitle: 'Snoring Timeline',
  timelineInfoBody:
    'Each bar is a window of the night. Taller, redder bars were louder.',
  timelineInfoAccessibilityLabel: 'About the snoring timeline',
  infoDismissLabel: 'Got it',
  infoDismissAccessibilityLabel: 'Close explanation',
} as const;

export type SnippetRowModel = {
  readonly event: SnoreEvent;
  readonly timeLabel: string;
  readonly durationLabel: string;
  readonly lengthLabel: string;
};

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function formatSummaryDateLabel(epochMs: number): string {
  // Night identity is bedtime (`startedAt` local day), never wake time.
  const d = new Date(epochMs);
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatClockRange(startedAt: number, endedAt: number): string {
  return `${formatClock(startedAt)} - ${formatClock(endedAt)}`;
}

export function formatClock(epochMs: number): string {
  const d = new Date(epochMs);
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) {
    hours = 12;
  }
  const minuteText = minutes < 10 ? `0${minutes}` : String(minutes);
  return `${hours}:${minuteText} ${period}`;
}

export function formatDurationShort(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}

export function formatMinutesLabel(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  return `${minutes} mins`;
}

export function formatPercentOfSleep(share: number): string {
  const pct = Math.round(share * 1000) / 10;
  return `${pct}%${summaryCopy.snoringTimeCaptionSuffix}`;
}

export function formatSnippetLength(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const secondText = seconds < 10 ? `0${seconds}` : String(seconds);
  return `${minutes}:${secondText}`;
}

export function formatEpisodeDetail(peakDb: number, durationMs: number): string {
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  return `${Math.round(peakDb)} dB - ${seconds} sec`;
}

export const SNIPPET_LIST_LIMIT = 10;

export function toSnippetRows(events: readonly SnoreEvent[]): readonly SnippetRowModel[] {
  const playable = events.filter((event) => event.audioPath !== null);
  const loudest = [...playable].sort((a, b) => b.peakDb - a.peakDb).slice(0, SNIPPET_LIST_LIMIT);
  const chronological = [...loudest].sort((a, b) => a.timestamp - b.timestamp);
  return chronological.map((event) => ({
    event,
    timeLabel: formatClock(event.timestamp),
    durationLabel: formatEpisodeDetail(event.peakDb, event.durationMs),
    lengthLabel: formatSnippetLength(event.durationMs),
  }));
}

export function playableSnippetCount(events: readonly SnoreEvent[]): number {
  return events.filter((event) => event.audioPath !== null).length;
}

export function loudestDisplay(summary: SessionSummary): {
  readonly timeLabel: string;
  readonly detailLabel: string;
} | null {
  const episode = summary.loudestEpisode;
  if (!episode) {
    return null;
  }
  return {
    timeLabel: formatClock(episode.timestamp),
    detailLabel: formatEpisodeDetail(episode.peakDb, episode.durationMs),
  };
}

