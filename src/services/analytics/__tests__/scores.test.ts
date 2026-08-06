import { computeSleepScoreV1 } from '@/services/analytics/sleepScore';
import {
  bandForScore,
  computeSnoreScoreV1,
  dotsForScore,
} from '@/services/analytics/snoreScore';
import { aggregateBucketsFromEvents } from '@/services/analytics/buckets';
import type { ScoreInputs, SnoreEvent } from '@/types';
import { TIMELINE_BUCKET_DURATION_MS } from '@/utils';

const quietNight: ScoreInputs = {
  sessionDurationMs: 8 * 60 * 60 * 1000,
  snoreCount: 2,
  totalSnoringMs: 5_000,
  peakDb: 40,
};

const heavyNight: ScoreInputs = {
  sessionDurationMs: 6 * 60 * 60 * 1000,
  snoreCount: 400,
  totalSnoringMs: 2 * 60 * 60 * 1000,
  peakDb: 85,
};

describe('computeSleepScoreV1', () => {
  it('scores a quiet night higher than a heavy night', () => {
    expect(computeSleepScoreV1(quietNight).value).toBeGreaterThan(
      computeSleepScoreV1(heavyNight).value,
    );
  });

  it('clamps to 0–100', () => {
    const value = computeSleepScoreV1(quietNight).value;
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(100);
  });
});

describe('computeSnoreScoreV1', () => {
  it('scores a heavy night worse (higher) than a quiet night', () => {
    expect(computeSnoreScoreV1(heavyNight).value).toBeGreaterThan(
      computeSnoreScoreV1(quietNight).value,
    );
  });

  it('keeps band and dots on the same scale', () => {
    const score = computeSnoreScoreV1(heavyNight);
    expect(bandForScore(score.value)).toBe(score.band);
    expect(dotsForScore(score.value)).toBe(score.filledDots);
  });
});

describe('aggregateBucketsFromEvents', () => {
  it('returns empty for no events', () => {
    expect(aggregateBucketsFromEvents('s1', [], TIMELINE_BUCKET_DURATION_MS)).toEqual([]);
  });

  it('fills quiet gaps between first and last bucket', () => {
    const start = 1_700_000_000_000;
    const events: SnoreEvent[] = [
      {
        id: 'e1',
        sessionId: 's1',
        timestamp: start,
        durationMs: 1000,
        peakDb: 60,
        audioPath: null,
      },
      {
        id: 'e2',
        sessionId: 's1',
        timestamp: start + TIMELINE_BUCKET_DURATION_MS * 2,
        durationMs: 2000,
        peakDb: 70,
        audioPath: null,
      },
    ];
    const buckets = aggregateBucketsFromEvents('s1', events, TIMELINE_BUCKET_DURATION_MS);
    expect(buckets).toHaveLength(3);
    expect(buckets[1]?.peakDb).toBe(0);
    expect(buckets[2]?.peakDb).toBe(70);
  });
});
