import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text } from 'react-native';

import { ActiveSessionScreen } from '@/features/session';
import { useSession } from '@/hooks';
import { colors, fontFamily, fontSize, spacing } from '@/theme';

/**
 * Active Session route — live recording surface.
 * Slide-to-end stops the engine and opens Summary for the completed session id.
 * If the store was reset (Fast Refresh) while this screen stayed mounted, stop recovers
 * by forcing native capture down and returning Home when no session can be finalised.
 */
export default function ActiveSessionRoute() {
  const router = useRouter();
  const { stopSession } = useSession();
  const [ending, setEnding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onEndSession = useCallback(async () => {
    if (ending) {
      return;
    }
    setEnding(true);
    setErrorMessage(null);
    const result = await stopSession();
    if (!result.ok) {
      // Desync: native capture was stopped (if any); leave Active Session.
      if (result.error.code === 'ILLEGAL_TRANSITION') {
        router.replace('/(tabs)');
        return;
      }
      setErrorMessage(result.error.message);
      setEnding(false);
      return;
    }
    router.replace({
      pathname: '/session/[id]/summary',
      params: { id: result.value.id },
    });
  }, [ending, stopSession, router]);

  return (
    <>
      <ActiveSessionScreen
        onEndSession={() => {
          void onEndSession();
        }}
      />
      {errorMessage ? (
        <Text
          accessibilityRole="alert"
          style={{
            position: 'absolute',
            bottom: spacing.xl,
            left: spacing.md,
            right: spacing.md,
            textAlign: 'center',
            color: colors.alertText,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.caption,
          }}
        >
          {errorMessage}
        </Text>
      ) : null}
    </>
  );
}
