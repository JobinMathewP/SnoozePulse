import type { SessionBucket, SessionSummary, SnoreEvent } from '@/types';

import type { TimelineBarModel, TimelinePeakCallout } from '@/components/ui';

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
  prevDayAccessibilityLabel: 'Previous session',
  nextDayAccessibilityLabel: 'Next session',
  calendarAccessibilityLabel: 'Open calendar',
  emptyTitle: 'No session data',
  emptyBody: 'Complete a sleep session to see your summary.',
  loadingLabel: 'Loading summary…',
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

export function toSnippetRows(events: readonly SnoreEvent[]): readonly SnippetRowModel[] {
  return events.map((event) => ({
    event,
    timeLabel: formatClock(event.timestamp),
    durationLabel: formatEpisodeDetail(event.peakDb, event.durationMs),
    lengthLabel: formatSnippetLength(event.durationMs),
  }));
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

/** Labels on first, last, and ~2-hour boundaries across the night. */
export function bucketsToTimelineBars(
  buckets: readonly SessionBucket[],
): readonly TimelineBarModel[] {
  if (buckets.length === 0) {
    return [];
  }
  const twoHours = 2 * 60 * 60 * 1000;
  const firstStart = buckets[0]!.bucketStart;
  return buckets.map((bucket, index) => {
    const prev = buckets[index - 1];
    const crossedBoundary =
      prev !== undefined &&
      Math.floor((bucket.bucketStart - firstStart) / twoHours) >
        Math.floor((prev.bucketStart - firstStart) / twoHours);
    const shouldLabel =
      index === 0 || index === buckets.length - 1 || crossedBoundary;
    return {
      id: `bucket-${bucket.bucketStart}`,
      timeLabel: shouldLabel
        ? formatHourLabel(new Date(bucket.bucketStart).getHours())
        : '',
      averageDb: bucket.averageDb,
      peakDb: bucket.peakDb,
    };
  });
}

export function peakCalloutFromSummary(
  summary: SessionSummary,
  buckets: readonly SessionBucket[],
): TimelinePeakCallout | undefined {
  if (summary.peakAt === null || buckets.length === 0) {
    return undefined;
  }
  let best = buckets[0]!;
  let bestDelta = Math.abs(best.bucketStart - summary.peakAt);
  for (const bucket of buckets) {
    const delta = Math.abs(bucket.bucketStart - summary.peakAt);
    if (delta < bestDelta) {
      best = bucket;
      bestDelta = delta;
    }
  }
  return {
    barId: `bucket-${best.bucketStart}`,
    label: `${Math.round(summary.peakDb)} dB`,
  };
}

function formatHourLabel(hour24: number): string {
  const period = hour24 >= 12 ? 'PM' : 'AM';
  let hour = hour24 % 12;
  if (hour === 0) {
    hour = 12;
  }
  return `${hour}${period}`;
}

/** Parse `bucket-${epoch}` bar ids back to the bucket start epoch. */
export function bucketStartFromBarId(barId: string): number | null {
  const prefix = 'bucket-';
  if (!barId.startsWith(prefix)) {
    return null;
  }
  const value = Number(barId.slice(prefix.length));
  return Number.isFinite(value) ? value : null;
}

/**
 * Loudest snore whose timestamp falls in `[bucketStart, bucketStart + duration)`.
 * Prefers higher peakDb; ties keep the earlier event.
 */
export function loudestEventInBucket(
  events: readonly SnoreEvent[],
  bucketStart: number,
  bucketDurationMs: number,
): SnoreEvent | null {
  const end = bucketStart + bucketDurationMs;
  let best: SnoreEvent | null = null;
  for (const event of events) {
    if (event.timestamp < bucketStart || event.timestamp >= end) {
      continue;
    }
    if (!best || event.peakDb > best.peakDb) {
      best = event;
    }
  }
  return best;
}
