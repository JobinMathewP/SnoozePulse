import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TOUCH_TARGET } from '@/components/ui/touchTarget';
import { colors, fontFamily, fontSize, lineHeight, radius, spacing } from '@/theme';

import { HighlightHeading } from './HighlightHeading';
import { OnboardingCta } from './OnboardingCta';
import { PhotoBackdrop } from './PhotoBackdrop';
import { PrivacyHero } from './PrivacyHero';
import { ProfileHero } from './ProfileHero';
import { ProgressDots } from './ProgressDots';
import { ONBOARDING_SLIDE_COUNT, onboardingCopy } from './copy';

const WELCOME_BG = require('../../../assets/images/onboarding/welcome-bg.png') as number;
const AI_BG = require('../../../assets/images/onboarding/ai-bg.png') as number;
const LOGO = require('../../../assets/images/onboarding/logo.png') as number;

/** Mockup logo band is ~120–140 dp; four spacing.xl steps lands in that range. */
const LOGO_SIZE = spacing.xl * 4;
/** Compact profile disc while the keyboard is open so the field stays above it. */
const PROFILE_HERO_COMPACT = spacing.xl * 3;

type OnboardingScreenProps = {
  /**
   * Called when the user finishes (or skips) onboarding. `name` is the trimmed greeting
   * name, or `null` when skipped/blank. The route persists it and redirects.
   */
  readonly onComplete: (name: string | null) => void;
};

const SLIDES = onboardingCopy.slides;
const LAST_INDEX = ONBOARDING_SLIDE_COUNT - 1;
const welcome = SLIDES[0];
const ai = SLIDES[1];
const privacy = SLIDES[2];
const nameSlide = SLIDES[3];

/**
 * Four-slide illustrated first-run flow (ADR-30). Step index, not a pager library. No top
 * Skip or Back; Skip for now lives only under the last CTA. The medical disclaimer is a
 * caption on Privacy, not a fifth screen.
 */
export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [index, setIndex] = useState(0);
  const [name, setName] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const isLast = index === LAST_INDEX;
  const slide = SLIDES[index];
  const compactName = isLast && keyboardVisible;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!compactName) {
      return;
    }
    const handle = requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(handle);
  }, [compactName]);

  const goNext = () => {
    if (isLast) {
      const trimmed = name.trim();
      onComplete(trimmed.length > 0 ? trimmed : null);
      return;
    }
    setIndex((current) => Math.min(LAST_INDEX, current + 1));
  };

  const skip = () => {
    onComplete(null);
  };

  return (
    <View
      testID="onboarding-screen"
      style={{ flex: 1, backgroundColor: colors.bgApp }}
    >
      {index === 0 ? <PhotoBackdrop source={WELCOME_BG} /> : null}
      {index === 1 ? <PhotoBackdrop source={AI_BG} /> : null}

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'right', 'bottom', 'left']}>
        {/*
          iOS: pad the layout above the keyboard.
          Android: window resizes via softwareKeyboardLayoutMode=resize; KAV stays off to
          avoid double insets. ScrollView + compact name layout keep the field clear.
        */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
          enabled={isLast && Platform.OS === 'ios'}
        >
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: spacing.md,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <ProgressDots
              count={ONBOARDING_SLIDE_COUNT}
              index={index}
              accessibilityLabel={onboardingCopy.progressAccessibilityLabel(
                index + 1,
                ONBOARDING_SLIDE_COUNT,
              )}
            />

            <View style={{ flexGrow: 1 }}>
              {slide.key === 'welcome' ? <WelcomeBody /> : null}
              {slide.key === 'ai' ? <AiBody /> : null}
              {slide.key === 'privacy' ? <PrivacyBody /> : null}
              {slide.key === 'name' ? (
                <NameBody
                  name={name}
                  onChangeName={setName}
                  onSubmit={goNext}
                  compact={compactName}
                />
              ) : null}
            </View>

            <View style={{ gap: spacing.sm, paddingBottom: spacing.lg, paddingTop: spacing.md }}>
              <OnboardingCta
                label={slide.cta}
                accessibilityLabel={slide.ctaAccessibilityLabel}
                onPress={goNext}
                testID="onboarding-next"
              />
              {slide.key === 'welcome' ? (
                <Text
                  style={{
                    color: colors.fgCaption,
                    fontFamily: fontFamily.regular,
                    fontSize: fontSize.caption,
                    lineHeight: lineHeight.caption,
                    textAlign: 'center',
                  }}
                >
                  {welcome.caption}
                </Text>
              ) : null}
              {slide.key === 'name' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={nameSlide.skipAccessibilityLabel}
                  onPress={skip}
                  hitSlop={spacing.sm}
                  style={{ minHeight: TOUCH_TARGET, justifyContent: 'center', alignItems: 'center' }}
                  testID="onboarding-skip"
                >
                  <Text
                    style={{
                      color: colors.onboardAccent,
                      fontFamily: fontFamily.semibold,
                      fontSize: fontSize.body,
                      lineHeight: lineHeight.body,
                    }}
                  >
                    {nameSlide.skipLabel}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function WelcomeBody() {
  return (
    <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md }}>
      <Image
        source={LOGO}
        style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
        contentFit="contain"
        accessibilityLabel="SnoozePulse logo"
      />
      <Text
        accessibilityRole="header"
        style={{
          color: colors.fg,
          fontFamily: fontFamily.bold,
          fontSize: fontSize.heading,
          lineHeight: lineHeight.heading,
          textAlign: 'center',
        }}
      >
        {welcome.title}
      </Text>
      <Text
        style={{
          color: colors.fgBody,
          fontFamily: fontFamily.regular,
          fontSize: fontSize.bodyLg,
          lineHeight: lineHeight.bodyLg,
          textAlign: 'center',
          paddingHorizontal: spacing.md,
        }}
      >
        {welcome.subtitle}
      </Text>
    </View>
  );
}

