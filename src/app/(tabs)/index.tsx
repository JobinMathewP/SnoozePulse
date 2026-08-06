import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontFamily, fontSize } from '@/theme';

/**
 * Home tab — placeholder only (Task 2.1).
 *
 * Temporary links let QA reach Active Session and Summary until those screens grow real
 * entry points in later milestones. The settings gear is a product control (design-spec).
 */
export default function HomeScreen() {
  const navigation = useNavigation();
  const router = useRouter();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          hitSlop={8}
          onPress={() => {
            router.push('/settings');
          }}
          style={{
            minWidth: 44,
            minHeight: 44,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 4,
          }}
        >
          <Ionicons name="settings-outline" size={22} color={colors.fg} />
        </Pressable>
      ),
    });
  }, [navigation, router]);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 16 }}>
        <Text style={{ color: colors.fg, fontFamily: fontFamily.regular, fontSize: fontSize.body }}>Home</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open active sleep session"
          onPress={() => {
            router.push('/session/active');
          }}
          style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ color: colors.primary, fontFamily: fontFamily.medium, fontSize: fontSize.body }}>
            Open Active Session
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open sample sleep summary"
          onPress={() => {
            router.push({ pathname: '/session/[id]/summary', params: { id: 'sample' } });
          }}
          style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ color: colors.primary, fontFamily: fontFamily.medium, fontSize: fontSize.body }}>
            Open Sample Summary
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
