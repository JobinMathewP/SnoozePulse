import { Text, View } from 'react-native';

import { Card, SectionHeader } from '@/components/ui';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

import { scoreBreakdownCopy } from './format';
import type { ScoreBreakdown } from './scoreBreakdown';

type ScoreBreakdownCardProps = {
  readonly breakdown: ScoreBreakdown;
  readonly testID?: string;
};

/**
 * Task 6.7 — V2 score breakdown for the Summary screen. Reads confidence-weighted
 * inputs (per ADR-26) plus class distribution off the persisted `SnoreEvent`s. Uses only
 * existing primitives (`Card`, `SectionHeader`) and theme tokens; full visual polish is
 * Task 6.8.
 */
export function ScoreBreakdownCard({
  breakdown,
  testID,
}: ScoreBreakdownCardProps) {
  const rows: readonly { readonly label: string; readonly value: string }[] = [
    {
      label: scoreBreakdownCopy.avgConfidenceLabel,
      value: formatPercent(breakdown.avgConfidence),
    },
    {
      label: scoreBreakdownCopy.snoringShareLabel,
      value: formatPercent(breakdown.snoringShareByConfidence),
    },
    {
      label: scoreBreakdownCopy.spectralConsistencyLabel,
      value: formatQuality(breakdown.spectralConsistency),
    },
    {
      label: scoreBreakdownCopy.episodeRegularityLabel,
      value: formatQuality(breakdown.episodeRegularity),
    },
  ];

  return (
    <Card
      tone="elevated"
      corner="md"
      border="subtle"
      inset="compact"
      style={{ gap: spacing.xs }}
      testID={testID}
    >
      <SectionHeader title={scoreBreakdownCopy.title} />
      <View style={{ gap: spacing.xs }}>
        {rows.map((row) => (
          <View
            key={row.label}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <Text
              style={{
                flexShrink: 1,
                color: colors.fgCaption,
                fontFamily: fontFamily.regular,
                fontSize: fontSize.body,
                lineHeight: lineHeight.body,
              }}
            >
              {row.label}
            </Text>
            <Text
              style={{
                color: colors.fg,
                fontFamily: fontFamily.semibold,
                fontSize: fontSize.body,
                lineHeight: lineHeight.body,
              }}
            >
              {row.value}
            </Text>
          </View>
        ))}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: spacing.sm,
            marginTop: spacing.xs,
          }}
        >
          <Text
            style={{
              flexShrink: 1,
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.body,
              lineHeight: lineHeight.body,
            }}
          >
            {scoreBreakdownCopy.classDistributionLabel}
          </Text>
          <Text
            style={{
              color: colors.fg,
              fontFamily: fontFamily.semibold,
              fontSize: fontSize.body,
              lineHeight: lineHeight.body,
            }}
            accessibilityLabel={`${breakdown.snoringCount} snoring, ${breakdown.snortCount} snort`}
          >
            {formatClassDistribution(breakdown.snoringCount, breakdown.snortCount)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/**
 * Consistency and regularity read most naturally as high/medium/low quality labels rather
 * than raw ratios. Bands mirror the halves-of-half heuristic used elsewhere on Summary.
 */
function formatQuality(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return scoreBreakdownCopy.qualityUnavailable;
  }
  if (value >= 0.75) {
    return scoreBreakdownCopy.qualityHigh;
  }
  if (value >= 0.5) {
    return scoreBreakdownCopy.qualityMedium;
  }
  return scoreBreakdownCopy.qualityLow;
}

function formatClassDistribution(snoring: number, snort: number): string {
  if (snoring === 0 && snort === 0) {
    return scoreBreakdownCopy.classDistributionEmpty;
  }
  return `${snoring} · ${snort}`;
}
