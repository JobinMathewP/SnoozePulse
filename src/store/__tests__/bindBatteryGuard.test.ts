import { AnalyticsService } from '@/services/analytics/AnalyticsService';
import { AudioService } from '@/services/AudioService';
import { ProfileService } from '@/services/ProfileService';
import { ReviewService } from '@/services/ReviewService';
import { SleepScheduleService } from '@/services/SleepScheduleService';
import { SleepService } from '@/services/SleepService';
import { FakeAudioEngine } from '@/services/fakes/FakeAudioEngine';
import { FakeBatteryMonitor } from '@/services/fakes/FakeBatteryMonitor';
import { FakeNotificationService } from '@/services/fakes/FakeNotificationService';
import { createAppStore } from '@/store/createAppStore';
import { bindBatteryGuard } from '@/store/bindBatteryGuard';

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
  const profileService = new ProfileService(settingsRepo);
  const reviewService = new ReviewService(settingsRepo, {
    isAvailableAsync: async () => false,
    requestReview: async () => undefined,
  });
  const sleepScheduleService = new SleepScheduleService(settingsRepo);
  const store = createAppStore({
    audioService,
    sleepService,
    analyticsService: analytics,
    profileService,
    reviewService,
    sleepScheduleService,
    notificationService: new FakeNotificationService(),
  });
  return { engine, sleepRepo, sleepService, store };
}

async function startRecording() {
  const graph = buildGraph();
  graph.engine.setPermission('granted');
  const calibrated = await graph.sleepService.calibrateAmbient();
  expect(calibrated.ok).toBe(true);
  const started = await graph.store.getState().startSession();
  expect(started.ok).toBe(true);
  expect(graph.store.getState().sessionState).toBe('RECORDING');
  return graph;
}

describe('bindBatteryGuard', () => {
  it('stops and saves at 20% when unplugged', async () => {
    const { store, sleepRepo } = await startRecording();
    const battery = new FakeBatteryMonitor();
    const unsub = bindBatteryGuard(store, battery);

    battery.setSnapshot({ level: 0.2, charging: false });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(store.getState().sessionState).toBe('IDLE');
    const id = store.getState().lastCompletedSessionId;
    expect(id).toEqual(expect.any(String));
    if (id) {
      const saved = sleepRepo.sessions.get(id);
      expect(saved?.state).toBe('COMPLETED');
    }

    unsub();
  });

  it('does not stop a charging pack at 15%', async () => {
    const { store } = await startRecording();
    const battery = new FakeBatteryMonitor();
    const unsub = bindBatteryGuard(store, battery);

    battery.setSnapshot({ level: 0.15, charging: true });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(store.getState().sessionState).toBe('RECORDING');
    expect(store.getState().lastCompletedSessionId).toBeNull();

    unsub();
  });

  it('saves if the session starts while already at 15% unplugged', async () => {
    const { engine, sleepService, store } = buildGraph();
    engine.setPermission('granted');
    await sleepService.calibrateAmbient();

    const battery = new FakeBatteryMonitor();
    battery.setSnapshot({ level: 0.15, charging: false });
    const unsub = bindBatteryGuard(store, battery);

    const started = await store.getState().startSession();
    expect(started.ok).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(store.getState().sessionState).toBe('IDLE');
    expect(store.getState().lastCompletedSessionId).toEqual(expect.any(String));

    unsub();
  });
});
