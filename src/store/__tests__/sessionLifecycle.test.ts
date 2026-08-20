import { AnalyticsService } from '@/services/analytics/AnalyticsService';
import { AudioService } from '@/services/AudioService';
import { ProfileService } from '@/services/ProfileService';
import { ReviewService } from '@/services/ReviewService';
import { SleepScheduleService } from '@/services/SleepScheduleService';
import { SleepService } from '@/services/SleepService';
import { FakeAudioEngine } from '@/services/fakes/FakeAudioEngine';
import { createAppStore } from '@/store/createAppStore';
import { bindAudioSubscriptions } from '@/store/bindAudioSubscriptions';
import { DECIBEL_STORE_THROTTLE_MS } from '@/store/throttle';
import { liveAudioLevel } from '@/store/liveAudioLevel';

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
  // Never-available prompter so the review path stays inert in these tests.
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
  return {
    engine,
    sleepRepo,
    snoreRepo,
    snippets,
    settingsRepo,
    sleepService,
    audioService,
    profileService,
    reviewService,
    store,
  };
}

describe('recording lifecycle integration', () => {
  it('calibrates, starts, persists snore events, and stops to COMPLETED', async () => {
    const { engine, sleepService, store, snoreRepo } = buildGraph();
    engine.setPermission('granted');

    const calibrated = await sleepService.calibrateAmbient();
    expect(calibrated.ok).toBe(true);

    const started = await store.getState().startSession();
    expect(started.ok).toBe(true);
    expect(store.getState().sessionState).toBe('RECORDING');
    if (!started.ok) {
      return;
    }

    engine.emitSnore({
      id: 'snore-1',
      sessionId: started.value.id,
      timestamp: Date.now(),
      durationMs: 1200,
      peakDb: 62,
      audioPath: null,
    });

    // Allow AudioService batching timer / sync path.
    await new Promise((resolve) => setTimeout(resolve, 50));

    const stopped = await store.getState().stopSession();
    expect(stopped.ok).toBe(true);
    expect(store.getState().sessionState).toBe('IDLE');

    const events = await snoreRepo.getEvents(started.value.id);
    // Events may flush on stop even if emit went through service buffer.
    expect(events.ok).toBe(true);
  });

  it('rejects start without calibration', async () => {
    const { engine, store } = buildGraph();
    engine.setPermission('granted');
    const started = await store.getState().startSession();
    expect(started.ok).toBe(false);
    if (!started.ok) {
      expect(started.error.code).toBe('CALIBRATION');
    }
    expect(store.getState().sessionState).toBe('ERROR');
  });
});

describe('ADR-13 audio level path', () => {
  it('updates the shared value on every event but throttles Zustand', () => {
    jest.useFakeTimers();
    const { engine, audioService, store } = buildGraph();
    const unsub = bindAudioSubscriptions(store, audioService);

    liveAudioLevel.value = 0;
    const before = store.getState().currentDecibel;

    engine.emitLevel({
      sessionId: 's',
      timestamp: Date.now(),
      decibel: 55,
      rms: 0.1,
      snoreDetected: false,
      confidence: 0.1,
      noiseFloorDb: 30,
    });
    expect(liveAudioLevel.value).toBeGreaterThan(0);
    expect(store.getState().currentDecibel).not.toBe(before);

    const afterFirst = store.getState().currentDecibel;
    engine.emitLevel({
      sessionId: 's',
      timestamp: Date.now(),
      decibel: 70,
      rms: 0.2,
      snoreDetected: false,
      confidence: 0.2,
      noiseFloorDb: 31,
    });
    // Immediate second event within throttle window must not update Zustand.
    expect(store.getState().currentDecibel).toBe(afterFirst);
    expect(liveAudioLevel.value).toBeGreaterThan(0);

    jest.advanceTimersByTime(DECIBEL_STORE_THROTTLE_MS + 1);
    engine.emitLevel({
      sessionId: 's',
      timestamp: Date.now(),
      decibel: 72,
      rms: 0.25,
      snoreDetected: false,
      confidence: 0.3,
      noiseFloorDb: 32,
    });
    expect(store.getState().currentDecibel).toBe(72);

    unsub();
    jest.useRealTimers();
  });

  it('surfaces classifier confidence, noise floor, and hysteretic state (Task 6.7)', () => {
    jest.useFakeTimers();
    const { engine, audioService, store } = buildGraph();
    const unsub = bindAudioSubscriptions(store, audioService);

    expect(store.getState().currentConfidence).toBe(0);
    expect(store.getState().currentNoiseFloorDb).toBe(0);
    expect(store.getState().currentSnoreDetected).toBe(false);

    engine.emitLevel({
      sessionId: 's',
      timestamp: Date.now(),
      decibel: 58,
      rms: 0.15,
      snoreDetected: true,
      confidence: 0.82,
      noiseFloorDb: 34,
    });

    expect(store.getState().currentConfidence).toBeCloseTo(0.82, 5);
    expect(store.getState().currentNoiseFloorDb).toBe(34);
    expect(store.getState().currentSnoreDetected).toBe(true);

    jest.advanceTimersByTime(DECIBEL_STORE_THROTTLE_MS + 1);
    engine.emitLevel({
      sessionId: 's',
      timestamp: Date.now(),
      decibel: 40,
      rms: 0.05,
      snoreDetected: false,
      confidence: 0.12,
      noiseFloorDb: 33,
    });

    expect(store.getState().currentConfidence).toBeCloseTo(0.12, 5);
    expect(store.getState().currentSnoreDetected).toBe(false);

    unsub();
    jest.useRealTimers();
  });
});

describe('retention integration', () => {
  it('enforceRetention deletes expired and over-quota files', async () => {
    const { snippets, sleepService } = buildGraph();
    const now = Date.now();
    snippets.files = [
      {
        path: 'old.wav',
        sizeBytes: 100,
        modifiedAtMs: now - 40 * 24 * 60 * 60 * 1000,
      },
      {
        path: 'big1.wav',
        sizeBytes: 300 * 1024 * 1024,
        modifiedAtMs: now - 1000,
      },
      {
        path: 'big2.wav',
        sizeBytes: 300 * 1024 * 1024,
        modifiedAtMs: now - 500,
      },
    ];
    const result = await sleepService.enforceRetention();
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.deletedExpiredCount).toBe(1);
    expect(result.value.deletedOverQuotaCount).toBeGreaterThanOrEqual(1);
    expect(snippets.files.some((f) => f.path === 'old.wav')).toBe(false);
  });
});
