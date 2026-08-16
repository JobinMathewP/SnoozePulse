import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

import { historyCopy } from './models';

type InsightsCardProps = {
  readonly testID?: string;
};

/**
 * Static snoring-tips card — lightbulb, title, general guidance. Non-tappable on purpose
 * (ADR-30): SnoozePulse does not generate personalized medical insights, so this must not
 * look like a link to a deeper analysis that does not exist (App Store Guideline 2.1).
 */
export function InsightsCard({ testID }: InsightsCardProps) {
  return (
    <Card
      width="full"
      tone="elevated"
      corner="md"
      border="subtle"
      inset="compact"
      testID={testID}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Ionicons
          accessibilityElementsHidden
          importantForAccessibility="no"
          name="bulb-outline"
          size={fontSize.heading}
          color={colors.warning}
        />
        <View style={{ flex: 1, gap: spacing.xs / 2, minWidth: 0 }}>
          <Text
            style={{
              color: colors.fg,
              fontFamily: fontFamily.semibold,
              fontSize: fontSize.bodyLg,
              lineHeight: lineHeight.bodyLg,
            }}
          >
            {historyCopy.insightsTitle}
          </Text>
          <Text
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.body,
              lineHeight: lineHeight.body,
            }}
          >
            {historyCopy.insightsBody}
          </Text>
        </View>
      </View>
    </Card>
  );
}
