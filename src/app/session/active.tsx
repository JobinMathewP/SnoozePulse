import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ConfirmDialog, ErrorPanel } from '@/components/ui';
import { TOUCH_TARGET } from '@/components/ui/touchTarget';
import { ActiveSessionScreen } from '@/features/session';
import { activeSessionCopy } from '@/features/session/copy';
import { useAudioLevels, useSession } from '@/hooks';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';
import { errorRecoveryHint, errorTitle, isSessionTooShort } from '@/utils';

/**
 * Active Session route — live recording surface.
 * Slide-to-end stops the engine and opens Summary for the completed session id.
 * ERROR and storage-quota warnings surface recovery UI (Task 5.5).
 */
export default function ActiveSessionRoute() {
  const router = useRouter();
  const {
    stopSession,
    discardSession,
    activeSession,
    sessionState,
    lastError,
    lastCompletedSessionId,
    recoverSession,
    consumeLastCompletedSession,
  } = useSession();
  const { storageQuotaWarning, clearStorageQuotaWarning } = useAudioLevels();
  const [ending, setEnding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [slideResetToken, setSlideResetToken] = useState(0);

  // Dismiss the discard dialog and spring the slider back to the start.
  const cancelDiscard = useCallback(() => {
    setConfirmDiscard(false);
    setSlideResetToken((n) => n + 1);
  }, []);

  /** Stop, finalize, and open the summary. Assumes the min-length check already passed. */
  const finalizeSession = useCallback(async () => {
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
    consumeLastCompletedSession();
    router.replace({
      pathname: '/session/[id]/summary',
      params: { id: result.value.id },
    });
  }, [ending, stopSession, recoverSession, consumeLastCompletedSession, router]);

  // Battery save-and-stop (ADR-34) runs at the composition root. If we are still on this
  // route when that flush finishes, open Summary — skip the too-short discard dialog.
  useEffect(() => {
    if (!lastCompletedSessionId || ending) {
      return;
    }
    const id = lastCompletedSessionId;
    consumeLastCompletedSession();
    router.replace({
      pathname: '/session/[id]/summary',
      params: { id },
    });
  }, [lastCompletedSessionId, ending, consumeLastCompletedSession, router]);

  const onEndSession = useCallback(() => {
    if (ending) {
      return;
    }
    // Sessions under the minimum length have no useful signal (ADR-30): warn before ending
    // so the user can keep recording, or confirm discarding the throwaway night.
    if (activeSession && isSessionTooShort(activeSession.startedAt, Date.now())) {
      setConfirmDiscard(true);
      return;
    }
    void finalizeSession();
  }, [ending, activeSession, finalizeSession]);

  const onConfirmDiscard = useCallback(async () => {
    setConfirmDiscard(false);
    if (ending) {
      return;
    }
    setEnding(true);
    await discardSession();
    router.replace('/(tabs)');
  }, [ending, discardSession, router]);

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
        onEndSession={onEndSession}
        slideResetToken={slideResetToken}
      />

      <ConfirmDialog
        visible={confirmDiscard}
        title={activeSessionCopy.tooShortTitle}
        message={activeSessionCopy.tooShortBody}
        confirmLabel={activeSessionCopy.tooShortDiscardLabel}
        confirmAccessibilityLabel={activeSessionCopy.tooShortDiscardAccessibilityLabel}
        cancelLabel={activeSessionCopy.tooShortKeepLabel}
        cancelAccessibilityLabel={activeSessionCopy.tooShortKeepAccessibilityLabel}
        destructive
        onConfirm={() => {
          void onConfirmDiscard();
        }}
        onCancel={cancelDiscard}
        testID="active-session-discard-confirm"
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
