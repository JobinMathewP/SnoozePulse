import { type ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';

/**
 * Widths visible in the reference images:
 *
 * - `full`  — Loudest Snore Episode, Weekly Comparison, status cards on Home
 * - `half`  — Total Snoring Time / Peak Loudness pair on Summary
 * - `third` — Sleep Duration / Snore Count / Snore Score strip on Summary
 *
 * Half and third cards are meant to sit inside `CardRow`, which supplies the horizontal gap.
 */
export type CardWidth = 'full' | 'half' | 'third';

type CardTone = 'default' | 'elevated';

type CardBaseProps = {
  readonly children: ReactNode;
  readonly width?: CardWidth;
  /**
   * `elevated` uses the lighter Summary metric fill (`cardElevated`);
   * `default` uses the Home / History card fill (`card`).
   */
  readonly tone?: CardTone;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

type CardProps =
  | (CardBaseProps & {
      readonly onPress?: undefined;
      readonly accessibilityLabel?: undefined;
    })
  | (CardBaseProps & {
      /** When set, the card becomes a press target (e.g. History Insights). */
      readonly onPress: () => void;
      readonly accessibilityLabel: string;
    });


type CardRowProps = {
  readonly children: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

const widthStyle = (width: CardWidth): ViewStyle => {
  switch (width) {
    case 'half':
    case 'third':
      return { flex: 1, minWidth: 0 };
    case 'full':
    default:
      return { alignSelf: 'stretch' };
  }
};

const surfaceColor = (tone: CardTone): string =>
  tone === 'elevated' ? colors.cardElevated : colors.card;

/**
 * Surface container matching the rounded cards in summary-screen.jpg and history-screen.jpg.
 *
 * Corner radius is `radius.md` (12), measured from those images. Padding is `spacing.md`.
 * Border uses the sampled `borderCard` token rather than a shadow — the mockups are flat.
 */
export function Card({
  children,
  width = 'full',
  tone = 'default',
  style,
  testID,
  onPress,
  accessibilityLabel,
}: CardProps) {
  const cardStyle: StyleProp<ViewStyle> = [
    {
      backgroundColor: surfaceColor(tone),
      borderColor: colors.borderCard,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
      overflow: 'hidden',
    },
    widthStyle(width),
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={cardStyle}
        testID={testID}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} testID={testID}>
      {children}
    </View>
  );
}

/**
 * Horizontal row that lays out `half` or `third` cards with the standard `spacing.sm` gap
 * seen between the Summary metric pair and the three-column strip.
 */
export function CardRow({ children, style, testID }: CardRowProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'stretch',
          gap: spacing.sm,
        },
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}
