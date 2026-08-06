import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

import { summaryCopy } from './format';

type DateNavigatorProps = {
  readonly label: string;
  readonly onPrev: () => void;
  readonly onNext: () => void;
  readonly onCalendar: () => void;
  readonly testID?: string;
};

const ICON = fontSize.body;

/**
 * Compact date strip: ‹  calendar  May 21, 2024  ›  (summary-screen.jpg).
 * Visual controls stay small; hitSlop preserves accessibility.
 */
export function DateNavigator({ label, onPrev, onNext, onCalendar, testID }: DateNavigatorProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingTop: spacing.xs,
        paddingBottom: spacing.sm,
      }}
      testID={testID}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={summaryCopy.prevDayAccessibilityLabel}
        hitSlop={spacing.md}
        onPress={onPrev}
        style={{ padding: spacing.xs, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="chevron-back-outline" size={ICON} color={colors.fgBody} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={summaryCopy.calendarAccessibilityLabel}
        hitSlop={spacing.md}
        onPress={onCalendar}
        style={{ padding: spacing.xs / 2, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="calendar-outline" size={ICON} color={colors.fgBody} />
      </Pressable>

      <Text
        style={{
          color: colors.fgBody,
          fontFamily: fontFamily.regular,
          fontSize: fontSize.body,
          lineHeight: lineHeight.body,
          textAlign: 'center',
          opacity: 0.72,
        }}
      >
        {label}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={summaryCopy.nextDayAccessibilityLabel}
        hitSlop={spacing.md}
        onPress={onNext}
        style={{ padding: spacing.xs, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="chevron-forward-outline" size={ICON} color={colors.fgBody} />
      </Pressable>
    </View>
  );
}
