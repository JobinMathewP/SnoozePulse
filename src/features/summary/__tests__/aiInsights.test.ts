import { deriveAiInsights } from '@/features/summary/aiInsights';
import type { ScoreBreakdown } from '@/features/summary/scoreBreakdown';
import { colors } from '@/theme';

function breakdown(overrides: Partial<ScoreBreakdown> = {}): ScoreBreakdown {
  return {
    avgConfidence: 0,
    snoringShareByConfidence: 0,
    spectralConsistency: 0,
    episodeRegularity: 0,
    snoringCount: 0,
    snortCount: 0,
    ...overrides,
  };
}

describe('deriveAiInsights', () => {
  it('maps avgConfidence to the AI Accuracy band, dots track confidence', () => {
    expect(deriveAiInsights(breakdown({ avgConfidence: 0.9 })).featured).toMatchObject({
      label: 'AI Accuracy',
      value: 'Excellent',
      dots: 5,
      accent: colors.insightAiAccuracy,
    });
    expect(deriveAiInsights(breakdown({ avgConfidence: 0.65 })).featured.value).toBe('Very good');
    expect(deriveAiInsights(breakdown({ avgConfidence: 0.45 })).featured.value).toBe('Good');
    expect(deriveAiInsights(breakdown({ avgConfidence: 0.3 })).featured.value).toBe('Fair');
    expect(deriveAiInsights(breakdown({ avgConfidence: 0.1 })).featured.value).toBe('Limited');
    expect(deriveAiInsights(breakdown({ avgConfidence: 0 })).featured.dots).toBe(0);
  });

  it('inverts Snoring Level so lower share = more dots (good outcome)', () => {
    const noSnoring = deriveAiInsights(breakdown({ snoringShareByConfidence: 0 }));
    expect(noSnoring.secondary[0]).toMatchObject({
      id: 'snoringLevel',
      value: 'Minimal',
      dots: 5,
      accent: colors.insightSnoringLevel,
    });

    expect(deriveAiInsights(breakdown({ snoringShareByConfidence: 0.05 })).secondary[0]).toMatchObject({
      value: 'Low',
      dots: 4,
    });
    expect(deriveAiInsights(breakdown({ snoringShareByConfidence: 0.2 })).secondary[0]).toMatchObject({
      value: 'Elevated',
      dots: 3,
    });
    expect(deriveAiInsights(breakdown({ snoringShareByConfidence: 0.35 })).secondary[0]).toMatchObject({
      value: 'Moderate',
      dots: 2,
    });
    expect(deriveAiInsights(breakdown({ snoringShareByConfidence: 0.9 })).secondary[0]).toMatchObject({
      value: 'Heavy',
      dots: 1,
    });
  });

  it('maps spectralConsistency to the Pattern band', () => {
    expect(deriveAiInsights(breakdown({ spectralConsistency: 0.9 })).secondary[1]).toMatchObject({
      id: 'pattern',
      value: 'Consistent',
      dots: 5,
      accent: colors.insightPattern,
    });
    expect(deriveAiInsights(breakdown({ spectralConsistency: 0.7 })).secondary[1].value).toBe('Steady');
    expect(deriveAiInsights(breakdown({ spectralConsistency: 0.5 })).secondary[1].value).toBe('Varied');
    expect(deriveAiInsights(breakdown({ spectralConsistency: 0.3 })).secondary[1].value).toBe('Uneven');
    expect(deriveAiInsights(breakdown({ spectralConsistency: 0.1 })).secondary[1].value).toBe('Erratic');
    expect(deriveAiInsights(breakdown({ spectralConsistency: 0 })).secondary[1].dots).toBe(0);
  });

  it('maps episodeRegularity to the Rhythm band', () => {
    expect(deriveAiInsights(breakdown({ episodeRegularity: 0.85 })).secondary[2]).toMatchObject({
      id: 'rhythm',
      value: 'Stable',
      dots: 5,
      accent: colors.insightRhythm,
    });
    expect(deriveAiInsights(breakdown({ episodeRegularity: 0.65 })).secondary[2].value).toBe('Regular');
    expect(deriveAiInsights(breakdown({ episodeRegularity: 0.5 })).secondary[2].value).toBe('Variable');
    expect(deriveAiInsights(breakdown({ episodeRegularity: 0.3 })).secondary[2].value).toBe('Uneven');
    expect(deriveAiInsights(breakdown({ episodeRegularity: 0.1 })).secondary[2].value).toBe('Sparse');
    expect(deriveAiInsights(breakdown({ episodeRegularity: 0 })).secondary[2].dots).toBe(0);
  });

  it('passes through Sound Mix counts unchanged', () => {
    const view = deriveAiInsights(breakdown({ snoringCount: 24, snortCount: 6 }));
    expect(view.soundMix).toEqual({ snoringCount: 24, snortCount: 6 });
  });

  it('secondary insights are returned in a fixed order [snoringLevel, pattern, rhythm]', () => {
    const view = deriveAiInsights(breakdown());
    expect(view.secondary.map((i) => i.id)).toEqual(['snoringLevel', 'pattern', 'rhythm']);
  });
});
