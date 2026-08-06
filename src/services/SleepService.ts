import { Paths } from 'expo-file-system';

import type { IAudioEngine } from '@/native';
import type { ISleepRepository, ISnoreRepository, Result } from '@/repositories';
import { err, ok, persistenceError } from '@/repositories';
import type {
  CalibrationResult,
  Page,
  PageRequest,
  SessionBucket,
  SleepSession,
  SleepSessionCompletion,
  SnoreEvent,
} from '@/types';
import {
  planRetentionCleanup,
  SNIPPET_QUOTA_BYTES,
  SNIPPET_RETENTION_MS,
} from '@/utils';

import type { ISnippetStorage } from './ISnippetStorage';
import type {
  ISleepService,
  RetentionCleanup,
  SessionReadiness,
} from './ISleepService';

/** Refuse new snippets when free disk is below this floor (Task 5.5). */
const FREE_DISK_FLOOR_BYTES = 10 * 1024 * 1024;

/**
 * Session CRUD, readiness, and snippet retention (ADR-15). Zero SQL (ADR-19).
 */
export class SleepService implements ISleepService {
  private calibration: CalibrationResult | null = null;

  constructor(
    private readonly sleepRepository: ISleepRepository,
    private readonly snoreRepository: ISnoreRepository,
    private readonly audioEngine: IAudioEngine,
    private readonly snippetStorage: ISnippetStorage,
  ) {}

  async checkReadiness(): Promise<Result<SessionReadiness>> {
    try {
      const microphone = await this.audioEngine.getPermissionStatus();
      const calibration = this.calibration;
      return ok({
        microphone,
        calibration,
        ready: microphone === 'granted' && calibration !== null,
      });
    } catch (cause) {
      return err(persistenceError('Failed to check session readiness', cause));
    }
  }

  async calibrateAmbient(): Promise<Result<CalibrationResult>> {
    const result = await this.audioEngine.calibrate();
    if (result.ok) {
      this.calibration = result.value;
    }
    return result;
  }

  async beginSession(): Promise<Result<SleepSession>> {
    if (this.calibration === null) {
      return err({
        code: 'CALIBRATION',
        message: 'Ambient calibration is required before starting a session',
      });
    }
    const id = createSessionId();
    return this.sleepRepository.createSession({
      id,
      startedAt: Date.now(),
      ambientBaselineDb: this.calibration.baselineDb,
    });
  }

  completeSession(
    id: string,
    completion: SleepSessionCompletion,
  ): Promise<Result<SleepSession>> {
    return this.sleepRepository.finishSession(id, completion);
  }

  getSession(id: string): Promise<Result<SleepSession>> {
    return this.sleepRepository.getSession(id);
  }

  listSessions(request: PageRequest): Promise<Result<Page<SleepSession>>> {
    return this.sleepRepository.listSessions(request);
  }

  getBuckets(sessionId: string): Promise<Result<readonly SessionBucket[]>> {
    return this.sleepRepository.getBuckets(sessionId);
  }

  async getSnoreEvents(sessionId: string): Promise<Result<readonly SnoreEvent[]>> {
    const result = await this.snoreRepository.getEvents(sessionId);
    if (!result.ok) {
      return result;
    }
    // Newest first for the Summary snippet list.
    return ok([...result.value].sort((a, b) => b.timestamp - a.timestamp));
  }

  saveBuckets(buckets: readonly SessionBucket[]): Promise<Result<void>> {
    return this.sleepRepository.saveBuckets(buckets);
  }

  async deleteSession(id: string): Promise<Result<void>> {
    const deleted = await this.sleepRepository.deleteSession(id);
    if (!deleted.ok) {
      return deleted;
    }
    for (const path of deleted.value) {
      const removed = await this.snippetStorage.deleteFile(path);
      if (!removed.ok) {
        return removed;
      }
    }
    return ok(undefined);
  }

