import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

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
 * Quiet section title — body size, medium weight (summary-screen.jpg).
 * Metrics stay bold elsewhere; headers do not compete.
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
          gap: spacing.xs,
          marginBottom: spacing.xs,
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
          fontFamily: fontFamily.medium,
          fontSize: fontSize.bodyLg,
          lineHeight: lineHeight.bodyLg,
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
            width: fontSize.bodyLg,
            height: fontSize.bodyLg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="information-circle-outline" size={fontSize.body} color={colors.fgCaption} />
        </Pressable>
      ) : null}
    </View>
  );
}
