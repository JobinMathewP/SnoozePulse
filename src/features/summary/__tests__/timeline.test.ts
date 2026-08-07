import {
  barIndexFromBarId,
  deriveTimelineFromSession,
  loudestEventInBar,
  TIMELINE_MIN_BUCKET_MS,
  TIMELINE_TARGET_BARS,
} from '@/features/summary/timeline';
import type { SessionSummary, SnoreEvent } from '@/types';

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const SECOND = 1_000;

function makeEvent(overrides: Partial<SnoreEvent>): SnoreEvent {
  return {
    id: overrides.id ?? 'e',
    sessionId: 'session-1',
    timestamp: overrides.timestamp ?? 0,
    durationMs: overrides.durationMs ?? 3 * SECOND,
    peakDb: overrides.peakDb ?? 55,
    confidence: overrides.confidence ?? 0.7,
    classLabel: overrides.classLabel ?? 'snoring',
    spectralPeakHz:
      'spectralPeakHz' in overrides
        ? (overrides.spectralPeakHz as number | null)
        : 220,
    audioPath: overrides.audioPath ?? null,
  };
}

function makeSummary(overrides: {
  readonly startedAt: number;
  readonly endedAt: number | null;
  readonly peakAt?: number | null;
  readonly peakDb?: number;
}): Pick<SessionSummary, 'range' | 'peakAt' | 'peakDb'> {
  return {
    range: { startedAt: overrides.startedAt, endedAt: overrides.endedAt },
    peakAt: overrides.peakAt ?? null,
    peakDb: overrides.peakDb ?? 0,
  };
}

describe('deriveTimelineFromSession', () => {
  it('returns no bars for a zero-length range', () => {
    const summary = makeSummary({ startedAt: 1_000_000, endedAt: 1_000_000 });
    const result = deriveTimelineFromSession([], summary);
    expect(result.bars).toEqual([]);
    expect(result.peakCallout).toBeUndefined();
  });

  it('renders 60 bars covering the entire range for a long night session', () => {
    const startedAt = new Date(2026, 7, 8, 23, 0, 0).getTime();
    const endedAt = startedAt + 8 * HOUR;
    const summary = makeSummary({ startedAt, endedAt });

    const result = deriveTimelineFromSession([], summary);

    expect(result.bars.length).toBe(TIMELINE_TARGET_BARS);
    expect(result.firstBucketStart).toBe(startedAt);
    expect(result.bucketDurationMs).toBe(Math.ceil((8 * HOUR) / 60));
    expect(result.bars.every((bar) => bar.peakDb === 0)).toBe(true);
  });

  it('still renders many bars for a very short session by using the minimum bucket', () => {
    const startedAt = 1_700_000_000_000;
    const endedAt = startedAt + 30 * SECOND;
    const summary = makeSummary({ startedAt, endedAt });

    const result = deriveTimelineFromSession([], summary);

    expect(result.bucketDurationMs).toBe(TIMELINE_MIN_BUCKET_MS);
    expect(result.bars.length).toBeGreaterThanOrEqual(30);
    expect(result.bars.length).toBeLessThanOrEqual(TIMELINE_TARGET_BARS);
  });

  it('credits an event to every bar its duration overlaps', () => {
    const startedAt = 1_700_000_000_000;
    const endedAt = startedAt + 30 * SECOND;
    const summary = makeSummary({
      startedAt,
      endedAt,
      peakAt: startedAt + 5 * SECOND,
      peakDb: 72,
    });
    const events: readonly SnoreEvent[] = [
      makeEvent({
        id: 'ev-1',
        timestamp: startedAt + 5 * SECOND,
        durationMs: 4 * SECOND,
        peakDb: 72,
      }),
    ];

    const result = deriveTimelineFromSession(events, summary);
    const bucketMs = result.bucketDurationMs;
    const barsWithSnore = result.bars.filter((bar) => bar.peakDb > 0);
    expect(barsWithSnore.length).toBeGreaterThanOrEqual(
      Math.floor((4 * SECOND) / bucketMs),
    );
    for (const bar of barsWithSnore) {
      expect(bar.peakDb).toBe(72);
    }
  });

  it('places the peak callout on the bar containing summary.peakAt', () => {
    const startedAt = 1_700_000_000_000;
    const endedAt = startedAt + 60 * SECOND;
    const peakAt = startedAt + 30 * SECOND;
    const summary = makeSummary({
      startedAt,
      endedAt,
      peakAt,
      peakDb: 68,
    });

    const result = deriveTimelineFromSession([], summary);
    expect(result.peakCallout).toBeDefined();
    expect(result.peakCallout?.label).toBe('68 dB');
    const expectedIndex = Math.floor(
      (peakAt - startedAt) / result.bucketDurationMs,
    );
    expect(result.peakCallout?.barId).toBe(`bar-${expectedIndex}`);
  });

  it('labels roughly five bars across the strip in HHAM/HHPM for long sessions', () => {
    const startedAt = new Date(2026, 7, 8, 23, 0, 0).getTime();
    const endedAt = startedAt + 8 * HOUR;
    const summary = makeSummary({ startedAt, endedAt });

    const result = deriveTimelineFromSession([], summary);
    const labelled = result.bars.filter((bar) => bar.timeLabel.length > 0);
    expect(labelled.length).toBeGreaterThanOrEqual(4);
    expect(labelled.length).toBeLessThanOrEqual(5);
    for (const bar of labelled) {
      expect(bar.timeLabel).toMatch(/^(1[0-2]|[1-9])(AM|PM)$/);
    }
  });

  it('always uses 12 h HHAM/HHPM labels regardless of session length', () => {
    const startedAt = new Date(2026, 7, 8, 23, 30, 0).getTime();
    const endedAt = startedAt + 30 * MINUTE;
    const summary = makeSummary({ startedAt, endedAt });

    const result = deriveTimelineFromSession([], summary);
    const labels = result.bars
      .filter((bar) => bar.timeLabel.length > 0)
      .map((bar) => bar.timeLabel);
    expect(labels.length).toBeGreaterThan(0);
    for (const label of labels) {
      expect(label).toMatch(/^(1[0-2]|[1-9])(AM|PM)$/);
    }
  });

  it('always labels both endpoints even when the session sits in a single clock hour', () => {
    const startedAt = new Date(2026, 7, 8, 2, 44, 0).getTime();
    const endedAt = startedAt + 2 * MINUTE;
    const summary = makeSummary({ startedAt, endedAt });

    const result = deriveTimelineFromSession([], summary);
    const labelledBars = result.bars.filter((bar) => bar.timeLabel.length > 0);
    const firstBar = result.bars[0];
    const lastBar = result.bars[result.bars.length - 1];
    expect(firstBar?.timeLabel).toBe('2AM');
    expect(lastBar?.timeLabel).toBe('2AM');
    expect(labelledBars.length).toBe(2);
  });

  it('suppresses duplicate interior labels while keeping endpoints', () => {
    const startedAt = new Date(2026, 7, 8, 23, 0, 0).getTime();
    const endedAt = startedAt + 8 * HOUR;
    const summary = makeSummary({ startedAt, endedAt });

    const result = deriveTimelineFromSession([], summary);
    const labels = result.bars
      .filter((bar) => bar.timeLabel.length > 0)
      .map((bar) => bar.timeLabel);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels[0]).toBe('11PM');
    expect(labels[labels.length - 1]).toBe('7AM');
  });
});