  async enforceRetention(): Promise<Result<RetentionCleanup>> {
    const listed = await this.snippetStorage.listFiles();
    if (!listed.ok) {
      return listed;
    }

    const plan = planRetentionCleanup(
      listed.value,
      Date.now(),
      SNIPPET_RETENTION_MS,
      SNIPPET_QUOTA_BYTES,
    );

    let deletedExpiredCount = 0;
    for (const path of plan.expiredPaths) {
      const removed = await this.snippetStorage.deleteFile(path);
      if (!removed.ok) {
        return removed;
      }
      deletedExpiredCount += 1;
    }

    let deletedOverQuotaCount = 0;
    for (const path of plan.overQuotaPaths) {
      const removed = await this.snippetStorage.deleteFile(path);
      if (!removed.ok) {
        return removed;
      }
      deletedOverQuotaCount += 1;
    }

    return ok({
      deletedExpiredCount,
      deletedOverQuotaCount,
      remainingBytes: plan.remainingBytes,
    });
  }

  async checkSnippetQuota(): Promise<Result<void>> {
    const listed = await this.snippetStorage.listFiles();
    if (!listed.ok) {
      return listed;
    }
    let usedBytes = 0;
    for (const file of listed.value) {
      usedBytes += file.sizeBytes;
    }

    if (usedBytes >= SNIPPET_QUOTA_BYTES) {
      return err({
        code: 'STORAGE_QUOTA',
        message:
          'Snore audio storage is full. Detection continues, but new clips may be skipped.',
        usedBytes,
        limitBytes: SNIPPET_QUOTA_BYTES,
      });
    }

    try {
      const free = Paths.availableDiskSpace;
      if (typeof free === 'number' && free >= 0 && free < FREE_DISK_FLOOR_BYTES) {
        return err({
          code: 'STORAGE_QUOTA',
          message:
            'Device storage is nearly full. Detection continues, but new clips may be skipped.',
          usedBytes,
          limitBytes: SNIPPET_QUOTA_BYTES,
        });
      }
    } catch {
      // Disk probe is best-effort; do not fail the quota check on platform quirks.
    }

    return ok(undefined);
  }

  async reclaimOrphanedSnippets(): Promise<Result<number>> {
    const referenced = await this.collectReferencedSnippetPaths();
    if (!referenced.ok) {
      return referenced;
    }

    const listed = await this.snippetStorage.listFiles();
    if (!listed.ok) {
      return listed;
    }

    let removedCount = 0;
    for (const file of listed.value) {
      if (referenced.value.has(normalizePath(file.path))) {
        continue;
      }
      const removed = await this.snippetStorage.deleteFile(file.path);
      if (!removed.ok) {
        return removed;
      }
      removedCount += 1;
    }
    return ok(removedCount);
  }

  async recoverInterruptedSessions(): Promise<Result<number>> {
    const page = await this.sleepRepository.listSessions({ offset: 0, limit: 100 });
    if (!page.ok) {
      return page;
    }

    let closed = 0;
    const endedAt = Date.now();
    for (const session of page.value.items) {
      if (session.endedAt !== null) {
        continue;
      }
      const finished = await this.sleepRepository.finishSession(session.id, {
        endedAt,
        state: 'ERROR',
        snoreCount: session.snoreCount,
        totalSnoringMs: session.totalSnoringMs,
        peakDb: session.peakDb,
        peakAt: session.peakAt,
        sleepScore: session.sleepScore ?? 0,
        snoreScore: session.snoreScore ?? 0,
      });
      if (!finished.ok) {
        return finished;
      }
      closed += 1;
    }
    return ok(closed);
  }

  private async collectReferencedSnippetPaths(): Promise<Result<ReadonlySet<string>>> {
    const paths = new Set<string>();
    let offset = 0;
    const limit = 100;

    for (;;) {
      const page = await this.sleepRepository.listSessions({ offset, limit });
      if (!page.ok) {
        return page;
      }
      for (const session of page.value.items) {
        const events = await this.snoreRepository.getEvents(session.id);
        if (!events.ok) {
          return events;
        }
        for (const event of events.value) {
          if (event.audioPath) {
            paths.add(normalizePath(event.audioPath));
          }
        }
      }
      offset += limit;
      if (offset >= page.value.total || page.value.items.length === 0) {
        break;
      }
    }

    return ok(paths);
  }
}

function createSessionId(): string {
  // Hermes / RN often lack `globalThis.crypto.randomUUID` — stay dependency-free.
  const bytes = new Uint8Array(16);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function normalizePath(path: string): string {
  return path.replace(/\/+$/, '');
}
