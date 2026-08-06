import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontFamily, fontSize } from '@/theme';

/**
 * Active Session — full screen, no tab bar, no back gesture (design-spec).
 * Placeholder only (Task 2.1). Temporary end control so QA can leave the screen.
 */
export default function ActiveSessionScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={{ flex: 1, backgroundColor: colors.bgOled }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 16 }}>
        <Text style={{ color: colors.fgOled, fontFamily: fontFamily.regular, fontSize: fontSize.body }}>
          Active Session
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="End sleep session and go back"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
          style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ color: colors.accentActive, fontFamily: fontFamily.medium, fontSize: fontSize.body }}>
            End session
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
