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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            event.id,
            event.sessionId,
            event.timestamp,
            event.durationMs,
            event.peakDb,
            event.audioPath,
            event.confidence,
            event.classLabel,
            event.spectralPeakHz,
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
