import { useEffect, useState } from 'react';
import { Switch, Text } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { useAppStore } from '@/hooks';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';
import type { LocalTimeOfDay } from '@/types';

import { settingsCopy } from './copy';
import { DEFAULT_BEDTIME, DEFAULT_WAKE_TIME, formatLocalTimeDisplay } from './formatTime';
import { ScheduleTimePicker } from './ScheduleTimePicker';
import { SettingsDivider, SettingsRow, SettingsSection } from './SettingsRow';

type EditingField = 'bedtime' | 'wake';

/**
 * Sleep schedule + automatic-tracking opt-in. Persistence goes through the store
 * (ADR-12). Tracking stays off until the user flips the switch.
 */
export function SleepScheduleSection() {
  const {
    bedtime,
    wakeTime,
    automaticTrackingEnabled,
    loadSchedule,
    setBedtime,
    setWakeTime,
    setAutomaticTrackingEnabled,
  } = useAppStore(
    useShallow((state) => ({
      bedtime: state.bedtime,
      wakeTime: state.wakeTime,
      automaticTrackingEnabled: state.automaticTrackingEnabled,
      loadSchedule: state.loadSchedule,
      setBedtime: state.setBedtime,
      setWakeTime: state.setWakeTime,
      setAutomaticTrackingEnabled: state.setAutomaticTrackingEnabled,
    })),
  );

  const [editing, setEditing] = useState<EditingField | null>(null);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  const bedtimeDisplay = bedtime ? formatLocalTimeDisplay(bedtime) : settingsCopy.timeUnset;
  const wakeDisplay = wakeTime ? formatLocalTimeDisplay(wakeTime) : settingsCopy.timeUnset;
  const pickerValue: LocalTimeOfDay =
    editing === 'wake' ? (wakeTime ?? DEFAULT_WAKE_TIME) : (bedtime ?? DEFAULT_BEDTIME);

  const onSaveTime = (time: LocalTimeOfDay) => {
    const field = editing;
    setEditing(null);
    if (field === 'bedtime') {
      void setBedtime(time);
    } else if (field === 'wake') {
      void setWakeTime(time);
    }
  };

  return (
    <>
      <SettingsSection
        title={settingsCopy.sleepSectionTitle}
        footer={
          <Text
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
              paddingHorizontal: spacing.xs,
            }}
          >
            {settingsCopy.automaticTrackingPrivacy}
          </Text>
        }
      >
        <Text
          style={{
            color: colors.fgCaption,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.caption,
            lineHeight: lineHeight.caption,
            paddingTop: spacing.md,
          }}
        >
          {settingsCopy.sleepSectionPrompt}
        </Text>
        <SettingsRow
          label={settingsCopy.bedtimeLabel}
          accessibilityLabel={settingsCopy.bedtimeAccessibilityLabel(bedtimeDisplay)}
          icon={{ ion: 'moon-outline' }}
          variant="nav"
          accessory={<TimeValue text={bedtimeDisplay} />}
          onPress={() => {
            setEditing('bedtime');
          }}
          testID="settings-bedtime"
        />
        <SettingsDivider />
        <SettingsRow
          label={settingsCopy.wakeLabel}
          accessibilityLabel={settingsCopy.wakeAccessibilityLabel(wakeDisplay)}
          icon={{ ion: 'sunny-outline' }}
          variant="nav"
          accessory={<TimeValue text={wakeDisplay} />}
          onPress={() => {
            setEditing('wake');
          }}
          testID="settings-wake"
        />
        <SettingsDivider />
        <SettingsRow
          label={settingsCopy.automaticTrackingLabel}
          description={settingsCopy.automaticTrackingDescription}
          accessibilityLabel={settingsCopy.automaticTrackingAccessibilityLabel}
          accessibilityRole="switch"
          checked={automaticTrackingEnabled}
          icon={{ ion: 'scan-outline' }}
          variant="none"
          isolateAccessory
          accessory={
            <Switch
              value={automaticTrackingEnabled}
              onValueChange={(enabled) => {
                void setAutomaticTrackingEnabled(enabled);
              }}
              accessibilityElementsHidden
              importantForAccessibility="no"
              trackColor={{ false: colors.settingsCardBorder, true: colors.primary }}
              thumbColor={colors.fg}
              ios_backgroundColor={colors.settingsCardBorder}
              testID="settings-automatic-tracking-switch"
            />
          }
          onPress={() => {
            void setAutomaticTrackingEnabled(!automaticTrackingEnabled);
          }}
          testID="settings-automatic-tracking"
        />
      </SettingsSection>

      {editing !== null ? (
        <ScheduleTimePicker
          title={editing === 'wake' ? settingsCopy.wakeLabel : settingsCopy.bedtimeLabel}
          value={pickerValue}
          onSave={onSaveTime}
          onCancel={() => {
            setEditing(null);
          }}
          testID="settings-time-picker"
        />
      ) : null}
    </>
  );
}

function TimeValue({ text }: { readonly text: string }) {
  return (
    <Text
      style={{
        color: colors.fgCaption,
        fontFamily: fontFamily.medium,
        fontSize: fontSize.body,
        lineHeight: lineHeight.body,
      }}
    >
      {text}
    </Text>
  );
}
