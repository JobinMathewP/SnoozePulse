import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Pressable } from 'react-native';

import { SummaryScreen } from '@/features/summary';
import { colors, fontFamily, fontSize, spacing } from '@/theme';

/**
 * Sleep Summary route — loads persisted session by `[id]` (survives app restart).
 */
export default function SessionSummaryRoute() {
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id: string }>();
  const sessionId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

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

  return <SummaryScreen sessionId={sessionId} />;
}
