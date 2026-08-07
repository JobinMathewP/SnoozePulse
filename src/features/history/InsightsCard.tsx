import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

import { historyCopy } from './models';

type InsightsCardProps = {
  readonly onPress: () => void;
  readonly testID?: string;
};

/**
 * Tappable Insights row from history-screen.jpg — lightbulb, copy, chevron.
 */
export function InsightsCard({ onPress, testID }: InsightsCardProps) {
  return (
    <Card
      width="full"
      tone="elevated"
      corner="md"
      border="subtle"
      inset="compact"
      onPress={onPress}
      accessibilityLabel={historyCopy.insightsAccessibilityLabel}
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
        <Ionicons
          accessibilityElementsHidden
          importantForAccessibility="no"
          name="chevron-forward"
          size={fontSize.bodyLg}
          color={colors.fgCaption}
        />
      </View>
    </Card>
  );
}
