import { settingsCopy } from '../copy';

describe('settings copy', () => {
  it('keeps the mockup header and profile chrome', () => {
    expect(settingsCopy.title).toBe('Settings');
    expect(settingsCopy.subtitle).toBe('Manage your preferences and data');
    expect(settingsCopy.profileSectionTitle).toBe('Profile');
    expect(settingsCopy.nameEditLabel).toBe('Edit');
  });

  it('keeps the medical disclaimer non-clinical except the required wellness wording', () => {
    expect(settingsCopy.disclaimerTitle).toBe('Wellness, not medical advice');
    expect(settingsCopy.disclaimerBody.toLowerCase()).toContain('not a medical device');
  });
});
