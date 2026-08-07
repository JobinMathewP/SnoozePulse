import { aggregateBucketsFromEvents } from '@/services/analytics/buckets';
import { deriveScoreInputs } from '@/services/analytics/scoreInputs';
import { computeSleepScoreV1 } from '@/services/analytics/sleepScore';
import { computeSleepScoreV2 } from '@/services/analytics/sleepScoreV2';
import {
  bandForScore,
  computeSnoreScoreV1,
  dotsForScore,
} from '@/services/analytics/snoreScore';
import {
  bandForScoreV2,
  computeSnoreScoreV2,
  dotsForScoreV2,
} from '@/services/analytics/snoreScoreV2';
import type { ScoreInputs, SnoreEvent } from '@/types';
import { TIMELINE_BUCKET_DURATION_MS } from '@/utils';

const quietNightV1Only: Omit<
  ScoreInputs,
  'avgConfidence' | 'snoringShareByConfidence' | 'spectralConsistency' | 'episodeRegularity'
> = {
  sessionDurationMs: 8 * 60 * 60 * 1000,
  snoreCount: 2,
  totalSnoringMs: 5_000,
  peakDb: 40,
};

const heavyNightV1Only: Omit<
  ScoreInputs,
  'avgConfidence' | 'snoringShareByConfidence' | 'spectralConsistency' | 'episodeRegularity'
> = {
  sessionDurationMs: 6 * 60 * 60 * 1000,
  snoreCount: 400,
  totalSnoringMs: 2 * 60 * 60 * 1000,
  peakDb: 85,
};

/** V2 fields wired for the quiet night: low confidence, mostly silent, regular. */
const quietNight: ScoreInputs = {
  ...quietNightV1Only,
  avgConfidence: 0.6,
  snoringShareByConfidence: 5_000 / (8 * 60 * 60 * 1000),
  spectralConsistency: 0.5,
  episodeRegularity: 1,
};

/** V2 fields wired for the heavy night: high confidence, big share, chaotic. */
const heavyNight: ScoreInputs = {
  ...heavyNightV1Only,
  avgConfidence: 0.9,
  snoringShareByConfidence: (2 * 60 * 60 * 1000) / (6 * 60 * 60 * 1000),
  spectralConsistency: 0.5,
  episodeRegularity: 0.2,
};

