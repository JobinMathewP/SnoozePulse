import type { SQLiteDatabase } from 'expo-sqlite';

import type { SnoreEvent, SnoreEventRow } from '@/types';

import type { ISnoreRepository } from './ISnoreRepository';
import { mapSnoreEventRow } from './mappers';
import type { Result } from './result';
import { mapPersistence, ok } from './resultHelpers';

/**
 * SQLite implementation of {@link ISnoreRepository}.
 * Constructed at the composition root with an injected database client (ADR-18).
 */
export class SnoreRepository implements ISnoreRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async saveSnoreEvent(event: SnoreEvent): Promise<Result<void>> {
    return this.saveSnoreEvents([event]);
  }

  async saveSnoreEvents(events: readonly SnoreEvent[]): Promise<Result<void>> {
    if (events.length === 0) {
      return ok(undefined);
    }

    return mapPersistence(async () => {
      await this.db.withTransactionAsync(async () => {
        for (const event of events) {
          await this.db.runAsync(
            `INSERT INTO snore_events (
              id, session_id, timestamp, duration_ms, peak_db, audio_path,
              confidence, class_label, spectral_peak_hz
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              session_id = excluded.session_id,
              timestamp = excluded.timestamp,
              duration_ms = excluded.duration_ms,
              peak_db = excluded.peak_db,
              audio_path = excluded.audio_path,
              confidence = excluded.confidence,
              class_label = excluded.class_label,
              spectral_peak_hz = excluded.spectral_peak_hz`,
            event.id,
            event.sessionId,
            event.timestamp,
            event.durationMs,
            event.peakDb,
            event.audioPath ?? null,
            event.confidence,
            event.classLabel,
            event.spectralPeakHz ?? null,
          );
        }
      });
    });
  }

  async getEvents(sessionId: string): Promise<Result<readonly SnoreEvent[]>> {
    return mapPersistence(async () => {
      const rows = await this.db.getAllAsync<SnoreEventRow>(
        `SELECT * FROM snore_events
         WHERE session_id = ?
         ORDER BY timestamp ASC`,
        sessionId,
      );
      return rows.map(mapSnoreEventRow);
    });
  }

  async deleteEvents(sessionId: string): Promise<Result<void>> {
    return mapPersistence(async () => {
      await this.db.runAsync(
        'DELETE FROM snore_events WHERE session_id = ?',
        sessionId,
      );
    });
  }
}
