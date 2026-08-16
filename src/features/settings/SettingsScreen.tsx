import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, Text, TextInput, View } from 'react-native';

import { ConfirmDialog, InfoDialog, Screen } from '@/components/ui';
import { TOUCH_TARGET } from '@/components/ui/touchTarget';
import { useProfile, useSettings } from '@/hooks';
import { colors, fontFamily, fontSize, lineHeight, radius, shadows, spacing } from '@/theme';

import { settingsCopy, settingsUrls } from './copy';
import { SettingsDivider, SettingsRow, SettingsSection } from './SettingsRow';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

const MOON = require('../../../assets/images/settings/moon.png') as number;
const PRIVACY = require('../../../assets/images/settings/privacy.png') as number;
const WELLNESS = require('../../../assets/images/settings/wellness.png') as number;

const MOON_SIZE = spacing.xl * 3;
const BACK_SIZE = TOUCH_TARGET;
const AVATAR_SIZE = spacing.xl + spacing.md;

/**
 * Settings — App Store compliance surface (ADR-30) with illustrated chrome matching
 * assets/new_images/settings-screen.png. Reads/writes go through the store (ADR-12).
 */
export function SettingsScreen() {
  const router = useRouter();
  const { displayName, setDisplayName, rateApp } = useProfile();
  const { deleteAllSleepData, seedDemoData } = useSettings();

  const [name, setName] = useState(displayName ?? '');
  const [editingName, setEditingName] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [retentionOpen, setRetentionOpen] = useState(false);
  const [dataStatus, setDataStatus] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const shownName = (displayName ?? '').trim();

  const onSaveName = () => {
    void (async () => {
      const result = await setDisplayName(name);
      if (result.ok) {
        setEditingName(false);
      }
    })();
  };

  const openUrl = (url: string) => {
    void Linking.openURL(url);
  };

  const onConfirmDelete = () => {
    setConfirmDelete(false);
    void (async () => {
      const result = await deleteAllSleepData();
      setDataStatus(result.ok ? settingsCopy.deleteDoneLabel : settingsCopy.deleteErrorLabel);
    })();
  };

  const onSeedDemoData = () => {
    if (seeding) {
      return;
    }
    setSeeding(true);
    setDataStatus(null);
    void (async () => {
      const result = await seedDemoData();
      setSeeding(false);
      setDataStatus(
        result.ok
          ? `Added ${result.value} demo nights. Open the calendar to see them.`
          : 'Could not add demo data.',
      );
    })();
  };

  return (
    <Screen
      variant="scroll"
      background="app"
      edges={['top', 'left', 'right', 'bottom']}
      contentContainerStyle={{ gap: spacing.lg, paddingTop: spacing.sm }}
      testID="settings-screen"
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={settingsCopy.backAccessibilityLabel}
          onPress={() => {
            router.back();
          }}
          style={{
            width: BACK_SIZE,
            height: BACK_SIZE,
            borderRadius: radius.full,
            backgroundColor: colors.settingsCard,
            borderWidth: 1,
            borderColor: colors.settingsCardBorder,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          testID="settings-back"
        >
          <Ionicons name="chevron-back" size={fontSize.title} color={colors.fg} />
        </Pressable>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text
            accessibilityRole="header"
            style={{
              color: colors.fg,
              fontFamily: fontFamily.bold,
              fontSize: fontSize.heading,
              lineHeight: lineHeight.heading,
            }}
          >
            {settingsCopy.title}
          </Text>
          <Text
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.caption,
              lineHeight: lineHeight.caption,
            }}
          >
            {settingsCopy.subtitle}
          </Text>
        </View>
        <Image
          source={MOON}
          contentFit="contain"
          style={{ width: MOON_SIZE, height: MOON_SIZE }}
          accessibilityLabel="Decorative moon"
        />
      </View>

      <SettingsSection
        title={settingsCopy.profileSectionTitle}
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
            {settingsCopy.nameHint}
          </Text>
        }
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            paddingVertical: spacing.md,
          }}
        >
          <View
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: radius.full,
              backgroundColor: colors.settingsAccent,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadows.settingsGlow,
            }}
          >
            <Ionicons name="person" size={fontSize.title} color={colors.fg} />
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text
              style={{
                color: colors.fgCaption,
                fontFamily: fontFamily.medium,
                fontSize: fontSize.caption,
              }}
            >
              {settingsCopy.nameLabel}
            </Text>
            {editingName ? (
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={settingsCopy.namePlaceholder}
                placeholderTextColor={colors.fgCaption}
                accessibilityLabel={settingsCopy.nameAccessibilityLabel}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={onSaveName}
                maxLength={40}
                autoFocus
                style={{
                  minHeight: TOUCH_TARGET,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.settingsCardBorder,
                  backgroundColor: colors.settingsIconTile,
                  paddingHorizontal: spacing.md,
                  color: colors.fg,
                  fontFamily: fontFamily.regular,
                  fontSize: fontSize.body,
                }}
                testID="settings-name-input"
              />
            ) : (
              <Text
                style={{
                  color: colors.fg,
                  fontFamily: fontFamily.semibold,
                  fontSize: fontSize.bodyLg,
                  lineHeight: lineHeight.bodyLg,
                }}
              >
                {shownName.length > 0 ? shownName : settingsCopy.nameEmptyValue}
              </Text>
            )}
          </View>
          {editingName ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={settingsCopy.nameSaveAccessibilityLabel}
              onPress={onSaveName}
              style={{
                minHeight: TOUCH_TARGET,
                paddingHorizontal: spacing.sm,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              testID="settings-name-save"
            >
              <Text
                style={{
                  color: colors.settingsAccent,
                  fontFamily: fontFamily.semibold,
                  fontSize: fontSize.body,
                }}
              >
                {settingsCopy.nameSaveLabel}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={settingsCopy.nameEditAccessibilityLabel}
              onPress={() => {
                setName(displayName ?? '');
                setEditingName(true);
              }}
              style={{
                minHeight: TOUCH_TARGET,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                paddingHorizontal: spacing.md,
                borderRadius: radius.full,
                borderWidth: 1,
                borderColor: colors.settingsAccent,
              }}
              testID="settings-name-edit"
            >
              <Ionicons name="pencil" size={fontSize.body} color={colors.settingsAccent} />
              <Text
                style={{
                  color: colors.fg,
                  fontFamily: fontFamily.medium,
                  fontSize: fontSize.body,
                }}
              >
                {settingsCopy.nameEditLabel}
              </Text>
            </Pressable>
          )}
        </View>
      </SettingsSection>

      <SettingsSection title={settingsCopy.dataSectionTitle}>
        <SettingsRow
          label={settingsCopy.retentionTitle}
          description={settingsCopy.retentionBody}
          accessibilityLabel={settingsCopy.retentionAccessibilityLabel}
          icon={{ image: PRIVACY, imageAccessibilityLabel: settingsCopy.retentionTitle }}
          variant="nav"
          onPress={() => {
            setRetentionOpen(true);
          }}
          testID="settings-retention"
        />
        <SettingsDivider />
        <SettingsRow
          label={settingsCopy.deleteAllLabel}
          accessibilityLabel={settingsCopy.deleteAllAccessibilityLabel}
          icon={{ ion: 'trash-outline' }}
          variant="destructive"
          onPress={() => {
            setConfirmDelete(true);
          }}
          testID="settings-delete-all"
        />
        {dataStatus ? (
          <Text
            accessibilityRole="alert"
            style={{
              color: colors.fgCaption,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.caption,
              paddingBottom: spacing.sm,
            }}
          >
            {dataStatus}
          </Text>
        ) : null}
      </SettingsSection>

      <SettingsSection title={settingsCopy.aboutSectionTitle}>
        <SettingsRow
          label={settingsCopy.disclaimerTitle}
          description={settingsCopy.disclaimerBody}
          accessibilityLabel={settingsCopy.disclaimerTitle}
          icon={{ image: WELLNESS, imageAccessibilityLabel: settingsCopy.disclaimerTitle }}
          variant="none"
        />
      </SettingsSection>

      <SettingsSection title={settingsCopy.legalSectionTitle}>
        <SettingsRow
          label={settingsCopy.privacyLabel}
          accessibilityLabel={settingsCopy.privacyAccessibilityLabel}
          icon={{ ion: 'shield-checkmark-outline' }}
          variant="link"
          onPress={() => {
            openUrl(settingsUrls.privacy);
          }}
          testID="settings-privacy"
        />
        <SettingsDivider />
        <SettingsRow
          label={settingsCopy.termsLabel}
          accessibilityLabel={settingsCopy.termsAccessibilityLabel}
          icon={{ ion: 'document-text-outline' }}
          variant="link"
          onPress={() => {
            openUrl(settingsUrls.terms);
          }}
          testID="settings-terms"
        />
        <SettingsDivider />
        <SettingsRow
          label={settingsCopy.supportLabel}
          accessibilityLabel={settingsCopy.supportAccessibilityLabel}
          icon={{ ion: 'headset-outline' }}
          variant="link"
          onPress={() => {
            openUrl(settingsUrls.support);
          }}
          testID="settings-support"
        />
        <SettingsDivider />
        <SettingsRow
          label={settingsCopy.rateLabel}
          accessibilityLabel={settingsCopy.rateAccessibilityLabel}
          icon={{ ion: 'star-outline' }}
          variant="nav"
          onPress={() => {
            void rateApp();
          }}
          testID="settings-rate"
        />
      </SettingsSection>

      {__DEV__ ? (
        <SettingsSection title="Developer">
          <SettingsRow
            label={seeding ? 'Adding demo data…' : 'Add demo data'}
            accessibilityLabel="Add demo sleep data"
            icon={{ ion: 'code-slash-outline' }}
            variant="nav"
            onPress={onSeedDemoData}
            testID="settings-seed-demo"
          />
        </SettingsSection>
      ) : null}

      <Text
        style={{
          color: colors.fgCaption,
          fontFamily: fontFamily.regular,
          fontSize: fontSize.caption,
          textAlign: 'center',
          paddingBottom: spacing.md,
        }}
      >
        {settingsCopy.versionPrefix}
        {APP_VERSION}
      </Text>

      <ConfirmDialog
        visible={confirmDelete}
        title={settingsCopy.deleteConfirmTitle}
        message={settingsCopy.deleteConfirmBody}
        confirmLabel={settingsCopy.deleteConfirmLabel}
        confirmAccessibilityLabel={settingsCopy.deleteConfirmAccessibilityLabel}
        cancelLabel={settingsCopy.deleteCancelLabel}
        cancelAccessibilityLabel={settingsCopy.deleteCancelAccessibilityLabel}
        destructive
        onConfirm={onConfirmDelete}
        onCancel={() => {
          setConfirmDelete(false);
        }}
        testID="settings-delete-confirm"
      />

      <InfoDialog
        visible={retentionOpen}
        title={settingsCopy.retentionTitle}
        message={settingsCopy.retentionBody}
        dismissLabel={settingsCopy.retentionDismissLabel}
        dismissAccessibilityLabel={settingsCopy.retentionDismissAccessibilityLabel}
        onDismiss={() => {
          setRetentionOpen(false);
        }}
        testID="settings-retention-info"
      />
    </Screen>
  );
}
