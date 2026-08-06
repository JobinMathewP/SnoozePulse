import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Pressable } from 'react-native';

import { SummaryScreen } from '@/features/summary';
import { colors, fontFamily, fontSize, spacing } from '@/theme';

/**
 * Sleep Summary route — mock-driven morning report (Task 3.4).
 * Compact header chrome matching summary-screen.jpg.
 */
export default function SessionSummaryRoute() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Sleep Summary',
      headerTitleAlign: 'center',
      headerTitleStyle: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.body,
        color: colors.fg,
      },
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share sleep summary"
          hitSlop={spacing.md}
          onPress={() => undefined}
          style={{
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="share-outline" size={fontSize.body} color={colors.fg} />
        </Pressable>
      ),
    });
  }, [navigation]);

  return <SummaryScreen />;
}
