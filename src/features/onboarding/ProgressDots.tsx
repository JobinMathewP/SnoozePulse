import { View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type ProgressDotsProps = {
  readonly count: number;
  readonly index: number;
  readonly accessibilityLabel: string;
};

/**
 * Four circular step dots. Active uses onboardAccent; idle uses the sampled header gray.
 */
export function ProgressDots({ count, index, accessibilityLabel }: ProgressDotsProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.sm,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
      }}
    >
      {Array.from({ length: count }, (_, i) => {
        const active = i === index;
        const size = active ? spacing.sm + spacing.xs / 2 : spacing.sm;
        return (
          <View
            key={i}
            style={{
              width: size,
              height: size,
              borderRadius: radius.full,
              backgroundColor: active ? colors.onboardAccent : colors.onboardDotIdle,
              shadowColor: active ? colors.onboardAccentMuted : 'transparent',
              shadowOpacity: active ? 0.9 : 0,
              shadowRadius: spacing.sm,
              shadowOffset: { width: 0, height: 0 },
              elevation: active ? 4 : 0,
            }}
          />
        );
      })}
    </View>
  );
}
