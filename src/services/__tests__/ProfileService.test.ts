import { ProfileService } from '@/services/ProfileService';
import { FakeSettingsRepository } from '@/__tests__/helpers/fakes';

function build() {
  const repo = new FakeSettingsRepository();
  const service = new ProfileService(repo);
  return { repo, service };
}

describe('ProfileService', () => {
  it('defaults to a skipped, un-onboarded profile on a fresh install', async () => {
    const { service } = build();
    const result = await service.getProfile();
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.displayName).toBeNull();
    expect(result.value.onboarded).toBe(false);
  });

  it('trims and persists a display name', async () => {
    const { service } = build();
    await service.setDisplayName('  Sam  ');
    const result = await service.getProfile();
    expect(result.ok && result.value.displayName).toBe('Sam');
  });

  it('clears the name when set to blank', async () => {
    const { service } = build();
    await service.setDisplayName('Sam');
    await service.setDisplayName('   ');
    const result = await service.getProfile();
    expect(result.ok && result.value.displayName).toBeNull();
  });

  it('caps very long names at 40 characters', async () => {
    const { service } = build();
    await service.setDisplayName('a'.repeat(100));
    const result = await service.getProfile();
    expect(result.ok && result.value.displayName?.length).toBe(40);
  });

  it('marks onboarding complete', async () => {
    const { service } = build();
    await service.completeOnboarding();
    const result = await service.getProfile();
    expect(result.ok && result.value.onboarded).toBe(true);
  });
});
