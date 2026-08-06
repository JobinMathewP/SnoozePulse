import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontFamily, fontSize } from '@/theme';

/** Settings — pushed from the Home header gear (design-spec). Placeholder only (Task 2.1). */
export default function SettingsScreen() {
  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.fg, fontFamily: fontFamily.regular, fontSize: fontSize.body }}>Settings</Text>
      </View>
    </SafeAreaView>
  );
}
