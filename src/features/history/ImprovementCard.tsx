import { Text, View } from 'react-native';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';

import { Card } from '@/components/ui';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

import { historyCopy } from './models';

type ImprovementCardProps = {
  readonly percentLabel: string | null;
  readonly sparkline: readonly number[];
  readonly testID?: string;
};

/**
 * “You're improving!” card with green percent and upward sparkline (history-screen.jpg).
 */
export function ImprovementCard({ percentLabel, sparkline, testID }: ImprovementCardProps) {
  const width = spacing.xl * 3 + spacing.md;
  const height = spacing.xl + spacing.md;
  const points = sparkline.length > 0 ? sparkline : [0.3, 0.35, 0.4];
  const coords = points
    .map((y, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * (width - spacing.sm);
      const py = height - y * (height - spacing.sm) - spacing.xs;
      return `${x},${py}`;
    })
    .join(' ');
  const last = points[points.length - 1] ?? 0;
  const lastX = width - spacing.sm;
  const lastY = height - last * (height - spacing.sm) - spacing.xs;

  return (
    <Card width="full" tone="elevated" corner="md" border="subtle" inset="compact" testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
          <Text
            style={{
              color: colors.fg,
              fontFamily: fontFamily.semibold,
              fontSize: fontSize.bodyLg,
              lineHeight: lineHeight.bodyLg,
            }}
          >
            {historyCopy.improvementTitle}
          </Text>
          <Text
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.body,
              lineHeight: lineHeight.body,
            }}
          >
            {percentLabel ? (
              <>
                {historyCopy.improvementPrefix}
                <Text
                  style={{
                    color: colors.successText,
                    fontFamily: fontFamily.bold,
                    fontSize: fontSize.title,
                    lineHeight: lineHeight.title,
                  }}
                >
                  {percentLabel}
                </Text>
                {historyCopy.improvementSuffix}
              </>
            ) : (
              historyCopy.improvementNeutral
            )}
          </Text>
        </View>

        <Svg
          width={width}
          height={height}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          <Polyline
            points={coords}
            fill="none"
            stroke={colors.successText}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx={lastX} cy={lastY} r={3} fill={colors.successText} />
          <Path
            d={`M ${lastX - 4} ${lastY + 2} L ${lastX} ${lastY - 4} L ${lastX + 4} ${lastY + 2}`}
            fill={colors.successText}
          />
        </Svg>
      </View>
    </Card>
  );
}
