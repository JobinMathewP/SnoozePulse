import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontFamily, fontSize } from '@/theme';
import type { SessionSummaryParams } from '@/types/navigation';

/**
 * Sleep Summary — pushed stack screen with back + share (design-spec).
 * Placeholder only (Task 2.1). Share is a no-op until a later milestone.
 */
export default function SessionSummaryScreen() {
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<SessionSummaryParams>();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share sleep summary"
          hitSlop={8}
          onPress={() => undefined}
          style={{
            minWidth: 44,
            minHeight: 44,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 4,
          }}
        >
          <Ionicons name="share-outline" size={22} color={colors.fg} />
        </Pressable>
      ),
    });
  }, [navigation]);

  const label = id ? `Sleep Summary (${id})` : 'Sleep Summary';

  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.fg, fontFamily: fontFamily.regular, fontSize: fontSize.body }}>{label}</Text>
      </View>
    </SafeAreaView>
  );
}
