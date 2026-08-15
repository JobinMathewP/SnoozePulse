import type {
  NewSleepSession,
  Page,
  PageRequest,
  SessionBucket,
  SleepSession,
  SleepSessionCompletion,
  SnoreEvent,
} from '@/types';
import type {
  ISleepRepository,
  ISnoreRepository,
  ISettingsRepository,
  Result,
} from '@/repositories';
import { err, ok } from '@/repositories';
import type { ISnippetStorage } from '@/services';
import type { SnippetFileInfo } from '@/utils';

/** In-memory sleep repository for Jest (no expo-sqlite). */
export class FakeSleepRepository implements ISleepRepository {
  readonly sessions = new Map<string, SleepSession>();
  readonly buckets = new Map<string, SessionBucket[]>();

  async createSession(session: NewSleepSession): Promise<Result<SleepSession>> {
    const created: SleepSession = {
      id: session.id,
      startedAt: session.startedAt,
      endedAt: null,
      state: 'RECORDING',
      ambientBaselineDb: session.ambientBaselineDb,
      snoreCount: 0,
      totalSnoringMs: 0,
      peakDb: 0,
      peakAt: null,
      sleepScore: null,
      snoreScore: null,
    };
    this.sessions.set(created.id, created);
    return ok(created);
  }

  async finishSession(
    id: string,
    completion: SleepSessionCompletion,
  ): Promise<Result<SleepSession>> {
    const existing = this.sessions.get(id);
    if (!existing) {
      return err({
        code: 'NOT_FOUND',
        message: 'Session not found',
        entity: 'session',
        id,
      });
    }
    const finished: SleepSession = {
      ...existing,
      endedAt: completion.endedAt,
      state: completion.state,
      snoreCount: completion.snoreCount,
      totalSnoringMs: completion.totalSnoringMs,
      peakDb: completion.peakDb,
      peakAt: completion.peakAt,
      sleepScore: completion.sleepScore,
      snoreScore: completion.snoreScore,
    };
    this.sessions.set(id, finished);
    return ok(finished);
  }

  async getSession(id: string): Promise<Result<SleepSession>> {
    const session = this.sessions.get(id);
    if (!session) {
      return err({
        code: 'NOT_FOUND',
        message: 'Session not found',
        entity: 'session',
        id,
      });
    }
    return ok(session);
  }

  async listSessions(request: PageRequest): Promise<Result<Page<SleepSession>>> {
    const items = [...this.sessions.values()].sort((a, b) => b.startedAt - a.startedAt);
    const slice = items.slice(request.offset, request.offset + request.limit);
    return ok({
      items: slice,
      total: items.length,
      offset: request.offset,
      limit: request.limit,
    });
  }

  async listSessionsInRange(
    fromMs: number,
    toMs: number,
  ): Promise<Result<readonly SleepSession[]>> {
    const items = [...this.sessions.values()]
      .filter((s) => s.startedAt >= fromMs && s.startedAt < toMs)
      .sort((a, b) => b.startedAt - a.startedAt);
    return ok(items);
  }

  async deleteSession(id: string): Promise<Result<readonly string[]>> {
    if (!this.sessions.has(id)) {
      return err({
        code: 'NOT_FOUND',
        message: 'Session not found',
        entity: 'session',
        id,
      });
    }
    this.sessions.delete(id);
    this.buckets.delete(id);
    return ok([]);
  }

  async deleteAllSessions(): Promise<Result<readonly string[]>> {
    this.sessions.clear();
    this.buckets.clear();
    return ok([]);
  }

  async saveBuckets(buckets: readonly SessionBucket[]): Promise<Result<void>> {
    for (const bucket of buckets) {
      const list = this.buckets.get(bucket.sessionId) ?? [];
      const next = list.filter((b) => b.bucketStart !== bucket.bucketStart);
      next.push(bucket);
      next.sort((a, b) => a.bucketStart - b.bucketStart);
      this.buckets.set(bucket.sessionId, next);
    }
    return ok(undefined);
  }

  async getBuckets(sessionId: string): Promise<Result<readonly SessionBucket[]>> {
    return ok(this.buckets.get(sessionId) ?? []);
  }
}

/** In-memory snore repository for Jest. */
export class FakeSnoreRepository implements ISnoreRepository {
  readonly events = new Map<string, SnoreEvent[]>();

  async saveSnoreEvent(event: SnoreEvent): Promise<Result<void>> {
    return this.saveSnoreEvents([event]);
  }

  async saveSnoreEvents(events: readonly SnoreEvent[]): Promise<Result<void>> {
    for (const event of events) {
      const list = this.events.get(event.sessionId) ?? [];
      const existing = list.findIndex((row) => row.id === event.id);
      if (existing >= 0) {
        list[existing] = event;
      } else {
        list.push(event);
      }
      list.sort((a, b) => a.timestamp - b.timestamp);
      this.events.set(event.sessionId, list);
    }
    return ok(undefined);
  }

  async getEvents(sessionId: string): Promise<Result<readonly SnoreEvent[]>> {
    return ok(this.events.get(sessionId) ?? []);
  }

  async deleteEvents(sessionId: string): Promise<Result<void>> {
    this.events.delete(sessionId);
    return ok(undefined);
  }
}

/** In-memory key-value settings repository for profile / review tests. */
export class FakeSettingsRepository implements ISettingsRepository {
  readonly store = new Map<string, string>();

  async get(key: string): Promise<Result<string | null>> {
    return ok(this.store.get(key) ?? null);
  }

  async set(key: string, value: string): Promise<Result<void>> {
    this.store.set(key, value);
    return ok(undefined);
  }

  async remove(key: string): Promise<Result<void>> {
    this.store.delete(key);
    return ok(undefined);
  }
}

/** In-memory snippet storage for retention / orphan tests. */
export class FakeSnippetStorage implements ISnippetStorage {
  files: SnippetFileInfo[] = [];
  readonly directoryUri = 'file:///snippets/';

  async ensureDirectory(): Promise<Result<void>> {
    return ok(undefined);
  }

  async listFiles(): Promise<Result<readonly SnippetFileInfo[]>> {
    return ok([...this.files]);
  }

  async deleteFile(path: string): Promise<Result<void>> {
    this.files = this.files.filter((file) => file.path !== path);
    return ok(undefined);
  }
}
