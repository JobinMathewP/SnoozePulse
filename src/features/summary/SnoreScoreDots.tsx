import { View } from 'react-native';

import { colors, spacing } from '@/theme';

type SnoreScoreDotsProps = {
  /** 0–5; fractional values render a half-filled trailing dot. */
  readonly filled: number;
  readonly color?: string;
  readonly testID?: string;
};

/** ~6 dp circles from summary-screen.jpg (between xs and sm on the spacing scale). */
const DOT = spacing.xs + spacing.xs / 2;

/**
 * Five-dot snore scale from summary-screen.jpg — filled with the sampled warning amber.
 */
export function SnoreScoreDots({
  filled,
  color = colors.warning,
  testID,
}: SnoreScoreDotsProps) {
  const dots = [0, 1, 2, 3, 4] as const;

  return (
    <View
      accessible
      accessibilityLabel={`${filled} of 5 on snore score scale`}
      style={{ flexDirection: 'row', gap: spacing.xs / 2, marginTop: 0 }}
      testID={testID}
    >
      {dots.map((index) => {
        const amount = Math.min(1, Math.max(0, filled - index));
        if (amount >= 1) {
          return (
            <View
              key={index}
              style={{
                width: DOT,
                height: DOT,
                borderRadius: DOT / 2,
                backgroundColor: color,
              }}
            />
          );
        }
        if (amount > 0) {
          return (
            <View
              key={index}
              style={{
                width: DOT,
                height: DOT,
                borderRadius: DOT / 2,
                backgroundColor: colors.borderCard,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${amount * 100}%`,
                  height: '100%',
                  backgroundColor: color,
                }}
              />
            </View>
          );
        }
        return (
          <View
            key={index}
            style={{
              width: DOT,
              height: DOT,
              borderRadius: DOT / 2,
              backgroundColor: colors.borderCard,
            }}
          />
        );
      })}
    </View>
  );
}
