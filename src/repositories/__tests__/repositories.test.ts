import { FakeSleepRepository, FakeSnoreRepository } from '@/__tests__/helpers/fakes';

describe('FakeSleepRepository (repository contract)', () => {
  it('creates, finishes, lists, and deletes sessions', async () => {
    const repo = new FakeSleepRepository();
    const created = await repo.createSession({
      id: 's1',
      startedAt: 1000,
      ambientBaselineDb: 32,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    expect(created.value.endedAt).toBeNull();

    const finished = await repo.finishSession('s1', {
      endedAt: 2000,
      state: 'COMPLETED',
      snoreCount: 3,
      totalSnoringMs: 1500,
      peakDb: 55,
      peakAt: 1500,
      sleepScore: 80,
      snoreScore: 20,
    });
    expect(finished.ok).toBe(true);
    if (!finished.ok) {
      return;
    }
    expect(finished.value.state).toBe('COMPLETED');
    expect(finished.value.snoreCount).toBe(3);

    const listed = await repo.listSessions({ offset: 0, limit: 10 });
    expect(listed.ok && listed.value.total).toBe(1);

    const deleted = await repo.deleteSession('s1');
    expect(deleted.ok).toBe(true);
    const missing = await repo.getSession('s1');
    expect(missing.ok).toBe(false);
  });

  it('upserts buckets by session and start', async () => {
    const repo = new FakeSleepRepository();
    await repo.createSession({ id: 's1', startedAt: 1, ambientBaselineDb: 30 });
    await repo.saveBuckets([
      { sessionId: 's1', bucketStart: 0, averageDb: 40, peakDb: 50, snoringMs: 100 },
      { sessionId: 's1', bucketStart: 0, averageDb: 41, peakDb: 51, snoringMs: 200 },
    ]);
    const buckets = await repo.getBuckets('s1');
    expect(buckets.ok && buckets.value).toHaveLength(1);
    expect(buckets.ok && buckets.value[0]?.peakDb).toBe(51);
  });
});

describe('FakeSnoreRepository (repository contract)', () => {
  it('batches and returns events ordered by timestamp', async () => {
    const repo = new FakeSnoreRepository();
    await repo.saveSnoreEvents([
      {
        id: 'e2',
        sessionId: 's1',
        timestamp: 200,
        durationMs: 1000,
        peakDb: 60,
        audioPath: null,
        confidence: 0.82,
        classLabel: 'snoring',
        spectralPeakHz: null,
      },
      {
        id: 'e1',
        sessionId: 's1',
        timestamp: 100,
        durationMs: 500,
        peakDb: 50,
        audioPath: '/a.wav',
        confidence: 0.71,
        classLabel: 'snort',
        spectralPeakHz: null,
      },
    ]);
    const events = await repo.getEvents('s1');
    expect(events.ok && events.value.map((e) => e.id)).toEqual(['e1', 'e2']);
    await repo.deleteEvents('s1');
    const empty = await repo.getEvents('s1');
    expect(empty.ok && empty.value).toEqual([]);
  });
});
