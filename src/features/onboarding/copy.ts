/**
 * First-run onboarding copy. Four illustrated slides matching assets/new_images/allscreen.png.
 *
 * Wording is non-clinical: no diagnosis, apnea, or treatment claims (App Store Guideline 1.4.1).
 * The medical disclaimer is a caption on the privacy slide, not a fifth screen (ADR-30).
 */

export type HeadingPart = {
  readonly text: string;
  readonly accent?: boolean;
};

export type OnboardingSlideKey = 'welcome' | 'ai' | 'privacy' | 'name';

export const onboardingCopy = {
  slides: [
    {
      key: 'welcome' as const,
      title: 'SnoozePulse',
      subtitle: 'Understand your sleep. Protect your privacy.',
      caption: 'No account. No cloud. 100% private.',
      cta: 'Get Started',
      ctaAccessibilityLabel: 'Get started with SnoozePulse',
    },
    {
      key: 'ai' as const,
      heading: [
        { text: 'AI that listens ' },
        { text: 'while you sleep', accent: true },
      ] satisfies readonly HeadingPart[],
      body: 'SnoozePulse uses on-device AI models to detect snoring — no audio leaves your phone.',
      features: [
        { icon: 'hardware-chip-outline' as const, label: 'On-Device AI Detection' },
        { icon: 'pulse-outline' as const, label: 'Real-time Analysis' },
        { icon: 'shield-checkmark-outline' as const, label: 'Your Data Stays Private' },
      ],
      cta: 'Next',
      ctaAccessibilityLabel: 'Go to the next onboarding step',
    },
    {
      key: 'privacy' as const,
      heading: [
        { text: 'Built for ' },
        { text: 'privacy', accent: true },
        { text: ' by design' },
      ] satisfies readonly HeadingPart[],
      bullets: [
        { icon: 'shield-checkmark-outline' as const, label: 'Everything stays on your device' },
        { icon: 'cut-outline' as const, label: 'We save only short snore clips' },
        { icon: 'person-outline' as const, label: "You're in control, always" },
      ],
      medicalCaption:
        'SnoozePulse is not a medical device and does not diagnose or treat any condition.',
      cta: 'Next',
      ctaAccessibilityLabel: 'Go to the next onboarding step',
    },
    {
      key: 'name' as const,
      heading: [
        { text: "Let's personalize " },
        { text: 'your experience', accent: true },
      ] satisfies readonly HeadingPart[],
      body: "This is optional. Add your name and we'll greet you every morning.",
      nameLabel: 'Your name (optional)',
      namePlaceholder: 'Enter your name',
      nameAccessibilityLabel: 'Your first name, optional',
      nameHelper: 'You can change this later in settings.',
      cta: 'Start Using SnoozePulse',
      ctaAccessibilityLabel: 'Finish onboarding and start using SnoozePulse',
      skipLabel: 'Skip for now',
      skipAccessibilityLabel: 'Skip naming and start using SnoozePulse',
    },
  ],
  progressAccessibilityLabel: (current: number, total: number): string =>
    `Onboarding step ${current} of ${total}`,
} as const;

export const ONBOARDING_SLIDE_COUNT = onboardingCopy.slides.length;

export function headingAccentTexts(parts: readonly HeadingPart[]): readonly string[] {
  return parts.filter((part) => part.accent === true).map((part) => part.text);
}
