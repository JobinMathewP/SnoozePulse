import { Ionicons } from '@expo/vector-icons';
import { useBatteryLevel } from 'expo-battery';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { ErrorPanel, Screen, StatusCard } from '@/components/ui';
import { TOUCH_TARGET } from '@/components/ui/touchTarget';
import { useInsights, useProfile, useSession, useSettings } from '@/hooks';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';
import type {
  AmbientEnvironment,
  MicrophonePermissionStatus,
  SleepSession,
} from '@/types';

import { BrandMark } from './BrandMark';
import { StartSessionHero } from './StartSessionHero';
import {
  BATTERY_LOW_THRESHOLD,
  batteryCopy,
  calibrationCopy,
  greeting,
  homeCopy,
  homeErrorCopy,
  microphoneCopy,
} from './copy';
import { LastNightCard } from './LastNightCard';
import {
  BatteryPercent,
  BatteryStatusIcon,
  MicStatusIcon,
  PulseStatusIcon,
  StatusCheck,
  WaveformTrail,
} from './StatusAffordance';

type StatusTone = 'success' | 'alert' | 'informational';

function microphoneCard(status: MicrophonePermissionStatus | undefined): {
  tone: StatusTone;
  title: string;
  subtitle: string;
  ok: boolean;
} {
  if (status === 'granted') {
    return {
      tone: 'success',
      title: microphoneCopy.grantedTitle,
      subtitle: microphoneCopy.grantedSubtitle,
      ok: true,
    };
  }
  if (status === 'denied') {
    return {
      tone: 'alert',
      title: microphoneCopy.deniedTitle,
      subtitle: microphoneCopy.deniedSubtitle,
      ok: false,
    };
  }
  return {
    tone: 'informational',
    title: microphoneCopy.undeterminedTitle,
    subtitle: microphoneCopy.undeterminedSubtitle,
    ok: false,
  };
}

function calibrationSubtitle(environment: AmbientEnvironment): string {
  switch (environment) {
    case 'quiet':
      return calibrationCopy.quietSubtitle;
    case 'moderate':
      return calibrationCopy.moderateSubtitle;
    case 'noisy':
      return calibrationCopy.noisySubtitle;
  }
}

/**
 * Home landing: brand header, hero start control, and three readiness cards.
 * Live chain: readiness → permission → calibrate → startSession → Active Session.
 */
