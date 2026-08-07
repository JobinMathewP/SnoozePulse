import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

import { historyCopy, type ComparisonRowModel } from './models';

type WeeklyComparisonCardProps = {
  readonly rows: readonly ComparisonRowModel[];
  readonly previousLegend: string;
  readonly currentLegend: string;
  readonly testID?: string;
};

const valueColor = (
  token: ComparisonRowModel['previousColor'] | ComparisonRowModel['currentColor'],
): string => {
  switch (token) {
    case 'warning':
      return colors.warning;
    case 'successText':
      return colors.successText;
    case 'alertText':
      return colors.alertText;
    case 'fg':
    default:
      return colors.fg;
  }
};

/**
 * Weekly Comparison table from history-screen.jpg — legend + three delta rows.
 */
export function WeeklyComparisonCard({
  rows,
  previousLegend,
  currentLegend,
  testID,
}: WeeklyComparisonCardProps) {
  return (
    <Card width="full" tone="elevated" corner="md" border="subtle" inset="compact" testID={testID}>
      <Text
        style={{
          color: colors.fg,
          fontFamily: fontFamily.semibold,
          fontSize: fontSize.bodyLg,
          lineHeight: lineHeight.bodyLg,
          marginBottom: spacing.sm,
        }}
      >
        {historyCopy.comparisonTitle}
      </Text>

      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <View
            style={{
              width: spacing.sm,
              height: spacing.sm,
              borderRadius: spacing.xs,
              backgroundColor: colors.fgCaption,
              opacity: 0.55,
            }}
          />
          <Text
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
            }}
          >
            {previousLegend}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <View
            style={{
              width: spacing.sm,
              height: spacing.sm,
              borderRadius: spacing.xs,
              backgroundColor: colors.primary,
            }}
          />
          <Text
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
            }}
          >
            {currentLegend}
          </Text>
        </View>
      </View>

      {rows.map((row, index) => (
        <View
          key={row.id}
          style={{
            paddingVertical: spacing.sm,
            borderTopWidth: index === 0 ? 0 : 1,
            borderTopColor: colors.borderCardSubtle,
          }}
        >
          <Text
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
              opacity: 0.7,
              marginBottom: spacing.xs,
            }}
          >
            {row.label}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minWidth: 0 }}>
              <Text
                style={{
                  color: valueColor(row.previousColor),
                  fontFamily: fontFamily.semibold,
                  fontSize: fontSize.body,
                  lineHeight: lineHeight.body,
                }}
              >
                {row.previousLabel}
              </Text>
              <Ionicons
                accessibilityElementsHidden
                importantForAccessibility="no"
                name="arrow-forward"
                size={fontSize.body}
                color={colors.fgCaption}
              />
              <Text
                style={{
                  color: valueColor(row.currentColor),
                  fontFamily: fontFamily.semibold,
                  fontSize: fontSize.body,
                  lineHeight: lineHeight.body,
                }}
              >
                {row.currentLabel}
              </Text>
            </View>
            <Text
              style={{
                color: row.deltaPositive ? colors.successText : colors.alertText,
                fontFamily: fontFamily.semibold,
                fontSize: fontSize.body,
                lineHeight: lineHeight.body,
              }}
            >
              {row.deltaLabel}
            </Text>
          </View>
        </View>
      ))}
    </Card>
  );
}