function AiBody() {
  return (
    <View style={{ flexGrow: 1, justifyContent: 'flex-end', gap: spacing.md, paddingBottom: spacing.lg }}>
      <HighlightHeading parts={ai.heading} />
      <Text
        style={{
          color: colors.fgBody,
          fontFamily: fontFamily.regular,
          fontSize: fontSize.body,
          lineHeight: lineHeight.body,
          textAlign: 'center',
        }}
      >
        {ai.body}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.sm }}>
        {ai.features.map((feature) => (
          <View key={feature.label} style={{ flex: 1, alignItems: 'center', gap: spacing.sm }}>
            <Ionicons
              name={feature.icon}
              size={fontSize.display}
              color={colors.onboardAccentMuted}
            />
            <Text
              style={{
                color: colors.fg,
                fontFamily: fontFamily.medium,
                fontSize: fontSize.caption,
                lineHeight: lineHeight.caption,
                textAlign: 'center',
              }}
            >
              {feature.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PrivacyBody() {
  return (
    <View style={{ flexGrow: 1, justifyContent: 'center', gap: spacing.md }}>
      <HighlightHeading parts={privacy.heading} />
      <View style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
        <PrivacyHero />
      </View>
      <View style={{ gap: spacing.md }}>
        {privacy.bullets.map((bullet) => (
          <View
            key={bullet.label}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
          >
            <Ionicons
              name={bullet.icon}
              size={fontSize.title}
              color={colors.onboardAccentMuted}
            />
            <Text
              style={{
                flex: 1,
                color: colors.fg,
                fontFamily: fontFamily.medium,
                fontSize: fontSize.body,
                lineHeight: lineHeight.body,
              }}
            >
              {bullet.label}
            </Text>
          </View>
        ))}
      </View>
      <Text
        style={{
          color: colors.fgCaption,
          fontFamily: fontFamily.regular,
          fontSize: fontSize.caption,
          lineHeight: lineHeight.caption,
          textAlign: 'center',
        }}
      >
        {privacy.medicalCaption}
      </Text>
    </View>
  );
}

type NameBodyProps = {
  readonly name: string;
  readonly onChangeName: (value: string) => void;
  readonly onSubmit: () => void;
  /** Shrink the hero and pin content up so the field stays above the keyboard. */
  readonly compact: boolean;
};

function NameBody({ name, onChangeName, onSubmit, compact }: NameBodyProps) {
  return (
    <View
      style={{
        flexGrow: 1,
        justifyContent: compact ? 'flex-start' : 'center',
        gap: compact ? spacing.sm : spacing.md,
        paddingTop: compact ? spacing.sm : 0,
      }}
    >
      <HighlightHeading parts={nameSlide.heading} />
      {!compact ? (
        <View style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
          <ProfileHero />
        </View>
      ) : (
        <View style={{ alignItems: 'center' }}>
          <ProfileHero size={PROFILE_HERO_COMPACT} />
        </View>
      )}
      {!compact ? (
        <Text
          style={{
            color: colors.fgBody,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.body,
            lineHeight: lineHeight.body,
            textAlign: 'center',
          }}
        >
          {nameSlide.body}
        </Text>
      ) : null}
      <View style={{ gap: spacing.xs }}>
        <Text
          style={{
            color: colors.fgCaption,
            fontFamily: fontFamily.medium,
            fontSize: fontSize.body,
            lineHeight: lineHeight.body,
          }}
        >
          {nameSlide.nameLabel}
        </Text>
        <View
          style={{
            minHeight: TOUCH_TARGET,
            borderRadius: radius.md,
            backgroundColor: colors.onboardInputFill,
            borderWidth: 1,
            borderColor: colors.borderCard,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            gap: spacing.sm,
          }}
        >
          <Ionicons name="person-outline" size={fontSize.bodyLg} color={colors.fgCaption} />
          <TextInput
            value={name}
            onChangeText={onChangeName}
            placeholder={nameSlide.namePlaceholder}
            placeholderTextColor={colors.fgCaption}
            accessibilityLabel={nameSlide.nameAccessibilityLabel}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
            maxLength={40}
            style={{
              flex: 1,
              minHeight: TOUCH_TARGET,
              color: colors.fg,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.body,
            }}
            testID="onboarding-name-input"
          />
        </View>
        <Text
          style={{
            color: colors.fgCaption,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.caption,
            lineHeight: lineHeight.caption,
          }}
        >
          {nameSlide.nameHelper}
        </Text>
      </View>
    </View>
  );
}
