import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

/** Minimum touch target from ui-guidelines.md — not a visual token, an a11y floor. */
const TOUCH_TARGET = 44;

type SectionHeaderProps = {
  readonly title: string;
  /**
   * When provided, renders the trailing info affordance seen next to
   * "Snoring Timeline" on summary-screen.jpg.
   */
  readonly onInfoPress?: () => void;
  /** Required when `onInfoPress` is set. */
  readonly infoAccessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

/**
 * Section title treatment for "Snoring Timeline", "Snore Audio Snippets", and
 * "Weekly Comparison".
 *
 * Title uses `fontSize.title` / `fontFamily.semibold` in `colors.fg`. Optional info control
 * sits to the right of the label at the 44×44 minimum target.
 */
export function SectionHeader({
  title,
  onInfoPress,
  infoAccessibilityLabel,
  style,
  testID,
}: SectionHeaderProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.sm,
        },
        style,
      ]}
      testID={testID}
    >
      <Text
        accessibilityRole="header"
        style={{
          flexShrink: 1,
          color: colors.fg,
          fontFamily: fontFamily.semibold,
          fontSize: fontSize.title,
          lineHeight: lineHeight.title,
        }}
      >
        {title}
      </Text>
      {onInfoPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={infoAccessibilityLabel ?? `${title} information`}
          hitSlop={spacing.sm}
          onPress={onInfoPress}
          style={{
            minWidth: TOUCH_TARGET,
            minHeight: TOUCH_TARGET,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="information-circle-outline" size={fontSize.bodyLg} color={colors.fgCaption} />
        </Pressable>
      ) : null}
    </View>
  );
}
