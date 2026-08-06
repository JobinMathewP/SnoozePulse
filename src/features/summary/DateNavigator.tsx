import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { TOUCH_TARGET } from '@/components/ui/touchTarget';
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
 * Visual controls stay small; min touch target is 44×44.
 */
export function DateNavigator({ label, onPrev, onNext, onCalendar, testID }: DateNavigatorProps) {
  const iconHit = {
    minWidth: TOUCH_TARGET,
    minHeight: TOUCH_TARGET,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

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
        onPress={onPrev}
        style={iconHit}
      >
        <Ionicons name="chevron-back-outline" size={ICON} color={colors.fgBody} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={summaryCopy.calendarAccessibilityLabel}
        onPress={onCalendar}
        style={iconHit}
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
          flexShrink: 1,
        }}
      >
        {label}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={summaryCopy.nextDayAccessibilityLabel}
        onPress={onNext}
        style={iconHit}
      >
        <Ionicons name="chevron-forward-outline" size={ICON} color={colors.fgBody} />
      </Pressable>
    </View>
  );
}
