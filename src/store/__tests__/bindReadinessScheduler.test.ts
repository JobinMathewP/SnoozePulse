import { AnalyticsService } from '@/services/analytics/AnalyticsService';
import { AudioService } from '@/services/AudioService';
import { ProfileService } from '@/services/ProfileService';
import { ReadinessService } from '@/services/readiness/ReadinessService';
import { READINESS } from '@/services/readiness/readinessConstants';
import { ReviewService } from '@/services/ReviewService';
import { SleepScheduleService } from '@/services/SleepScheduleService';
import { SleepService } from '@/services/SleepService';
import { FakeAudioEngine } from '@/services/fakes/FakeAudioEngine';
import { createAppStore } from '@/store/createAppStore';
import { runReadinessTick, type ReadinessLoopState } from '@/store/bindReadinessScheduler';
import type { ReadinessSignalsSnapshot } from '@/types';

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
  });
  return { engine, sleepService, store, readiness: new ReadinessService() };
}

function inWindowNow(): Date {
  const now = new Date();
  now.setHours(23, 50, 0, 0);
  return now;
}

const READY_SIGNALS: ReadinessSignalsSnapshot = {
  charging: true,
  batteryLevel: 0.8,
  interacting: false,
  phoneSettled: true,
  environmentAcceptable: true,
};

async function armSchedule(store: ReturnType<typeof buildGraph>['store']) {
  await store.getState().setBedtime({ hours: 23, minutes: 30 });
  await store.getState().setWakeTime({ hours: 7, minutes: 0 });
  await store.getState().setAutomaticTrackingEnabled(true);
}

async function tickThree(
  graph: ReturnType<typeof buildGraph>,
  signals: ReadinessSignalsSnapshot,
  now: Date,
  state: ReadinessLoopState,
) {
  for (let i = 0; i < 3; i += 1) {
    await runReadinessTick({
      store: graph.store,
      readiness: graph.readiness,
      signals,
      now,
      state,
    });
  }
}

describe('runReadinessTick', () => {
  it('starts the existing session path when the combined rule fires', async () => {
    const graph = buildGraph();
    graph.engine.setPermission('granted');
    await graph.sleepService.calibrateAmbient();
    await armSchedule(graph.store);

    const now = inWindowNow();
    const state: ReadinessLoopState = {
      settleStartedAt: now.getTime() - READINESS.SETTLE_DURATION_MS,
      startInFlight: false,
    };
    await tickThree(graph, READY_SIGNALS, now, state);

    expect(graph.store.getState().sessionState).toBe('RECORDING');
    expect(graph.readiness.getState()).toBe('MONITORING');
  });

  it('does not start while the user is interacting', async () => {
    const graph = buildGraph();
    graph.engine.setPermission('granted');
    await graph.sleepService.calibrateAmbient();
    await armSchedule(graph.store);

    const now = inWindowNow();
    const state: ReadinessLoopState = {
      settleStartedAt: now.getTime() - READINESS.SETTLE_DURATION_MS,
      startInFlight: false,
    };
    await tickThree(
      graph,
      { ...READY_SIGNALS, interacting: true },
      now,
      state,
    );

    expect(graph.store.getState().sessionState).toBe('IDLE');
    expect(graph.readiness.getState()).not.toBe('MONITORING');
  });

  it('does not start a second session when already recording', async () => {
    const graph = buildGraph();
    graph.engine.setPermission('granted');
    await graph.sleepService.calibrateAmbient();
    await armSchedule(graph.store);
    const first = await graph.store.getState().startSession();
    expect(first.ok).toBe(true);
    const firstId = first.ok ? first.value.id : '';

    const now = inWindowNow();
    const state: ReadinessLoopState = {
      settleStartedAt: now.getTime() - READINESS.SETTLE_DURATION_MS,
      startInFlight: false,
    };
    await tickThree(graph, READY_SIGNALS, now, state);

    expect(graph.store.getState().activeSession?.id).toBe(firstId);
  });

  it('skips auto-start at or below 20% when unplugged', async () => {
    const graph = buildGraph();
    graph.engine.setPermission('granted');
    await graph.sleepService.calibrateAmbient();
    await armSchedule(graph.store);

    const now = inWindowNow();
    const state: ReadinessLoopState = {
      settleStartedAt: now.getTime() - READINESS.SETTLE_DURATION_MS,
      startInFlight: false,
    };
    await tickThree(
      graph,
      { ...READY_SIGNALS, charging: false, batteryLevel: 0.15 },
      now,
      state,
    );

    expect(graph.store.getState().sessionState).toBe('IDLE');
  });
});
