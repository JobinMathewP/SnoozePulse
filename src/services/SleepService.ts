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
  return globalThis.crypto.randomUUID();
}

function normalizePath(path: string): string {
  return path.replace(/\/+$/, '');
}
