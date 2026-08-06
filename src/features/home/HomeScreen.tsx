import { Ionicons } from '@expo/vector-icons';
import { useBatteryLevel } from 'expo-battery';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Button, Screen, StatusCard } from '@/components/ui';
import { TOUCH_TARGET } from '@/components/ui/touchTarget';
import { useSession, useSettings } from '@/hooks';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';
import type { AmbientEnvironment, MicrophonePermissionStatus } from '@/types';

import { BrandMark, HeroMoonIcon } from './BrandMark';
import {
  BATTERY_LOW_THRESHOLD,
  batteryCopy,
  calibrationCopy,
  homeCopy,
  microphoneCopy,
} from './copy';
import {
  BatteryPercent,
  BatteryStatusIcon,
  MicStatusIcon,
  PulseStatusIcon,
  StatusCheck,
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
  const { startSession, sessionState } = useSession();
  const {
    readiness,
    refreshReadiness,
    calibrateAmbient,
    requestMicrophonePermission,
  } = useSettings();

  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void refreshReadiness();
    // Intentionally once on mount — readiness refreshes again before Start.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only readiness probe
  }, []);

  const levelKnown = batteryLevel >= 0;
  const percent = levelKnown ? Math.round(batteryLevel * 100) : null;
  const batteryLow = levelKnown && batteryLevel <= BATTERY_LOW_THRESHOLD;
  const batteryTone = batteryLow ? 'alert' : 'success';
  const batteryColor = batteryLow ? colors.alertText : colors.successText;

  const mic = microphoneCard(readiness?.microphone);
  const calibrated = readiness?.calibration !== null && readiness?.calibration !== undefined;
  const calibrationTone: StatusTone = 'informational';

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
      let current = await refreshReadiness();
      if (!current.ok) {
        setErrorMessage(current.error.message);
        return;
      }

      if (current.value.microphone !== 'granted') {
        const permission = await requestMicrophonePermission();
        if (!permission.ok || permission.value !== 'granted') {
          setErrorMessage(
            permission.ok
              ? 'Microphone permission is required to record.'
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
    refreshReadiness,
    requestMicrophonePermission,
    calibrateAmbient,
    startSession,
    router,
  ]);

  const cardCompact = { paddingVertical: spacing.sm };
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

      <View style={{ alignItems: 'center', paddingTop: spacing.md, paddingBottom: spacing.md }}>
        <Button
          variant="hero"
          label={starting ? homeCopy.startingLabel : homeCopy.heroLabel}
          sublabel={homeCopy.heroSublabel}
          accessibilityLabel={homeCopy.heroAccessibilityLabel}
          icon={starting ? <ActivityIndicator color={colors.fg} /> : <HeroMoonIcon />}
          onPress={() => {
            void onStart();
          }}
          disabled={starting}
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

      <View style={{ gap: spacing.sm, paddingBottom: spacing.xs }}>
        <StatusCard
          tone={batteryTone}
          title={batteryLow ? batteryCopy.lowTitle : batteryCopy.okTitle}
          subtitle={batteryLow ? batteryCopy.lowSubtitle : batteryCopy.okSubtitle}
          icon={<BatteryStatusIcon color={batteryColor} />}
          trailing={<BatteryPercent percent={percent} color={batteryColor} />}
          style={cardCompact}
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
            <MicStatusIcon color={mic.ok ? colors.successText : colors.alertText} />
          }
          trailing={mic.ok ? <StatusCheck /> : undefined}
          style={cardCompact}
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
          icon={<PulseStatusIcon color={colors.primary} />}
          trailing={calibrated ? <StatusCheck /> : undefined}
          style={cardCompact}
          testID="home-status-calibration"
        />
      </View>
    </Screen>
  );
}
