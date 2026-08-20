import { AnalyticsService } from '@/services/analytics/AnalyticsService';
import { AudioService } from '@/services/AudioService';
import { ProfileService } from '@/services/ProfileService';
import { ReviewService } from '@/services/ReviewService';
import { SleepScheduleService } from '@/services/SleepScheduleService';
import { SleepService } from '@/services/SleepService';
import { FakeAudioEngine } from '@/services/fakes/FakeAudioEngine';
import { FakeNotificationService } from '@/services/fakes/FakeNotificationService';
import { FakeNightOutcomeService } from '@/services/fakes/FakeNightOutcomeService';
import { createAppStore } from '@/store/createAppStore';
import { bindNotificationResponse } from '@/store/bindNotificationResponse';

import {
  FakeSleepRepository,
  FakeSnoreRepository,
  FakeSettingsRepository,
  FakeSnippetStorage,
} from '@/__tests__/helpers/fakes';

function buildGraph() {
  const engine = new FakeAudioEngine();
  const sleepRepo = new FakeSleepRepository();
  const snoreRepo = new FakeSnoreRepository();
  const snippets = new FakeSnippetStorage();
  const settingsRepo = new FakeSettingsRepository();
  const analytics = new AnalyticsService(sleepRepo, snoreRepo);
  const sleepService = new SleepService(sleepRepo, snoreRepo, engine, snippets);
  const audioService = new AudioService(engine, sleepService, snoreRepo, analytics);
  const notifications = new FakeNotificationService();
  const store = createAppStore({
    audioService,
    sleepService,
    analyticsService: analytics,
    profileService: new ProfileService(settingsRepo),
    reviewService: new ReviewService(settingsRepo, {
      isAvailableAsync: async () => false,
      requestReview: async () => undefined,
    }),
    sleepScheduleService: new SleepScheduleService(settingsRepo),
    notificationService: notifications,
    nightOutcomeService: new FakeNightOutcomeService(),
  });
  return { engine, sleepService, store, notifications };
}

describe('bindNotificationResponse', () => {
  it('opens Summary for a tap while idle', () => {
    const { store, notifications } = buildGraph();
    const unsub = bindNotificationResponse(store, notifications);

    notifications.emitOpen('session-from-tap');

    expect(store.getState().lastCompletedSessionId).toBe('session-from-tap');
    expect(notifications.prepared).toBe(true);

    unsub();
  });

  it('does not navigate away from an in-progress recording', async () => {
    const { engine, sleepService, store, notifications } = buildGraph();
    engine.setPermission('granted');
    await sleepService.calibrateAmbient();
    const started = await store.getState().startSession();
    expect(started.ok).toBe(true);

    const unsub = bindNotificationResponse(store, notifications);
    notifications.emitOpen('older-night');

    expect(store.getState().sessionState).toBe('RECORDING');
    expect(store.getState().lastCompletedSessionId).toBeNull();

    unsub();
  });
});
