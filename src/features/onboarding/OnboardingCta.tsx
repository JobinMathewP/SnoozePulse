import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';

import { TOUCH_TARGET } from '@/components/ui/touchTarget';
import { colors, fontFamily, fontSize, lineHeight, radius, spacing } from '@/theme';

type OnboardingCtaProps = {
  readonly label: string;
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  readonly testID?: string;
};

/**
 * Full-width mockup CTA: sampled onboardAccent fill, Inter semibold, trailing arrow.
 * Onboarding-local so Home's primary pill is unchanged.
 */
export function OnboardingCta({
  label,
  accessibilityLabel,
  onPress,
  testID,
}: OnboardingCtaProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => ({
        minHeight: TOUCH_TARGET + spacing.sm,
        borderRadius: radius.lg,
        backgroundColor: colors.onboardAccent,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <Text
        style={{
          color: colors.fg,
          fontFamily: fontFamily.semibold,
          fontSize: fontSize.bodyLg,
          lineHeight: lineHeight.bodyLg,
        }}
      >
        {label}
      </Text>
      <Ionicons name="arrow-forward" size={fontSize.bodyLg} color={colors.fg} />
    </Pressable>
  );
}
