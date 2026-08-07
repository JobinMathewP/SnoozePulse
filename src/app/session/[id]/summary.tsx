import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';

import { SummaryScreen } from '@/features/summary';
import { colors, fontFamily, fontSize } from '@/theme';

/**
 * Sleep Summary route — loads persisted session by `[id]` (survives app restart).
 *
 * Task 6.8: the reference mockup shows a share icon in the top-right, but sharing is not
 * implemented for M6. Rather than render a no-op affordance that lies about the app's
 * capabilities, the icon is omitted until a future task wires actual sharing.
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
    });
  }, [navigation]);

  return <SummaryScreen sessionId={sessionId} />;
}
