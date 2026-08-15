import { memo, useEffect, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { useLowPowerMode } from 'expo-battery';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { type SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Screen, Waveform } from '@/components/ui';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

import {
  activeSessionCopy,
  formatConfidencePercent,
  formatNoiseFloor,
} from './copy';
import { SlideToEnd } from './SlideToEnd';
import { useLiveAudioLevel } from './useLiveAudioLevel';

type ActiveSessionScreenProps = {
  readonly onEndSession: () => void;
  /**
   * Bump to remount the slider so its thumb resets to the start — used after a cancelled
   * too-short discard dialog, where the completed slide left the thumb pinned right.
   */
  readonly slideResetToken?: number;
};

type ClockParts = {
  readonly time: string;
  readonly period: string;
};

function readClock(now: Date): ClockParts {
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) {
    hours = 12;
  }
  const minuteText = minutes < 10 ? `0${minutes}` : String(minutes);
  return { time: `${hours}:${minuteText}`, period };
}

function ActiveMoonMark({ size = spacing.xl + spacing.sm }: { readonly size?: number }) {
  return (
    <Svg
      accessibilityElementsHidden
      importantForAccessibility="no"
      width={size}
      height={size}
      viewBox="0 0 48 48"
    >
      <Path
        d="M28 6c-9.5 1.8-16.5 10-16.5 20C11.5 37.5 20.5 46.5 32 46.5c3.8 0 7.3-1 10.3-2.8C36.5 48 27 51 18.5 51 8 51 0 43 0 32.5 0 20.5 9 10 21 7.5c2.3-.5 4.7-.3 7 1.5z"
        fill={colors.accentActive}
      />
      <Path
        d="M34 8h4v-4h3v4h4v3h-4v4h-3v-4h-4z"
        fill={colors.accentActive}
      />
    </Svg>
  );
}

type WavePanelProps = {
  readonly level: SharedValue<number>;
  readonly width: number;
};

/** Isolated so clock / band label re-renders do not remount waveform geometry. */
const WavePanel = memo(function WavePanel({ level, width }: WavePanelProps) {
  return (
    <Waveform
      level={level}
      width={width}
      height={spacing.xl * 3 + spacing.lg}
      color={colors.accentWaveform}
      testID="active-session-waveform"
    />
  );
});

/**
 * Full-screen OLED monitoring surface (docs/active-session.jpg).
 *
 * No pause control (ADR-14). Waveform level is the live shared value (ADR-13).
 */
