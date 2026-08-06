import { Ionicons } from '@expo/vector-icons';
import { useBatteryLevel } from 'expo-battery';
import { useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, Screen, StatusCard } from '@/components/ui';
import { TOUCH_TARGET } from '@/components/ui/touchTarget';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';

import { BrandMark, HeroMoonIcon } from './BrandMark';
import {
  BATTERY_LOW_THRESHOLD,
  batteryCopy,
  homeCopy,
  mockCalibrationStatus,
  mockMicrophoneStatus,
} from './mock';
import { BatteryPercent, StatusCheck, StatusGlyph } from './StatusAffordance';

function batteryIconName(level: number, isLow: boolean): keyof typeof Ionicons.glyphMap {
  if (isLow || level < 0.25) {
    return 'battery-dead-outline';
  }
  if (level < 0.6) {
    return 'battery-half-outline';
  }
  return 'battery-full-outline';
}

/**
 * Home landing: brand header, hero start control, and three readiness cards.
 *
 * Maps to docs/home-screen.jpg (ADR-08 branding). Battery is live; mic and calibration
 * are mock until later milestones.
 */
export function HomeScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const batteryLevel = useBatteryLevel();

  const levelKnown = batteryLevel >= 0;
  const level = levelKnown ? batteryLevel : 1;
  const percent = levelKnown ? Math.round(batteryLevel * 100) : null;
  const batteryLow = levelKnown && batteryLevel <= BATTERY_LOW_THRESHOLD;
  const batteryTone = batteryLow ? 'alert' : 'success';
  const batteryColor = batteryLow ? colors.alertText : colors.successText;

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
  }, [navigation, router]);

  return (
    <Screen variant="scroll" background="app" edges={['left', 'right', 'bottom']} testID="home-screen">
      <View style={{ alignItems: 'center', paddingTop: spacing.lg, gap: spacing.sm }}>
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
            lineHeight: lineHeight.bodyLg,
            textAlign: 'center',
            paddingHorizontal: spacing.lg,
            maxWidth: spacing.xl * 10,
          }}
        >
          {homeCopy.subhead}
        </Text>
      </View>

      <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
        <Button
          variant="hero"
          label={homeCopy.heroLabel}
          sublabel={homeCopy.heroSublabel}
          accessibilityLabel={homeCopy.heroAccessibilityLabel}
          icon={<HeroMoonIcon />}
          onPress={() => {
            router.push('/session/active');
          }}
          testID="home-start-session"
        />
      </View>

      <View style={{ gap: spacing.sm, paddingBottom: spacing.md }}>
        <StatusCard
          tone={batteryTone}
          title={batteryLow ? batteryCopy.lowTitle : batteryCopy.okTitle}
          subtitle={batteryLow ? batteryCopy.lowSubtitle : batteryCopy.okSubtitle}
          icon={<StatusGlyph name={batteryIconName(level, batteryLow)} color={batteryColor} />}
          trailing={<BatteryPercent percent={percent} color={batteryColor} />}
          accessibilityLabel={
            percent === null
              ? `${batteryLow ? batteryCopy.lowTitle : batteryCopy.okTitle}. Battery level unavailable.`
              : `${batteryLow ? batteryCopy.lowTitle : batteryCopy.okTitle}. ${percent} percent.`
          }
          testID="home-status-battery"
        />
        <StatusCard
          tone={mockMicrophoneStatus.tone}
          title={mockMicrophoneStatus.title}
          subtitle={mockMicrophoneStatus.subtitle}
          icon={<StatusGlyph name="mic-outline" color={colors.successText} />}
          trailing={<StatusCheck />}
          testID="home-status-microphone"
        />
        <StatusCard
          tone={mockCalibrationStatus.tone}
          title={mockCalibrationStatus.title}
          subtitle={mockCalibrationStatus.subtitle}
          icon={<StatusGlyph name="pulse-outline" color={colors.primary} />}
          trailing={<StatusCheck />}
          testID="home-status-calibration"
        />
      </View>
    </Screen>
  );
}
