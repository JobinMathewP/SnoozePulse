import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ErrorPanel } from '@/components/ui';
import { TOUCH_TARGET } from '@/components/ui/touchTarget';
import { ActiveSessionScreen } from '@/features/session';
import { activeSessionCopy } from '@/features/session/copy';
import { useAudioLevels, useSession } from '@/hooks';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';
import { errorRecoveryHint, errorTitle } from '@/utils';

/**
 * Active Session route — live recording surface.
 * Slide-to-end stops the engine and opens Summary for the completed session id.
 * ERROR and storage-quota warnings surface recovery UI (Task 5.5).
 */
export default function ActiveSessionRoute() {
  const router = useRouter();
  const { stopSession, sessionState, lastError, recoverSession } = useSession();
  const { storageQuotaWarning, clearStorageQuotaWarning } = useAudioLevels();
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
      if (result.error.code === 'ILLEGAL_TRANSITION') {
        await recoverSession();
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
  }, [ending, stopSession, recoverSession, router]);

  const onRecoverHome = useCallback(async () => {
    await recoverSession();
    router.replace('/(tabs)');
  }, [recoverSession, router]);

  if (sessionState === 'ERROR' && lastError) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bgOled,
          justifyContent: 'center',
          padding: spacing.md,
        }}
        testID="active-session-error"
      >
        <ErrorPanel
          error={lastError}
          primaryLabel={activeSessionCopy.recoverHomeLabel}
          primaryAccessibilityLabel={activeSessionCopy.recoverHomeAccessibilityLabel}
          onPrimary={() => {
            void onRecoverHome();
          }}
          testID="active-session-error-panel"
        />
      </View>
    );
  }

  return (
    <>
      <ActiveSessionScreen
        onEndSession={() => {
          void onEndSession();
        }}
      />
      {storageQuotaWarning ? (
        <View
          style={{
            position: 'absolute',
            top: spacing.xl,
            left: spacing.md,
            right: spacing.md,
            backgroundColor: colors.cardElevated,
            borderRadius: spacing.sm,
            padding: spacing.md,
            gap: spacing.xs,
          }}
          accessibilityRole="alert"
        >
          <Text
            style={{
              color: colors.alertText,
              fontFamily: fontFamily.semibold,
              fontSize: fontSize.body,
              lineHeight: lineHeight.body,
            }}
          >
            {errorTitle(storageQuotaWarning)}
          </Text>
          <Text
            style={{
              color: colors.fgBody,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
            }}
          >
            {storageQuotaWarning.message} {errorRecoveryHint(storageQuotaWarning)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={activeSessionCopy.storageWarningDismissAccessibilityLabel}
            onPress={clearStorageQuotaWarning}
            style={{
              minHeight: TOUCH_TARGET,
              justifyContent: 'center',
              alignSelf: 'flex-start',
            }}
          >
            <Text
              style={{
                color: colors.primary,
                fontFamily: fontFamily.medium,
                fontSize: fontSize.body,
              }}
            >
              {activeSessionCopy.storageWarningDismissLabel}
            </Text>
          </Pressable>
        </View>
      ) : null}
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