export function ActiveSessionScreen({
  onEndSession,
  slideResetToken = 0,
}: ActiveSessionScreenProps) {
  // Screen is intentionally allowed to sleep. iOS UIBackgroundModes: audio and Android's
  // FOREGROUND_SERVICE_MICROPHONE keep capture alive while the phone is locked; a nightlong
  // KeepAwake would burn OLED for no functional gain.
  const { level, confidence, snoreDetected, noiseFloorDb } = useLiveAudioLevel();
  const { width: windowWidth } = useWindowDimensions();
  const waveWidth = Math.max(spacing.xl * 8, windowWidth - spacing.md * 2);
  // Suppress the Reanimated waveform when the OS reports low-power mode. Native capture and
  // detection continue unchanged; only the animation stops.
  const lowPowerMode = useLowPowerMode();
  const confidenceLabel = formatConfidencePercent(confidence);
  const noiseFloorLabel = formatNoiseFloor(noiseFloorDb);
  const detectionLabel = snoreDetected
    ? activeSessionCopy.detectionActiveLabel
    : activeSessionCopy.detectionListeningLabel;
  const detectionColor = snoreDetected ? colors.accentActive : colors.fgOled;

  const [clock, setClock] = useState(() => readClock(new Date()));

  useEffect(() => {
    const id = setInterval(() => {
      setClock(readClock(new Date()));
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bgOled }}>
      <Screen variant="fixed" background="oled" testID="active-session-screen">
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              paddingTop: spacing.xs,
              minHeight: spacing.md,
            }}
          >
            <View
              accessible
              accessibilityLabel={activeSessionCopy.recordingIndicatorAccessibilityLabel}
              style={{
                width: spacing.sm,
                height: spacing.sm,
                borderRadius: spacing.sm / 2,
                backgroundColor: colors.accentActive,
              }}
            />
          </View>

          <View style={{ alignItems: 'center', gap: spacing.sm, paddingTop: spacing.lg }}>
            <ActiveMoonMark />
            <Text
              style={{
                color: colors.accentActive,
                fontFamily: fontFamily.bold,
                fontSize: fontSize.body,
                lineHeight: lineHeight.body,
                textTransform: 'uppercase',
              }}
            >
              {activeSessionCopy.status}
            </Text>

            <View
              accessible
              accessibilityRole="text"
              accessibilityLabel={`${clock.time} ${clock.period}`}
              style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: spacing.md }}
            >
              <Text
                style={{
                  color: colors.fg,
                  fontFamily: fontFamily.regular,
                  fontSize: fontSize.metric,
                  lineHeight: lineHeight.metric,
                }}
              >
                {clock.time}
              </Text>
              <Text
                style={{
                  color: colors.fg,
                  fontFamily: fontFamily.regular,
                  fontSize: fontSize.heading,
                  lineHeight: lineHeight.heading,
                }}
              >
                {clock.period}
              </Text>
            </View>

            <Text
              style={{
                color: colors.fgOled,
                fontFamily: fontFamily.regular,
                fontSize: fontSize.body,
                lineHeight: lineHeight.body,
                textAlign: 'center',
                marginTop: spacing.sm,
              }}
            >
              {activeSessionCopy.monitoring}
            </Text>
            <Text
              style={{
                color: colors.fgOled,
                fontFamily: fontFamily.regular,
                fontSize: fontSize.caption,
                lineHeight: lineHeight.caption,
                textAlign: 'center',
                marginTop: spacing.xs,
                opacity: 0.6,
              }}
            >
              {activeSessionCopy.backgroundHint}
            </Text>
          </View>

          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md }}>
            {lowPowerMode ? (
              <View
                accessible
                accessibilityRole="text"
                accessibilityLabel={activeSessionCopy.lowPowerWaveformLabel}
                style={{
                  height: spacing.xl * 3 + spacing.lg,
                  width: waveWidth,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: colors.fgOled,
                    fontFamily: fontFamily.regular,
                    fontSize: fontSize.caption,
                    lineHeight: lineHeight.caption,
                    textAlign: 'center',
                    opacity: 0.6,
                  }}
                >
                  {activeSessionCopy.lowPowerWaveformLabel}
                </Text>
              </View>
            ) : (
              <WavePanel level={level} width={waveWidth} />
            )}
            <View
              accessible
              accessibilityRole="text"
              accessibilityLabel={
                snoreDetected
                  ? `${activeSessionCopy.detectionActiveLabel}. ${activeSessionCopy.detectionConfidenceLabel} ${confidenceLabel}.`
                  : `${activeSessionCopy.detectionListeningLabel}. ${activeSessionCopy.detectionConfidenceLabel} ${confidenceLabel}.`
              }
              style={{ alignItems: 'center', gap: spacing.xs }}
              testID="active-session-detection-readout"
            >
              <Text
                style={{
                  color: detectionColor,
                  fontFamily: fontFamily.semibold,
                  fontSize: fontSize.title,
                  lineHeight: lineHeight.title,
                }}
              >
                {detectionLabel}
              </Text>
              <Text
                style={{
                  color: colors.fgOled,
                  fontFamily: fontFamily.regular,
                  fontSize: fontSize.body,
                  lineHeight: lineHeight.body,
                }}
              >
                {`${activeSessionCopy.detectionConfidenceLabel} · ${confidenceLabel}`}
              </Text>
              <Text
                style={{
                  color: colors.fgOled,
                  fontFamily: fontFamily.regular,
                  fontSize: fontSize.caption,
                  lineHeight: lineHeight.caption,
                }}
              >
                {`${activeSessionCopy.roomNoiseLabel} · ${noiseFloorLabel} ${activeSessionCopy.roomNoiseUnit}`}
              </Text>
            </View>
          </View>

          <View style={{ paddingBottom: spacing.lg }}>
            {/* Remounting on token change resets the thumb to the start (ADR-30). */}
            <SlideToEnd
              key={slideResetToken}
              onEnd={onEndSession}
              testID="active-session-slide-to-end"
            />
          </View>
        </View>
      </Screen>
    </GestureHandlerRootView>
  );
}
