import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';

import { HistoryScreen } from '@/features/history';
import { colors, fontFamily, fontSize } from '@/theme';

/**
 * History tab route. Title matches the tab label (ADR-09).
 */
export default function HistoryRoute() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'History',
      headerTitleAlign: 'center',
      headerTitleStyle: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.bodyLg,
        color: colors.fg,
      },
    });
  }, [navigation]);

  return <HistoryScreen />;
}
