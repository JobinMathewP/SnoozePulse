import { SleepScheduleService } from '@/services/SleepScheduleService';
import { FakeSettingsRepository } from '@/__tests__/helpers/fakes';

function build() {
  const repo = new FakeSettingsRepository();
  const service = new SleepScheduleService(repo);
  return { repo, service };
}

describe('SleepScheduleService', () => {
  it('defaults to no schedule and automatic tracking off on a fresh install', async () => {
    const { service } = build();
    const result = await service.getSchedule();
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.bedtime).toBeNull();
    expect(result.value.wakeTime).toBeNull();
    expect(result.value.automaticTrackingEnabled).toBe(false);
  });

  it('round-trips a local bedtime without converting through UTC', async () => {
    const { service, repo } = build();
    const written = await service.setBedtime({ hours: 23, minutes: 30 });
    expect(written.ok).toBe(true);

    expect(repo.store.get('schedule.bedtime')).toBe('23:30');

    const result = await service.getSchedule();
    expect(result.ok && result.value.bedtime).toEqual({ hours: 23, minutes: 30 });
  });

  it('round-trips a local wake time', async () => {
    const { service, repo } = build();
    await service.setWakeTime({ hours: 7, minutes: 0 });
    expect(repo.store.get('schedule.wakeTime')).toBe('07:00');

    const result = await service.getSchedule();
    expect(result.ok && result.value.wakeTime).toEqual({ hours: 7, minutes: 0 });
  });

  it('clears a time when set to null', async () => {
    const { service } = build();
    await service.setBedtime({ hours: 22, minutes: 15 });
    await service.setBedtime(null);
    const result = await service.getSchedule();
    expect(result.ok && result.value.bedtime).toBeNull();
  });

  it('rejects an invalid wall-clock time and does not persist it', async () => {
    const { service, repo } = build();
    const result = await service.setBedtime({ hours: 24, minutes: 0 });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe('PERSISTENCE');
    expect(repo.store.has('schedule.bedtime')).toBe(false);
  });

  it('treats a corrupt stored time as unset rather than crashing', async () => {
    const { service, repo } = build();
    repo.store.set('schedule.bedtime', 'not-a-time');
    const result = await service.getSchedule();
    expect(result.ok && result.value.bedtime).toBeNull();
  });

  it('does not enable automatic tracking until the user opts in', async () => {
    const { service } = build();
    const before = await service.getSchedule();
    expect(before.ok && before.value.automaticTrackingEnabled).toBe(false);

    await service.setAutomaticTrackingEnabled(true);
    const enabled = await service.getSchedule();
    expect(enabled.ok && enabled.value.automaticTrackingEnabled).toBe(true);

    await service.setAutomaticTrackingEnabled(false);
    const disabled = await service.getSchedule();
    expect(disabled.ok && disabled.value.automaticTrackingEnabled).toBe(false);
  });

  it('treats any stored value other than true as automatic tracking off', async () => {
    const { service, repo } = build();
    repo.store.set('schedule.automaticTrackingEnabled', 'yes');
    const result = await service.getSchedule();
    expect(result.ok && result.value.automaticTrackingEnabled).toBe(false);
  });
});
