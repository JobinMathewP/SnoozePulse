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

/** `compact` = 8 dp inset (summary-screen.jpg); `comfortable` = 16 dp (Home / History). */
export type CardInset = 'comfortable' | 'compact';

type CardBaseProps = {
  readonly children: ReactNode;
  readonly width?: CardWidth;
  /**
   * `elevated` uses the lighter Summary metric fill (`cardElevated`);
   * `default` uses the Home / History card fill (`card`).
   */
  readonly tone?: CardTone;
  /**
   * Summary cards use `md` (12) — measured from summary-screen.jpg.
   * Home/History also use `md`.
   */
  readonly corner?: keyof typeof radius;
  /** Prefer `subtle` on Summary so the hairline does not dominate AMOLED navy. */
  readonly border?: 'default' | 'subtle';
  /** Summary uses `compact` so cards stay dense; Home keeps the default. */
  readonly inset?: CardInset;
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

const insetPadding = (inset: CardInset): number =>
  inset === 'compact' ? spacing.sm : spacing.md;

/**
 * Surface container matching the rounded cards in summary-screen.jpg and history-screen.jpg.
 *
 * Corner radius defaults to `radius.md` (12), measured from those images. Summary passes
 * `inset="compact"` so content sits closer to the edges (Apple Health density, not Material).
 */
export function Card({
  children,
  width = 'full',
  tone = 'default',
  corner = 'md',
  border = 'default',
  inset = 'comfortable',
  style,
  testID,
  onPress,
  accessibilityLabel,
}: CardProps) {
  const cardStyle: StyleProp<ViewStyle> = [
    {
      backgroundColor: surfaceColor(tone),
      borderColor: border === 'subtle' ? colors.borderCardSubtle : colors.borderCard,
      borderWidth: 1,
      borderRadius: radius[corner],
      padding: insetPadding(inset),
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
