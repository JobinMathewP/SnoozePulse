import type {
  SessionBucket,
  SessionBucketRow,
  SessionState,
  SleepSession,
  SleepSessionRow,
  SnoreEvent,
  SnoreEventRow,
} from '@/types';

/** Map a `sleep_sessions` row to the domain model. Row types stay inside repositories. */
export function mapSleepSessionRow(row: SleepSessionRow): SleepSession {
  return {
    id: row.id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    state: row.state as SessionState,
    ambientBaselineDb: row.ambient_baseline_db,
    snoreCount: row.snore_count,
    totalSnoringMs: row.total_snoring_ms,
    peakDb: row.peak_db,
    peakAt: row.peak_at,
    sleepScore: row.sleep_score,
    snoreScore: row.snore_score,
  };
}

export function mapSnoreEventRow(row: SnoreEventRow): SnoreEvent {
  return {
    id: row.id,
    sessionId: row.session_id,
    timestamp: row.timestamp,
    durationMs: row.duration_ms,
    peakDb: row.peak_db,
    audioPath: row.audio_path,
  };
}

export function mapSessionBucketRow(row: SessionBucketRow): SessionBucket {
  return {
    sessionId: row.session_id,
    bucketStart: row.bucket_start,
    averageDb: row.average_db,
    peakDb: row.peak_db,
    snoringMs: row.snoring_ms,
  };
}
