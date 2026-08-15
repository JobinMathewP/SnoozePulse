import { headingAccentTexts, ONBOARDING_SLIDE_COUNT, onboardingCopy } from '../copy';

describe('onboarding copy', () => {
  it('is a four-slide flow', () => {
    expect(ONBOARDING_SLIDE_COUNT).toBe(4);
    expect(onboardingCopy.slides.map((slide) => slide.key)).toEqual([
      'welcome',
      'ai',
      'privacy',
      'name',
    ]);
  });

  it('highlights the mockup spans', () => {
    expect(headingAccentTexts(onboardingCopy.slides[1].heading)).toEqual(['while you sleep']);
    expect(headingAccentTexts(onboardingCopy.slides[2].heading)).toEqual(['privacy']);
    expect(headingAccentTexts(onboardingCopy.slides[3].heading)).toEqual(['your experience']);
  });

  it('keeps the medical disclaimer on the privacy slide', () => {
    expect(onboardingCopy.slides[2].medicalCaption).toContain('not a medical device');
  });

  it('keeps marketing copy non-clinical (disclaimer excluded)', () => {
    const privacy = onboardingCopy.slides[2];
    const withoutDisclaimer = { ...privacy, medicalCaption: '' };
    const blob = JSON.stringify([
      onboardingCopy.slides[0],
      onboardingCopy.slides[1],
      withoutDisclaimer,
      onboardingCopy.slides[3],
    ]).toLowerCase();
    expect(blob).not.toMatch(/apnea|diagnos|treatment/);
  });
});
