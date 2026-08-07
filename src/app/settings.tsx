import { Text } from 'react-native';

import { Screen } from '@/components/ui';
import { colors, fontFamily, fontSize } from '@/theme';

/** Settings — pushed from the Home header gear (design-spec). Placeholder only (Task 2.1). */
export default function SettingsScreen() {
  return (
    <Screen variant="fixed" background="app" edges={['left', 'right', 'bottom']} testID="settings-screen">
      <Text
        style={{
          flex: 1,
          textAlign: 'center',
          textAlignVertical: 'center',
          color: colors.fg,
          fontFamily: fontFamily.regular,
          fontSize: fontSize.body,
        }}
      >
        Settings
      </Text>
    </Screen>
  );
}