describe('computeSleepScoreV1 (archival)', () => {
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

describe('computeSnoreScoreV1 (archival)', () => {
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

describe('computeSleepScoreV2', () => {
  it('scores a quiet night higher than a heavy night', () => {
    expect(computeSleepScoreV2(quietNight).value).toBeGreaterThan(
      computeSleepScoreV2(heavyNight).value,
    );
  });

  it('clamps to 0–100', () => {
    for (const inputs of [quietNight, heavyNight]) {
      const value = computeSleepScoreV2(inputs).value;
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it('rewards regularity: two nights with identical totals score differently by rhythm', () => {
    const chaotic = computeSleepScoreV2({ ...quietNight, episodeRegularity: 0 }).value;
    const regular = computeSleepScoreV2({ ...quietNight, episodeRegularity: 1 }).value;
    expect(regular).toBeGreaterThan(chaotic);
  });

  it('is unmoved by peakDb (V1 signal only)', () => {
    const loud = computeSleepScoreV2({ ...quietNight, peakDb: 95 }).value;
    const soft = computeSleepScoreV2({ ...quietNight, peakDb: 20 }).value;
    expect(loud).toBe(soft);
  });
});

describe('computeSnoreScoreV2', () => {
  it('scores a heavy night worse (higher) than a quiet night', () => {
    expect(computeSnoreScoreV2(heavyNight).value).toBeGreaterThan(
      computeSnoreScoreV2(quietNight).value,
    );
  });

  it('keeps band and dots on the V2 scale', () => {
    const score = computeSnoreScoreV2(heavyNight);
    expect(bandForScoreV2(score.value)).toBe(score.band);
    expect(dotsForScoreV2(score.value)).toBe(score.filledDots);
  });

  it('penalizes high average confidence at the same episode count', () => {
    const low = computeSnoreScoreV2({ ...heavyNight, avgConfidence: 0.2 }).value;
    const high = computeSnoreScoreV2({ ...heavyNight, avgConfidence: 0.95 }).value;
    expect(high).toBeGreaterThan(low);
  });

  it('is unmoved by peakDb (V1 signal only)', () => {
    const loud = computeSnoreScoreV2({ ...heavyNight, peakDb: 95 }).value;
    const soft = computeSnoreScoreV2({ ...heavyNight, peakDb: 20 }).value;
    expect(loud).toBe(soft);
  });
});

describe('deriveScoreInputs', () => {
  const sessionDurationMs = 4 * 60 * 60 * 1000;
  const totals = {
    sessionDurationMs,
    snoreCount: 3,
    totalSnoringMs: 12_000,
    peakDb: 62,
  };

  const evenly: readonly SnoreEvent[] = [
    makeEvent('e1', 1_000_000, 4_000, 0.8),
    makeEvent('e2', 2_000_000, 4_000, 0.9),
    makeEvent('e3', 3_000_000, 4_000, 0.7),
  ];

  it('returns zeroed M6 fields when there are no events', () => {
    const inputs = deriveScoreInputs(totals, []);
    expect(inputs.avgConfidence).toBe(0);
    expect(inputs.snoringShareByConfidence).toBe(0);
    // Neutral defaults keep the score stable until spectral analysis / more episodes exist.
    expect(inputs.spectralConsistency).toBe(0.5);
    expect(inputs.episodeRegularity).toBe(1);
  });

  it('averages confidence across episodes', () => {
    const inputs = deriveScoreInputs(totals, evenly);
    expect(inputs.avgConfidence).toBeCloseTo((0.8 + 0.9 + 0.7) / 3, 5);
  });

  it('weights snoring share by confidence, not by raw duration', () => {
    const inputs = deriveScoreInputs(totals, evenly);
    const weighted = (4_000 * 0.8 + 4_000 * 0.9 + 4_000 * 0.7) / sessionDurationMs;
    expect(inputs.snoringShareByConfidence).toBeCloseTo(weighted, 6);
  });

  it('rates evenly-spaced episodes as more regular than chaotic ones', () => {
    const chaotic: readonly SnoreEvent[] = [
      makeEvent('c1', 1_000_000, 500, 0.9),
      makeEvent('c2', 1_050_000, 500, 0.9),
      makeEvent('c3', 3_000_000, 500, 0.9),
    ];
    const evenlyInputs = deriveScoreInputs(totals, evenly);
    const chaoticInputs = deriveScoreInputs(totals, chaotic);
    expect(evenlyInputs.episodeRegularity).toBeGreaterThan(
      chaoticInputs.episodeRegularity,
    );
  });
});

describe('aggregateBucketsFromEvents', () => {
  it('returns empty for no events', () => {
    expect(aggregateBucketsFromEvents('s1', [], TIMELINE_BUCKET_DURATION_MS)).toEqual([]);
  });

  it('fills quiet gaps between first and last bucket', () => {
    const start = 1_700_000_000_000;
    const events: SnoreEvent[] = [
      makeEvent('e1', start, 1000, 0.8, 60),
      makeEvent('e2', start + TIMELINE_BUCKET_DURATION_MS * 2, 2000, 0.8, 70),
    ];
    const buckets = aggregateBucketsFromEvents('s1', events, TIMELINE_BUCKET_DURATION_MS);
    expect(buckets).toHaveLength(3);
    expect(buckets[1]?.peakDb).toBe(0);
    expect(buckets[2]?.peakDb).toBe(70);
  });
});

function makeEvent(
  id: string,
  timestamp: number,
  durationMs: number,
  confidence: number,
  peakDb = 55,
): SnoreEvent {
  return {
    id,
    sessionId: 's1',
    timestamp,
    durationMs,
    peakDb,
    audioPath: null,
    confidence,
    classLabel: 'snoring',
    spectralPeakHz: null,
  };
}
