import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';

import { HistoryScreen } from '@/features/history';
import { colors, fontFamily, fontSize } from '@/theme';

/**
 * History tab route — Your Progress (Task 3.5).
 * Title matches history-screen.jpg; no back chevron (tab root, ADR-09).
 */
export default function HistoryRoute() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Your Progress',
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
