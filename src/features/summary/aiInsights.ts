import { colors } from '@/theme';

import type { ScoreBreakdown } from './scoreBreakdown';

/**
 * AI Insights derivation — translates the raw score-breakdown numbers into the five
 * user-facing insight cards on the Summary screen. Everything is pure and colocated with
 * the UI so services/repositories stay untouched (Task 6.8 scope).
 *
 * Band convention across every metric: **more dots = better outcome for the sleeper**.
 * That means the direction sometimes flips against the raw metric (e.g. "Snoring Level:
 * Minimal" is 5 dots because low snoring is desirable), matching the reference where "Low"
 * shows 4 green dots — a very-good outcome. See the discussion in the Task 6.8 chat.
 */

export type AiInsightId =
  | 'aiAccuracy'
  | 'snoringLevel'
  | 'pattern'
  | 'rhythm';

export interface AiInsight {
  readonly id: AiInsightId;
  readonly label: string;
  readonly value: string;
  /** 0–5 filled dots. */
  readonly dots: number;
  /** Accent colour for the label text + icon glow + dot fill. */
  readonly accent: string;
}

export interface SoundMix {
  readonly snoringCount: number;
  readonly snortCount: number;
}

export interface AiInsightsView {
  readonly featured: AiInsight;
  readonly secondary: readonly [AiInsight, AiInsight, AiInsight];
  readonly soundMix: SoundMix;
}

/**
 * Fixed labels sorted from most positive (highest dot count) to least. The mapping
 * functions below pick which one applies given the raw metric.
 */
const AI_ACCURACY_BANDS = [
  { label: 'Excellent', dots: 5 },
  { label: 'Very good', dots: 4 },
  { label: 'Good', dots: 3 },
  { label: 'Fair', dots: 2 },
  { label: 'Limited', dots: 1 },
  { label: '—', dots: 0 },
] as const;

const SNORING_LEVEL_BANDS = [
  { label: 'Minimal', dots: 5 },
  { label: 'Low', dots: 4 },
  { label: 'Elevated', dots: 3 },
  { label: 'Moderate', dots: 2 },
  { label: 'Heavy', dots: 1 },
] as const;

const PATTERN_BANDS = [
  { label: 'Consistent', dots: 5 },
  { label: 'Steady', dots: 4 },
  { label: 'Varied', dots: 3 },
  { label: 'Uneven', dots: 2 },
  { label: 'Erratic', dots: 1 },
  { label: '—', dots: 0 },
] as const;

const RHYTHM_BANDS = [
  { label: 'Stable', dots: 5 },
  { label: 'Regular', dots: 4 },
  { label: 'Variable', dots: 3 },
  { label: 'Uneven', dots: 2 },
  { label: 'Sparse', dots: 1 },
  { label: '—', dots: 0 },
] as const;

function accuracyBand(avgConfidence: number): { label: string; dots: number } {
  if (avgConfidence >= 0.8) return AI_ACCURACY_BANDS[0];
  if (avgConfidence >= 0.6) return AI_ACCURACY_BANDS[1];
  if (avgConfidence >= 0.4) return AI_ACCURACY_BANDS[2];
  if (avgConfidence >= 0.2) return AI_ACCURACY_BANDS[3];
  if (avgConfidence > 0) return AI_ACCURACY_BANDS[4];
  return AI_ACCURACY_BANDS[5];
}

/**
 * Snoring severity is a bad-is-more metric so we invert it for the dot count.
 * Thresholds chosen to keep a typical light-sleep night in "Low" or "Minimal" and a heavy
 * snorer in the low-dot bands.
 */
function snoringLevelBand(share: number): { label: string; dots: number } {
  if (share >= 0.5) return SNORING_LEVEL_BANDS[4]; // Heavy
  if (share >= 0.3) return SNORING_LEVEL_BANDS[3]; // Moderate
  if (share >= 0.15) return SNORING_LEVEL_BANDS[2]; // Elevated
  if (share >= 0.03) return SNORING_LEVEL_BANDS[1]; // Low
  return SNORING_LEVEL_BANDS[0]; // Minimal
}

function patternBand(spectralConsistency: number): { label: string; dots: number } {
  if (spectralConsistency >= 0.8) return PATTERN_BANDS[0];
  if (spectralConsistency >= 0.6) return PATTERN_BANDS[1];
  if (spectralConsistency >= 0.4) return PATTERN_BANDS[2];
  if (spectralConsistency >= 0.2) return PATTERN_BANDS[3];
  if (spectralConsistency > 0) return PATTERN_BANDS[4];
  return PATTERN_BANDS[5];
}

function rhythmBand(episodeRegularity: number): { label: string; dots: number } {
  if (episodeRegularity >= 0.8) return RHYTHM_BANDS[0];
  if (episodeRegularity >= 0.6) return RHYTHM_BANDS[1];
  if (episodeRegularity >= 0.4) return RHYTHM_BANDS[2];
  if (episodeRegularity >= 0.2) return RHYTHM_BANDS[3];
  if (episodeRegularity > 0) return RHYTHM_BANDS[4];
  return RHYTHM_BANDS[5];
}

export const AI_INSIGHTS_COPY = {
  header: 'AI Insights',
  aiAccuracyLabel: 'AI Accuracy',
  snoringLevelLabel: 'Snoring Level',
  patternLabel: 'Pattern',
  rhythmLabel: 'Rhythm',
  soundMixLabel: 'Sound Mix',
  snoresSuffix: 'Snores',
  snortsSuffix: 'Snorts',
} as const;

export function deriveAiInsights(breakdown: ScoreBreakdown): AiInsightsView {
  const accuracy = accuracyBand(breakdown.avgConfidence);
  const snoring = snoringLevelBand(breakdown.snoringShareByConfidence);
  const pattern = patternBand(breakdown.spectralConsistency);
  const rhythm = rhythmBand(breakdown.episodeRegularity);

  return {
    featured: {
      id: 'aiAccuracy',
      label: AI_INSIGHTS_COPY.aiAccuracyLabel,
      value: accuracy.label,
      dots: accuracy.dots,
      accent: colors.insightAiAccuracy,
    },
    secondary: [
      {
        id: 'snoringLevel',
        label: AI_INSIGHTS_COPY.snoringLevelLabel,
        value: snoring.label,
        dots: snoring.dots,
        accent: colors.insightSnoringLevel,
      },
      {
        id: 'pattern',
        label: AI_INSIGHTS_COPY.patternLabel,
        value: pattern.label,
        dots: pattern.dots,
        accent: colors.insightPattern,
      },
      {
        id: 'rhythm',
        label: AI_INSIGHTS_COPY.rhythmLabel,
        value: rhythm.label,
        dots: rhythm.dots,
        accent: colors.insightRhythm,
      },
    ],
    soundMix: {
      snoringCount: breakdown.snoringCount,
      snortCount: breakdown.snortCount,
    },
  };
}
