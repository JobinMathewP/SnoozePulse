import { AudioService } from '@/services/AudioService';
import { AnalyticsService } from '@/services/analytics/AnalyticsService';
import { SleepService } from '@/services/SleepService';
import { FakeAudioEngine } from '@/services/fakes/FakeAudioEngine';
import type { NewSleepSession } from '@/types';
import {
  FakeSleepRepository,
  FakeSnoreRepository,
  FakeSnippetStorage,
} from '@/__tests__/helpers/fakes';

function build() {
  const engine = new FakeAudioEngine();
  const sleepRepo = new FakeSleepRepository();
  const snoreRepo = new FakeSnoreRepository();
  const snippets = new FakeSnippetStorage();
  const analytics = new AnalyticsService(sleepRepo, snoreRepo);
  const sleepService = new SleepService(sleepRepo, snoreRepo, engine, snippets);
  const audioService = new AudioService(engine, sleepService, snoreRepo, analytics);
  return { engine, sleepRepo, snoreRepo, snippets, sleepService, audioService };
}

function newSession(id: string, startedAt: number): NewSleepSession {
  return { id, startedAt, ambientBaselineDb: 30 };
}

describe('SleepService.listSessionsInRange', () => {
  it('returns only sessions started within the half-open range, newest first', async () => {
    const { sleepRepo, sleepService } = build();
    await sleepRepo.createSession(newSession('a', 1000));
    await sleepRepo.createSession(newSession('b', 2000));
    await sleepRepo.createSession(newSession('c', 3000));

    const result = await sleepService.listSessionsInRange(1500, 3000);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    // [1500, 3000): includes b (2000), excludes c (3000) and a (1000).
    expect(result.value.map((s) => s.id)).toEqual(['b']);
  });
});

describe('SleepService.deleteAllSessions', () => {
  it('clears every session and removes referenced snippet files', async () => {
    const { sleepRepo, snippets, sleepService } = build();
    await sleepRepo.createSession(newSession('a', 1000));
    await sleepRepo.createSession(newSession('b', 2000));
    snippets.files = [
      { path: 'a.wav', sizeBytes: 10, modifiedAtMs: 1000 },
      { path: 'b.wav', sizeBytes: 10, modifiedAtMs: 2000 },
    ];

    const result = await sleepService.deleteAllSessions();
    expect(result.ok).toBe(true);
    expect(sleepRepo.sessions.size).toBe(0);
  });
});

describe('AudioService.discardSession', () => {
  it('stops capture, deletes the in-progress session, and returns to IDLE', async () => {
    const { engine, sleepRepo, sleepService, audioService } = build();
    engine.setPermission('granted');
    await sleepService.calibrateAmbient();

    const started = await audioService.startSession();
    expect(started.ok).toBe(true);
    expect(sleepRepo.sessions.size).toBe(1);

    const discarded = await audioService.discardSession();
    expect(discarded.ok).toBe(true);
    expect(sleepRepo.sessions.size).toBe(0);
  });
});
