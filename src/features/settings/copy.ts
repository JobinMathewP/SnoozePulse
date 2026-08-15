/**
 * Settings copy, external links, and retention text (ADR-30).
 *
 * The three legal/support URLs are the GitHub Pages site tracked in `website/`. They satisfy
 * App Store Guideline 5.1.1 (privacy policy) and the support-URL requirement without an
 * in-app web view — links open in the system browser.
 */
export const settingsUrls = {
  privacy: 'https://jobinmathewp.github.io/SnoozePulse/privacy/',
  terms: 'https://jobinmathewp.github.io/SnoozePulse/terms/',
  support: 'https://jobinmathewp.github.io/SnoozePulse/support/',
} as const;

export const settingsCopy = {
  title: 'Settings',
  subtitle: 'Manage your preferences and data',
  backAccessibilityLabel: 'Go back',

  profileSectionTitle: 'Profile',
  nameLabel: 'Your name',
  namePlaceholder: 'Add a name (optional)',
  nameEmptyValue: 'Add a name',
  nameAccessibilityLabel: 'Your greeting name, optional',
  nameHint: 'Used to greet you on the home screen. Leave blank to keep it neutral.',
  nameEditLabel: 'Edit',
  nameEditAccessibilityLabel: 'Edit your greeting name',
  nameSaveLabel: 'Save',
  nameSaveAccessibilityLabel: 'Save your greeting name',

  retentionAccessibilityLabel: 'On-device storage details',
  retentionDismissLabel: 'OK',
  retentionDismissAccessibilityLabel: 'Dismiss on-device storage details',

  aboutSectionTitle: 'About',
  disclaimerTitle: 'Wellness, not medical advice',
  disclaimerBody:
    'SnoozePulse is a wellness tool for tracking snoring. It is not a medical device and does not diagnose, treat, or monitor any health condition, including sleep apnea. Talk to a healthcare professional about medical concerns.',

  dataSectionTitle: 'Data & privacy',
  retentionTitle: 'On-device storage',
  retentionBody:
    'Everything stays on this phone — there is no account and nothing is uploaded. Audio snippets are kept for 30 days or 500 MB, whichever comes first, then the oldest are removed automatically.',
  deleteAllLabel: 'Delete all sleep data',
  deleteAllAccessibilityLabel: 'Delete all saved sessions and recordings',
  deleteConfirmTitle: 'Delete all sleep data?',
  deleteConfirmBody:
    'This permanently removes every saved session, snore event, and audio snippet on this device. This cannot be undone.',
  deleteConfirmLabel: 'Delete everything',
  deleteConfirmAccessibilityLabel: 'Confirm deleting all sleep data',
  deleteCancelLabel: 'Cancel',
  deleteCancelAccessibilityLabel: 'Keep my sleep data',
  deleteDoneLabel: 'All sleep data deleted.',
  deleteErrorLabel: 'Could not delete data. Please try again.',

  legalSectionTitle: 'Legal & support',
  privacyLabel: 'Privacy Policy',
  privacyAccessibilityLabel: 'Open the privacy policy in your browser',
  termsLabel: 'Terms of Use',
  termsAccessibilityLabel: 'Open the terms of use in your browser',
  supportLabel: 'Support',
  supportAccessibilityLabel: 'Open the support page in your browser',
  rateLabel: 'Rate SnoozePulse',
  rateAccessibilityLabel: 'Open the app rating prompt',

  versionPrefix: 'SnoozePulse v',
} as const;
