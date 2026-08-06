import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

import { summaryCopy } from './mock';
import { SnoreScoreDots } from './SnoreScoreDots';

type SummaryMetricsStripProps = {
  readonly snoreCount: number;
  readonly snoreScoreLabel: string;
  readonly filledDots: number;
  readonly testID?: string;
};

type ColumnProps = {
  readonly label: string;
  readonly value: string;
  readonly caption?: string;
  readonly valueColor?: string;
  readonly belowValue?: ReactNode;
  readonly showDivider?: boolean;
};

function Column({
  label,
  value,
  caption,
  valueColor = colors.fg,
  belowValue,
  showDivider,
}: ColumnProps) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'stretch' }}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xs / 2,
          paddingVertical: spacing.xs,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            color: colors.fgCaption,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.caption,
            lineHeight: lineHeight.caption,
            textAlign: 'center',
            opacity: 0.65,
            marginBottom: spacing.xs,
          }}
        >
          {label}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
          style={{
            color: valueColor,
            fontFamily: fontFamily.bold,
            fontSize: fontSize.heading,
            lineHeight: lineHeight.heading,
            textAlign: 'center',
            width: '100%',
          }}
        >
          {value}
        </Text>
        {belowValue}
        {caption ? (
          <Text
            numberOfLines={2}
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
              textAlign: 'center',
              marginTop: spacing.xs / 2,
              opacity: 0.55,
            }}
          >
            {caption}
          </Text>
        ) : null}
      </View>
      {showDivider ? (
        <View
          style={{
            width: 1,
            alignSelf: 'center',
            height: '72%',
            backgroundColor: colors.fg,
            opacity: 0.1,
          }}
        />
      ) : null}
    </View>
  );
}

/**
 * Top Summary strip — compact three-column card (~67 dp tall in summary-screen.jpg).
 */
export function SummaryMetricsStrip({
  snoreCount,
  snoreScoreLabel,
  filledDots,
  testID,
}: SummaryMetricsStripProps) {
  return (
    <Card width="full" tone="elevated" corner="md" border="subtle" inset="compact" testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
        <Column
          label={summaryCopy.sleepDurationLabel}
          value={summaryCopy.sleepDurationValue}
          caption={summaryCopy.sleepDurationCaption}
          showDivider
        />
        <Column
          label={summaryCopy.snoreCountLabel}
          value={String(snoreCount)}
          caption={summaryCopy.snoreCountCaption}
          valueColor={colors.alertText}
          showDivider
        />
        <Column
          label={summaryCopy.snoreScoreLabel}
          value={snoreScoreLabel}
          valueColor={colors.warning}
          belowValue={
            <View style={{ marginTop: spacing.xs / 2, alignItems: 'center' }}>
              <SnoreScoreDots filled={filledDots} />
            </View>
          }
        />
      </View>
    </Card>
  );
}