describe('barIndexFromBarId', () => {
  it('parses bar-N ids back to N', () => {
    expect(barIndexFromBarId('bar-0')).toBe(0);
    expect(barIndexFromBarId('bar-42')).toBe(42);
  });

  it('rejects malformed ids', () => {
    expect(barIndexFromBarId('bucket-100')).toBeNull();
    expect(barIndexFromBarId('bar-abc')).toBeNull();
    expect(barIndexFromBarId('bar--1')).toBeNull();
  });
});

describe('loudestEventInBar', () => {
  const startedAt = 1_700_000_000_000;
  const bucketMs = 5 * SECOND;

  it('returns null when no event overlaps the bar window', () => {
    expect(loudestEventInBar([], startedAt, bucketMs, 3)).toBeNull();
  });

  it('picks the loudest overlapping event when several exist', () => {
    const events: readonly SnoreEvent[] = [
      makeEvent({ id: 'a', timestamp: startedAt, durationMs: 6 * SECOND, peakDb: 50 }),
      makeEvent({ id: 'b', timestamp: startedAt + 2 * SECOND, durationMs: 4 * SECOND, peakDb: 70 }),
      makeEvent({ id: 'c', timestamp: startedAt + 30 * SECOND, durationMs: 1 * SECOND, peakDb: 90 }),
    ];
    const found = loudestEventInBar(events, startedAt, bucketMs, 0);
    expect(found?.id).toBe('b');
  });

  it('excludes events that end exactly at the bar start', () => {
    const events: readonly SnoreEvent[] = [
      makeEvent({
        id: 'edge',
        timestamp: startedAt,
        durationMs: 5 * SECOND,
        peakDb: 80,
      }),
    ];
    expect(loudestEventInBar(events, startedAt, bucketMs, 1)).toBeNull();
  });
});
