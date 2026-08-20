import { AnalyticsService } from '@/services/analytics/AnalyticsService';
import { AudioService } from '@/services/AudioService';
import { ProfileService } from '@/services/ProfileService';
import { ReviewService } from '@/services/ReviewService';
import { SleepScheduleService } from '@/services/SleepScheduleService';
import { SleepService } from '@/services/SleepService';
import { FakeAudioEngine } from '@/services/fakes/FakeAudioEngine';
import { FakeNotificationService } from '@/services/fakes/FakeNotificationService';
import { createAppStore } from '@/store/createAppStore';
import {
  FakeSettingsRepository,
  FakeSleepRepository,
  FakeSnoreRepository,
  FakeSnippetStorage,
} from '@/__tests__/helpers/fakes';

function buildStore(repo = new FakeSettingsRepository()) {
  const engine = new FakeAudioEngine();
  const sleepRepo = new FakeSleepRepository();
  const snoreRepo = new FakeSnoreRepository();
  const snippets = new FakeSnippetStorage();
  const analytics = new AnalyticsService(sleepRepo, snoreRepo);
  const sleepService = new SleepService(sleepRepo, snoreRepo, engine, snippets);
  const audioService = new AudioService(engine, sleepService, snoreRepo, analytics);
  const store = createAppStore({
    audioService,
    sleepService,
    analyticsService: analytics,
    profileService: new ProfileService(repo),
    reviewService: new ReviewService(repo, {
      isAvailableAsync: async () => false,
      requestReview: async () => undefined,
    }),
    sleepScheduleService: new SleepScheduleService(repo),
    notificationService: new FakeNotificationService(),
  });
  return { store, repo };
}

describe('schedule slice', () => {
  it('defaults to no times and automatic tracking off', () => {
    const { store } = buildStore();
    expect(store.getState().bedtime).toBeNull();
    expect(store.getState().wakeTime).toBeNull();
    expect(store.getState().automaticTrackingEnabled).toBe(false);
  });

  it('round-trips bedtime and wake time through the service', async () => {
    const { store } = buildStore();
    const bedtime = await store.getState().setBedtime({ hours: 23, minutes: 30 });
    const wake = await store.getState().setWakeTime({ hours: 7, minutes: 0 });
    expect(bedtime.ok).toBe(true);
    expect(wake.ok).toBe(true);
    expect(store.getState().bedtime).toEqual({ hours: 23, minutes: 30 });
    expect(store.getState().wakeTime).toEqual({ hours: 7, minutes: 0 });
  });

  it('loads persisted values and keeps automatic tracking off until opted in', async () => {
    const repo = new FakeSettingsRepository();
    const { store } = buildStore(repo);
    await store.getState().setBedtime({ hours: 22, minutes: 15 });
    expect(store.getState().automaticTrackingEnabled).toBe(false);

    await store.getState().setAutomaticTrackingEnabled(true);
    const { store: next } = buildStore(repo);
    await next.getState().loadSchedule();
    expect(next.getState().bedtime).toEqual({ hours: 22, minutes: 15 });
    expect(next.getState().automaticTrackingEnabled).toBe(true);

    await next.getState().setAutomaticTrackingEnabled(false);
    expect(next.getState().automaticTrackingEnabled).toBe(false);
  });

  it('does not let a stale load snap automatic tracking back off after a toggle', async () => {
    const repo = new DelayedSettingsRepository();
    repo.getDelayMs = 40;
    const { store } = buildStore(repo);

    const load = store.getState().loadSchedule();
    const toggled = store.getState().setAutomaticTrackingEnabled(true);
    expect(store.getState().automaticTrackingEnabled).toBe(true);

    await Promise.all([load, toggled]);
    expect(store.getState().automaticTrackingEnabled).toBe(true);
  });
});

class DelayedSettingsRepository extends FakeSettingsRepository {
  getDelayMs = 0;

  override async get(key: string) {
    if (this.getDelayMs > 0) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, this.getDelayMs);
      });
    }
    return super.get(key);
  }
}
