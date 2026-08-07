import { deriveScoreBreakdown } from '@/features/summary/scoreBreakdown';
import type { SessionSummary, SnoreEvent } from '@/types';

const HOUR = 60 * 60 * 1000;

function buildSummary(
  overrides: Partial<Pick<SessionSummary, 'durationMs' | 'range'>> = {},
): Pick<SessionSummary, 'durationMs' | 'range'> {
  const startedAt = 1_700_000_000_000;
  const endedAt = startedAt + 8 * HOUR;
  return {
    durationMs: overrides.durationMs ?? 8 * HOUR,
    range: overrides.range ?? { startedAt, endedAt },
  };
}

function makeEvent(overrides: Partial<SnoreEvent>): SnoreEvent {
  return {
    id: overrides.id ?? 'e',
    sessionId: 'session-1',
    timestamp: overrides.timestamp ?? 1_700_000_000_000,
    durationMs: overrides.durationMs ?? 3_000,
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

describe('deriveScoreBreakdown', () => {
  it('returns an all-zero breakdown when the session has no events', () => {
    const breakdown = deriveScoreBreakdown([], buildSummary());
    expect(breakdown).toEqual({
      avgConfidence: 0,
      snoringShareByConfidence: 0,
      spectralConsistency: 0,
      episodeRegularity: 0,
      snoringCount: 0,
      snortCount: 0,
    });
  });

  it('averages confidence across episodes and clamps out-of-range values', () => {
    const events = [
      makeEvent({ id: 'a', confidence: 0.4 }),
      makeEvent({ id: 'b', confidence: 0.8 }),
      makeEvent({ id: 'c', confidence: 1.5 }),
      makeEvent({ id: 'd', confidence: -0.1 }),
    ];

    const breakdown = deriveScoreBreakdown(events, buildSummary());

    expect(breakdown.avgConfidence).toBeCloseTo((0.4 + 0.8 + 1 + 0) / 4, 5);
  });

  it('computes confidence-weighted snoring share against session duration', () => {
    const events = [
      makeEvent({ id: 'a', confidence: 0.9, durationMs: 60_000 }),
      makeEvent({ id: 'b', confidence: 0.5, durationMs: 120_000 }),
    ];
    const summary = buildSummary({ durationMs: 60 * 60 * 1000 });

    const breakdown = deriveScoreBreakdown(events, summary);

    const expected = (0.9 * 60_000 + 0.5 * 120_000) / (60 * 60 * 1000);
    expect(breakdown.snoringShareByConfidence).toBeCloseTo(expected, 5);
  });

  it('returns a snoring share of zero when session duration is non-positive', () => {
    const breakdown = deriveScoreBreakdown(
      [makeEvent({ confidence: 0.9, durationMs: 60_000 })],
      { durationMs: 0, range: { startedAt: 0, endedAt: 0 } },
    );
    expect(breakdown.snoringShareByConfidence).toBe(0);
  });

  it('reports zero spectral consistency when fewer than two peaks are available', () => {
    const events = [
      makeEvent({ id: 'a', spectralPeakHz: null }),
      makeEvent({ id: 'b', spectralPeakHz: 210 }),
    ];
    const breakdown = deriveScoreBreakdown(events, buildSummary());
    expect(breakdown.spectralConsistency).toBe(0);
  });

  it('reports high spectral consistency when peaks cluster tightly', () => {
    const events = [
      makeEvent({ id: 'a', spectralPeakHz: 210 }),
      makeEvent({ id: 'b', spectralPeakHz: 214 }),
      makeEvent({ id: 'c', spectralPeakHz: 218 }),
    ];
    const breakdown = deriveScoreBreakdown(events, buildSummary());
    expect(breakdown.spectralConsistency).toBeGreaterThan(0.95);
  });

  it('reports low spectral consistency when peaks are dispersed', () => {
    const events = [
      makeEvent({ id: 'a', spectralPeakHz: 100 }),
      makeEvent({ id: 'b', spectralPeakHz: 400 }),
      makeEvent({ id: 'c', spectralPeakHz: 900 }),
    ];
    const breakdown = deriveScoreBreakdown(events, buildSummary());
    expect(breakdown.spectralConsistency).toBeLessThan(0.5);
  });

  it('rewards evenly spaced episodes with high regularity', () => {
    const summary = buildSummary();
    const start = summary.range.startedAt;
    const step = summary.durationMs / 5;
    const events = [
      makeEvent({ id: 'a', timestamp: start + step }),
      makeEvent({ id: 'b', timestamp: start + step * 2 }),
      makeEvent({ id: 'c', timestamp: start + step * 3 }),
      makeEvent({ id: 'd', timestamp: start + step * 4 }),
    ];
    const breakdown = deriveScoreBreakdown(events, summary);
    expect(breakdown.episodeRegularity).toBeGreaterThan(0.8);
  });

  it('punishes bursty episode clusters with low regularity', () => {
    const summary = buildSummary();
    const start = summary.range.startedAt;
    const events = [
      makeEvent({ id: 'a', timestamp: start + 30_000 }),
      makeEvent({ id: 'b', timestamp: start + 30_500 }),
      makeEvent({ id: 'c', timestamp: start + 31_000 }),
      makeEvent({ id: 'd', timestamp: start + 31_500 }),
    ];
    const breakdown = deriveScoreBreakdown(events, summary);
    expect(breakdown.episodeRegularity).toBeLessThan(0.5);
  });

  it('counts snoring and snort classes independently', () => {
    const events = [
      makeEvent({ id: 'a', classLabel: 'snoring' }),
      makeEvent({ id: 'b', classLabel: 'snort' }),
      makeEvent({ id: 'c', classLabel: 'snoring' }),
      makeEvent({ id: 'd', classLabel: 'snort' }),
      makeEvent({ id: 'e', classLabel: 'snoring' }),
    ];
    const breakdown = deriveScoreBreakdown(events, buildSummary());
    expect(breakdown.snoringCount).toBe(3);
    expect(breakdown.snortCount).toBe(2);
  });
});
