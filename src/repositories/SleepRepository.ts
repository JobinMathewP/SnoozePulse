import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  NewSleepSession,
  Page,
  PageRequest,
  SessionBucket,
  SessionBucketRow,
  SleepSession,
  SleepSessionCompletion,
  SleepSessionRow,
} from '@/types';

import type { ISleepRepository } from './ISleepRepository';
import { mapSessionBucketRow, mapSleepSessionRow } from './mappers';
import type { Result } from './result';
import { err, mapPersistence, notFound, ok } from './resultHelpers';

/**
 * SQLite implementation of {@link ISleepRepository}.
 * Constructed at the composition root with an injected database client (ADR-18).
 */
export class SleepRepository implements ISleepRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async createSession(session: NewSleepSession): Promise<Result<SleepSession>> {
    return mapPersistence(async () => {
      await this.db.runAsync(
        `INSERT INTO sleep_sessions (
          id, started_at, ended_at, state, ambient_baseline_db,
          snore_count, total_snoring_ms, peak_db, peak_at, sleep_score, snore_score
        ) VALUES (?, ?, NULL, 'RECORDING', ?, 0, 0, 0, NULL, NULL, NULL)`,
        session.id,
        session.startedAt,
        session.ambientBaselineDb,
      );
      const created = await this.readSession(session.id);
      if (!created) {
        throw new Error(`session missing after insert: ${session.id}`);
      }
      return created;
    });
  }

  async finishSession(
    id: string,
    completion: SleepSessionCompletion,
  ): Promise<Result<SleepSession>> {
    const existing = await this.getSession(id);
    if (!existing.ok) {
      return existing;
    }

    return mapPersistence(async () => {
      await this.db.runAsync(
        `UPDATE sleep_sessions SET
          ended_at = ?,
          state = ?,
          snore_count = ?,
          total_snoring_ms = ?,
          peak_db = ?,
          peak_at = ?,
          sleep_score = ?,
          snore_score = ?
        WHERE id = ?`,
        completion.endedAt,
        completion.state,
        completion.snoreCount,
        completion.totalSnoringMs,
        completion.peakDb,
        completion.peakAt,
        completion.sleepScore,
        completion.snoreScore,
        id,
      );
      const updated = await this.readSession(id);
      if (!updated) {
        throw new Error(`session missing after finish: ${id}`);
      }
      return updated;
    });
  }

  async getSession(id: string): Promise<Result<SleepSession>> {
    const mapped = await mapPersistence(async () => this.readSession(id));
    if (!mapped.ok) {
      return mapped;
    }
    if (mapped.value === null) {
      return err(notFound('session', id));
    }
    return ok(mapped.value);
  }

  async listSessions(request: PageRequest): Promise<Result<Page<SleepSession>>> {
    const offset = Math.max(0, request.offset);
    const limit = Math.max(0, request.limit);

    return mapPersistence(async () => {
      const countRow = await this.db.getFirstAsync<{ total: number }>(
        'SELECT COUNT(*) AS total FROM sleep_sessions',
      );
      const total = countRow?.total ?? 0;
      const rows = await this.db.getAllAsync<SleepSessionRow>(
        `SELECT * FROM sleep_sessions
         ORDER BY started_at DESC
         LIMIT ? OFFSET ?`,
        limit,
        offset,
      );
      return {
        items: rows.map(mapSleepSessionRow),
        total,
        offset,
        limit,
      };
    });
  }

  async deleteSession(id: string): Promise<Result<readonly string[]>> {
    const existing = await this.getSession(id);
    if (!existing.ok) {
      return existing;
    }

    return mapPersistence(async () => {
      const pathRows = await this.db.getAllAsync<{ audio_path: string | null }>(
        `SELECT audio_path FROM snore_events
         WHERE session_id = ? AND audio_path IS NOT NULL`,
        id,
      );
      const paths = pathRows
        .map((row) => row.audio_path)
        .filter((path): path is string => path !== null && path.length > 0);
      await this.db.runAsync('DELETE FROM sleep_sessions WHERE id = ?', id);
      return paths;
    });
  }

  async saveBuckets(buckets: readonly SessionBucket[]): Promise<Result<void>> {
    if (buckets.length === 0) {
      return ok(undefined);
    }

    return mapPersistence(async () => {
      await this.db.withTransactionAsync(async () => {
        for (const bucket of buckets) {
          await this.db.runAsync(
            `INSERT INTO session_buckets (
              session_id, bucket_start, average_db, peak_db, snoring_ms
            ) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(session_id, bucket_start) DO UPDATE SET
              average_db = excluded.average_db,
              peak_db = excluded.peak_db,
              snoring_ms = excluded.snoring_ms`,
            bucket.sessionId,
            bucket.bucketStart,
            bucket.averageDb,
            bucket.peakDb,
            bucket.snoringMs,
          );
        }
      });
    });
  }

  async getBuckets(sessionId: string): Promise<Result<readonly SessionBucket[]>> {
    return mapPersistence(async () => {
      const rows = await this.db.getAllAsync<SessionBucketRow>(
        `SELECT * FROM session_buckets
         WHERE session_id = ?
         ORDER BY bucket_start ASC`,
        sessionId,
      );
      return rows.map(mapSessionBucketRow);
    });
  }

  private async readSession(id: string): Promise<SleepSession | null> {
    const row = await this.db.getFirstAsync<SleepSessionRow>(
      'SELECT * FROM sleep_sessions WHERE id = ?',
      id,
    );
    return row ? mapSleepSessionRow(row) : null;
  }
}
