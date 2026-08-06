import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontFamily, fontSize } from '@/theme';

/** History tab — placeholder only (Task 2.1). */
export default function HistoryScreen() {
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.fg, fontFamily: fontFamily.regular, fontSize: fontSize.body }}>History</Text>
      </View>
    </SafeAreaView>
  );
}
