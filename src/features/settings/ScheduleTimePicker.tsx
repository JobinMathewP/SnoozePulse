import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { SegmentedControl } from '@/components/ui';
import { TOUCH_TARGET } from '@/components/ui/touchTarget';
import { colors, fontFamily, fontSize, lineHeight, radius, spacing } from '@/theme';
import type { LocalTimeOfDay } from '@/types';

import { settingsCopy } from './copy';
import {
  formatLocalTimeDisplay,
  toTwelveHour,
  toTwentyFour,
  type DayPeriod,
  type TwelveHourTime,
} from './formatTime';

type ScheduleTimePickerProps = {
  readonly title: string;
  readonly value: LocalTimeOfDay;
  readonly onSave: (time: LocalTimeOfDay) => void;
  readonly onCancel: () => void;
  readonly testID?: string;
};

const MINUTE_STEP = 5;

/**
 * Local wall-clock picker for bedtime / wake time. No extra native date-picker
 * dependency — hour, minute, and AM/PM steppers using existing tokens.
 */
export function ScheduleTimePicker({
  title,
  value,
  onSave,
  onCancel,
  testID,
}: ScheduleTimePickerProps) {
  const [draft, setDraft] = useState<TwelveHourTime>(() => toTwelveHour(value));

  const display = formatLocalTimeDisplay(toTwentyFour(draft));

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      testID={testID}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={settingsCopy.timePickerCancelAccessibilityLabel}
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: colors.scrim,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.lg,
        }}
      >
        <Pressable
          onPress={() => undefined}
          style={{
            width: '100%',
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.borderCard,
            padding: spacing.lg,
            gap: spacing.md,
          }}
        >
          <Text
            accessibilityRole="header"
            style={{
              color: colors.fg,
              fontFamily: fontFamily.semibold,
              fontSize: fontSize.title,
              lineHeight: lineHeight.title,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: colors.fg,
              fontFamily: fontFamily.bold,
              fontSize: fontSize.heading,
              lineHeight: lineHeight.heading,
              textAlign: 'center',
            }}
          >
            {display}
          </Text>

          <View style={{ flexDirection: 'row', gap: spacing.md, justifyContent: 'center' }}>
            <Stepper
              label={String(draft.hour12)}
              decreaseLabel={settingsCopy.hourStepperDecreaseLabel}
              increaseLabel={settingsCopy.hourStepperIncreaseLabel}
              onDecrease={() => {
                setDraft((current) => ({
                  ...current,
                  hour12: wrapHour12(current.hour12 - 1),
                }));
              }}
              onIncrease={() => {
                setDraft((current) => ({
                  ...current,
                  hour12: wrapHour12(current.hour12 + 1),
                }));
              }}
              testID={testID ? `${testID}-hour` : undefined}
            />
            <Stepper
              label={String(draft.minutes).padStart(2, '0')}
              decreaseLabel={settingsCopy.minuteStepperDecreaseLabel}
              increaseLabel={settingsCopy.minuteStepperIncreaseLabel}
              onDecrease={() => {
                setDraft((current) => ({
                  ...current,
                  minutes: wrapMinutes(current.minutes - MINUTE_STEP),
                }));
              }}
              onIncrease={() => {
                setDraft((current) => ({
                  ...current,
                  minutes: wrapMinutes(current.minutes + MINUTE_STEP),
                }));
              }}
              testID={testID ? `${testID}-minute` : undefined}
            />
          </View>

          <SegmentedControl<DayPeriod>
            value={draft.period}
            onChange={(period) => {
              setDraft((current) => ({ ...current, period }));
            }}
            options={[
              {
                value: 'am',
                label: settingsCopy.periodAmLabel,
                accessibilityLabel: settingsCopy.periodAmLabel,
              },
              {
                value: 'pm',
                label: settingsCopy.periodPmLabel,
                accessibilityLabel: settingsCopy.periodPmLabel,
              },
            ]}
            testID={testID ? `${testID}-period` : undefined}
          />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              gap: spacing.sm,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={settingsCopy.timePickerCancelAccessibilityLabel}
              onPress={onCancel}
              style={{
                minHeight: TOUCH_TARGET,
                paddingHorizontal: spacing.md,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              testID={testID ? `${testID}-cancel` : undefined}
            >
              <Text
                style={{
                  color: colors.fgBody,
                  fontFamily: fontFamily.medium,
                  fontSize: fontSize.body,
                }}
              >
                {settingsCopy.timePickerCancelLabel}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={settingsCopy.timePickerSaveAccessibilityLabel}
              onPress={() => {
                onSave(toTwentyFour(draft));
              }}
              style={{
                minHeight: TOUCH_TARGET,
                paddingHorizontal: spacing.md,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
              }}
              testID={testID ? `${testID}-save` : undefined}
            >
              <Text
                style={{
                  color: colors.fg,
                  fontFamily: fontFamily.semibold,
                  fontSize: fontSize.body,
                }}
              >
                {settingsCopy.timePickerSaveLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function wrapHour12(hour: number): number {
  if (hour > 12) {
    return 1;
  }
  if (hour < 1) {
    return 12;
  }
  return hour;
}

function wrapMinutes(minutes: number): number {
  return ((minutes % 60) + 60) % 60;
}

function Stepper({
  label,
  decreaseLabel,
  increaseLabel,
  onDecrease,
  onIncrease,
  testID,
}: {
  readonly label: string;
  readonly decreaseLabel: string;
  readonly increaseLabel: string;
  readonly onDecrease: () => void;
  readonly onIncrease: () => void;
  readonly testID?: string;
}) {
  return (
    <View style={{ alignItems: 'center', gap: spacing.xs }} testID={testID}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={increaseLabel}
        onPress={onIncrease}
        style={{
          width: TOUCH_TARGET,
          height: TOUCH_TARGET,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        testID={testID ? `${testID}-inc` : undefined}
      >
        <Ionicons name="chevron-up" size={fontSize.title} color={colors.settingsAccent} />
      </Pressable>
      <Text
        style={{
          color: colors.fg,
          fontFamily: fontFamily.semibold,
          fontSize: fontSize.title,
          lineHeight: lineHeight.title,
          minWidth: spacing.xl + spacing.md,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={decreaseLabel}
        onPress={onDecrease}
        style={{
          width: TOUCH_TARGET,
          height: TOUCH_TARGET,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        testID={testID ? `${testID}-dec` : undefined}
      >
        <Ionicons name="chevron-down" size={fontSize.title} color={colors.settingsAccent} />
      </Pressable>
    </View>
  );
}
