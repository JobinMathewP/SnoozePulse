import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps } from 'react';
import { View, type ViewStyle } from 'react-native';

import { colors, fontSize, radius, shadows, spacing } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const TILE = spacing.xl;

export const summaryCardStyle: ViewStyle = {
  backgroundColor: colors.settingsCard,
  borderColor: colors.settingsCardBorder,
  borderRadius: radius.lg,
};

type SummaryIconTileProps = {
  readonly name: IoniconName;
  readonly color?: string;
};

/** Rounded-square Ionicons tile — Settings chrome, local to Summary. */
export function SummaryIconTile({
  name,
  color = colors.settingsAccent,
}: SummaryIconTileProps) {
  return (
    <View
      style={{
        width: TILE,
        height: TILE,
        borderRadius: radius.md,
        backgroundColor: colors.settingsIconTile,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.settingsGlow,
      }}
    >
      <Ionicons
        accessibilityElementsHidden
        importantForAccessibility="no"
        name={name}
        size={fontSize.title}
        color={color}
      />
    </View>
  );
}