export function HomeScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const batteryLevel = useBatteryLevel();
  const { startSession, sessionState, lastError, recoverSession } = useSession();
  const {
    readiness,
    refreshReadiness,
    calibrateAmbient,
    requestMicrophonePermission,
  } = useSettings();
  const { displayName } = useProfile();
  const { listRecentSessions } = useInsights();

  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastNight, setLastNight] = useState<SleepSession | null>(null);
  const [lastNightLoading, setLastNightLoading] = useState(true);

  useEffect(() => {
    void refreshReadiness();
    // Intentionally once on mount — readiness refreshes again before Start.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only readiness probe
  }, []);

  // Refresh the "Last night" card whenever Home regains focus (e.g. returning from a
  // finished session or after deleting all data in Settings), showing the newest completed
  // session only.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        setLastNightLoading(true);
        const result = await listRecentSessions(5);
        if (cancelled) {
          return;
        }
        const newestComplete = result.ok
          ? (result.value.find((s) => s.endedAt !== null) ?? null)
          : null;
        setLastNight(newestComplete);
        setLastNightLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    }, [listRecentSessions]),
  );

  const greetingText = greeting(displayName, new Date().getHours());

  const levelKnown = batteryLevel >= 0;
  const percent = levelKnown ? Math.round(batteryLevel * 100) : null;
  const batteryLow = levelKnown && batteryLevel <= BATTERY_LOW_THRESHOLD;
  const batteryTone = batteryLow ? 'alert' : 'success';
  const batteryColor = batteryLow ? colors.alertText : colors.homeReady;

  const mic = microphoneCard(readiness?.microphone);
  const calibrated = readiness?.calibration !== null && readiness?.calibration !== undefined;
  const calibrationTone: StatusTone = 'informational';
  const inError = sessionState === 'ERROR' && lastError !== null;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'left',
      headerTitle: () => (
        <View
          accessible
          accessibilityRole="header"
          accessibilityLabel={homeCopy.brandName}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
        >
          <BrandMark size={spacing.xl} />
          <Text
            style={{
              color: colors.fg,
              fontFamily: fontFamily.semibold,
              fontSize: fontSize.title,
              lineHeight: lineHeight.title,
            }}
          >
            {homeCopy.brandName}
          </Text>
        </View>
      ),
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={homeCopy.settingsAccessibilityLabel}
          hitSlop={spacing.sm}
          onPress={() => {
            router.push('/settings');
          }}
          style={{
            minWidth: TOUCH_TARGET,
            minHeight: TOUCH_TARGET,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.xs,
          }}
        >
          <Ionicons name="settings-outline" size={fontSize.heading} color={colors.fg} />
        </Pressable>
      ),
    });
    // Header chrome is static — avoid re-setOptions loops when navigation identity churns.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only header setup
  }, []);

  const onStart = useCallback(async () => {
    if (busy || sessionState === 'STARTING' || sessionState === 'RECORDING') {
      return;
    }
    setErrorMessage(null);
    setBusy(true);
    try {
      if (sessionState === 'ERROR') {
        await recoverSession();
      }

      let current = await refreshReadiness();
      if (!current.ok) {
        setErrorMessage(current.error.message);
        return;
      }

      if (current.value.microphone !== 'granted') {
        if (current.value.microphone === 'denied') {
          setErrorMessage(microphoneCopy.deniedSubtitle);
          return;
        }
        const permission = await requestMicrophonePermission();
        if (!permission.ok || permission.value !== 'granted') {
          setErrorMessage(
            permission.ok
              ? microphoneCopy.deniedSubtitle
              : permission.error.message,
          );
          return;
        }
        current = await refreshReadiness();
        if (!current.ok) {
          setErrorMessage(current.error.message);
          return;
        }
      }

      if (current.value.calibration === null) {
        setBusyLabel(homeCopy.calibratingLabel);
        const calibration = await calibrateAmbient();
        if (!calibration.ok) {
          setErrorMessage(calibration.error.message);
          return;
        }
      }

      setBusyLabel(homeCopy.startingLabel);
      const started = await startSession();
      if (!started.ok) {
        setErrorMessage(started.error.message);
        return;
      }

      router.push('/session/active');
    } finally {
      setBusy(false);
      setBusyLabel(null);
    }
  }, [
    busy,
    sessionState,
    recoverSession,
    refreshReadiness,
    requestMicrophonePermission,
    calibrateAmbient,
    startSession,
    router,
  ]);

  const cardChrome = {
    paddingVertical: spacing.sm,
    backgroundColor: colors.homeCard,
    borderColor: colors.homeCardBorder,
  };
  const starting = busy || sessionState === 'STARTING';

  return (
    <Screen
      variant="scroll"
      background="app"
      edges={['left', 'right', 'bottom']}
      contentContainerStyle={{ paddingBottom: spacing.sm }}
      testID="home-screen"
    >
      <View style={{ alignItems: 'center', paddingTop: spacing.sm, gap: spacing.xs }}>
        <Text
          accessibilityRole="text"
          style={{
            color: colors.homeGreeting,
            fontFamily: fontFamily.medium,
            fontSize: fontSize.body,
            lineHeight: lineHeight.body,
            textAlign: 'center',
          }}
        >
          {greetingText}
        </Text>
        <Text
          accessibilityRole="header"
          style={{
            color: colors.fg,
            fontFamily: fontFamily.bold,
            fontSize: fontSize.heading,
            lineHeight: lineHeight.heading,
            textAlign: 'center',
            paddingHorizontal: spacing.md,
          }}
        >
          {homeCopy.headline}
        </Text>
        <Text
          style={{
            color: colors.fgBody,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.body,
            lineHeight: lineHeight.body,
            textAlign: 'center',
            paddingHorizontal: spacing.lg,
            maxWidth: spacing.xl * 10,
          }}
        >
          {homeCopy.subhead}
        </Text>
      </View>

      {inError && lastError ? (
        <View style={{ paddingVertical: spacing.sm }}>
          <ErrorPanel
            error={lastError}
            primaryLabel={homeErrorCopy.retryLabel}
            primaryAccessibilityLabel={homeErrorCopy.retryAccessibilityLabel}
            onPrimary={() => {
              void onStart();
            }}
            secondaryLabel={homeErrorCopy.recoverLabel}
            secondaryAccessibilityLabel={homeErrorCopy.recoverAccessibilityLabel}
            onSecondary={() => {
              void recoverSession();
              setErrorMessage(null);
            }}
            testID="home-session-error"
          />
        </View>
      ) : (
        <View style={{ alignItems: 'center', paddingTop: spacing.md, paddingBottom: spacing.md }}>
          <StartSessionHero
            accessibilityLabel={homeCopy.heroAccessibilityLabel}
            onPress={() => {
              void onStart();
            }}
            disabled={starting}
            busy={starting}
            testID="home-start-session"
          />
          {busyLabel ? (
            <Text
              style={{
                marginTop: spacing.sm,
                color: colors.fgCaption,
                fontFamily: fontFamily.regular,
                fontSize: fontSize.caption,
              }}
            >
              {busyLabel}
            </Text>
          ) : null}
          {errorMessage ? (
            <Text
              accessibilityRole="alert"
              style={{
                marginTop: spacing.sm,
                color: colors.alertText,
                fontFamily: fontFamily.regular,
                fontSize: fontSize.caption,
                textAlign: 'center',
                paddingHorizontal: spacing.md,
              }}
            >
              {errorMessage}
            </Text>
          ) : null}
        </View>
      )}

      <View style={{ gap: spacing.sm, paddingBottom: spacing.xs }}>
        <StatusCard
          tone={batteryTone}
          title={batteryLow ? batteryCopy.lowTitle : batteryCopy.okTitle}
          subtitle={batteryLow ? batteryCopy.lowSubtitle : batteryCopy.okSubtitle}
          icon={<BatteryStatusIcon color={batteryColor} />}
          trailing={<BatteryPercent percent={percent} color={batteryColor} />}
          style={cardChrome}
          accessibilityLabel={
            percent === null
              ? `${batteryLow ? batteryCopy.lowTitle : batteryCopy.okTitle}. Battery level unavailable.`
              : `${batteryLow ? batteryCopy.lowTitle : batteryCopy.okTitle}. ${percent} percent.`
          }
          testID="home-status-battery"
        />
        <StatusCard
          tone={mic.tone}
          title={mic.title}
          subtitle={mic.subtitle}
          icon={
            <MicStatusIcon color={mic.ok ? colors.homeReady : colors.alertText} />
          }
          trailing={mic.ok ? <StatusCheck /> : undefined}
          style={cardChrome}
          onPress={
            readiness?.microphone === 'denied'
              ? () => {
                  void Linking.openSettings();
                }
              : undefined
          }
          accessibilityLabel={
            readiness?.microphone === 'denied'
              ? microphoneCopy.openSettingsAccessibilityLabel
              : undefined
          }
          testID="home-status-microphone"
        />
        <StatusCard
          tone={calibrationTone}
          title={calibrationCopy.pendingTitle}
          subtitle={
            calibrated && readiness?.calibration
              ? calibrationSubtitle(readiness.calibration.environment)
              : calibrationCopy.pendingSubtitle
          }
          icon={<PulseStatusIcon color={colors.homeAccent} />}
          trailing={<WaveformTrail />}
          style={cardChrome}
          testID="home-status-calibration"
        />

        <LastNightCard
          session={lastNight}
          loading={lastNightLoading}
          onView={() => {
            if (lastNight) {
              router.push({
                pathname: '/session/[id]/summary',
                params: { id: lastNight.id },
              });
            }
          }}
          testID="home-last-night"
        />
      </View>
    </Screen>
  );
}
