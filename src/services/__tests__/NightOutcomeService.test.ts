import { NightOutcomeService } from '@/services/NightOutcomeService';
import { FakeSettingsRepository } from '@/__tests__/helpers/fakes';

function build() {
  const repo = new FakeSettingsRepository();
  const service = new NightOutcomeService(repo);
  return { repo, service };
}

describe('NightOutcomeService', () => {
  it('returns null when no missed night is stored', async () => {
    const { service } = build();
    const result = await service.getMissedNight();
    expect(result.ok && result.value).toBeNull();
  });

  it('round-trips a missed night', async () => {
    const { service } = build();
    const written = await service.recordMissedNight('battery', '2026-08-21', 1_000);
    expect(written.ok && written.value).toEqual({
      reason: 'battery',
      nightIso: '2026-08-21',
      atMs: 1_000,
    });

    const loaded = await service.getMissedNight();
    expect(loaded.ok && loaded.value).toEqual({
      reason: 'battery',
      nightIso: '2026-08-21',
      atMs: 1_000,
    });
  });

  it('keeps the first cause for the same night', async () => {
    const { service } = build();
    await service.recordMissedNight('battery', '2026-08-21', 1_000);
    const second = await service.recordMissedNight('microphone', '2026-08-21', 2_000);
    expect(second.ok && second.value.reason).toBe('battery');
    expect(second.ok && second.value.atMs).toBe(1_000);
  });

  it('replaces a miss when the night changes', async () => {
    const { service } = build();
    await service.recordMissedNight('battery', '2026-08-21', 1_000);
    const next = await service.recordMissedNight('schedule', '2026-08-22', 3_000);
    expect(next.ok && next.value).toEqual({
      reason: 'schedule',
      nightIso: '2026-08-22',
      atMs: 3_000,
    });
  });

  it('treats corrupt JSON as unset', async () => {
    const { service, repo } = build();
    repo.store.set('night.missed', '{not-json');
    const result = await service.getMissedNight();
    expect(result.ok && result.value).toBeNull();
  });

  it('clears the stored miss', async () => {
    const { service } = build();
    await service.recordMissedNight('engine', '2026-08-21', 1_000);
    const cleared = await service.clearMissedNight();
    expect(cleared.ok).toBe(true);
    const loaded = await service.getMissedNight();
    expect(loaded.ok && loaded.value).toBeNull();
  });
});
