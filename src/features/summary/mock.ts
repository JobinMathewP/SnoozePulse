import type { SessionBucket, SessionSummary, SnoreEvent } from '@/types';

import type { TimelineBarModel, TimelinePeakCallout } from '@/components/ui';

/**
 * Sleep Summary mock for May 21, 2024 — matches summary-screen.jpg.
 * Shaped like domain types so Task 5.3 is a data swap. Deleted in Task 5.3.
 */

const SESSION_ID = 'sample';

/** 2024-05-20 23:32 local → epoch used only for relative bucket spacing in the mock. */
const NIGHT_START_MS = Date.parse('2024-05-20T23:32:00');

export const summaryCopy = {
  dateLabel: 'May 21, 2024',
  sleepDurationLabel: 'Sleep Duration',
  sleepDurationValue: '7h 48m',
  sleepDurationCaption: '11:32 PM - 7:20 AM',
  snoreCountLabel: 'Snore Count',
  snoreCountCaption: 'Total snores',
  snoreScoreLabel: 'Snore Score',
  snoringTimeLabel: 'Total Snoring Time',
  snoringTimeValue: '42 mins',
  snoringTimeCaption: '8.5% of sleep',
  peakLoudnessLabel: 'Peak Loudness',
  peakLoudnessValue: '68',
  peakLoudnessUnit: 'dB',
  peakLoudnessCaption: 'at 03:14 AM',
  loudestTitle: 'Loudest Snore Episode',
  snippetsTitle: 'Snore Audio Snippets',
  prevDayAccessibilityLabel: 'Previous day',
  nextDayAccessibilityLabel: 'Next day',
  calendarAccessibilityLabel: 'Open calendar',
} as const;

export const mockSessionSummary: SessionSummary = {
  sessionId: SESSION_ID,
  range: {
    startedAt: NIGHT_START_MS,
    endedAt: Date.parse('2024-05-21T07:20:00'),
  },
  durationMs: 7 * 60 * 60 * 1000 + 48 * 60 * 1000,
  snoreCount: 256,
  totalSnoringMs: 42 * 60 * 1000,
  snoringShare: 0.085,
  peakDb: 68,
  peakAt: Date.parse('2024-05-21T03:14:00'),
  snoreScore: {
    value: 58,
    band: 'moderate',
    filledDots: 4.5,
  },
  sleepScore: {
    value: 72,
  },
  loudestEpisode: {
    id: 'ep-loudest',
    sessionId: SESSION_ID,
    timestamp: Date.parse('2024-05-21T03:14:00'),
    durationMs: 10_000,
    peakDb: 68,
    audioPath: 'mock://snippets/loudest.m4a',
  },
};

/**
 * ~5-minute buckets 11 PM → 7 AM — ~96 fine bars (summary-screen.jpg density).
 */
export const mockSessionBuckets: readonly SessionBucket[] = (() => {
  const envelope = [
    26, 27, 28, 29, 30, 31, 32, 33, 32, 34, 35, 36, 37, 38, 39, 40, 39, 41, 42, 43, 44, 45, 46, 47,
    48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 66, 64, 62,
    60, 58, 56, 54, 52, 50, 48, 46, 45, 44, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29,
    28, 28, 27, 27, 26, 26, 25, 25, 24, 24, 23, 23, 22, 22, 21, 21, 20, 20, 20, 19, 19, 18, 18, 18,
  ] as const;
  const start = Date.parse('2024-05-20T23:00:00');
  const stepMs = 5 * 60 * 1000;
  return envelope.map((peakDb, index) => ({
    sessionId: SESSION_ID,
    bucketStart: start + index * stepMs,
    averageDb: Math.round(peakDb * 0.72),
    peakDb,
    snoringMs: peakDb * 1_000,
  }));
})();

/** Labels only on the hours shown in summary-screen.jpg (every 2h from 11PM). */
const LABEL_AT_INDEX: Readonly<Record<number, string>> = {
  0: '11PM',
  24: '1AM',
  48: '3AM',
  72: '5AM',
  95: '7AM',
};

export function bucketsToTimelineBars(buckets: readonly SessionBucket[]): readonly TimelineBarModel[] {
  return buckets.map((bucket, index) => ({
    id: `bucket-${bucket.bucketStart}`,
    timeLabel: LABEL_AT_INDEX[index] ?? '',
    averageDb: bucket.averageDb,
    peakDb: bucket.peakDb,
  }));
}

export const mockTimelinePeakCallout: TimelinePeakCallout = {
  barId: `bucket-${Date.parse('2024-05-20T23:00:00') + 44 * 5 * 60 * 1000}`,
  label: '68 dB',
};

export type SnippetRowModel = {
  readonly event: SnoreEvent;
  readonly timeLabel: string;
  readonly durationLabel: string;
  readonly lengthLabel: string;
};

export const mockSnippets: readonly SnippetRowModel[] = [
  {
    event: {
      id: 'snip-1',
      sessionId: SESSION_ID,
      timestamp: Date.parse('2024-05-21T03:14:00'),
      durationMs: 10_000,
      peakDb: 68,
      audioPath: 'mock://snippets/0314.m4a',
    },
    timeLabel: '03:14 AM',
    durationLabel: '68 dB - 10 sec',
    lengthLabel: '0:10',
  },
  {
    event: {
      id: 'snip-2',
      sessionId: SESSION_ID,
      timestamp: Date.parse('2024-05-21T02:38:00'),
      durationMs: 8_000,
      peakDb: 63,
      audioPath: 'mock://snippets/0238.m4a',
    },
    timeLabel: '02:38 AM',
    durationLabel: '63 dB - 8 sec',
    lengthLabel: '0:08',
  },
];

export const loudestEpisodeDisplay = {
  timeLabel: '03:14 AM',
  detailLabel: '68 dB - 10 sec',
} as const;
