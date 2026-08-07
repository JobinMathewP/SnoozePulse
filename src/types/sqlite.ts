/**
 * SQLite row shapes — persistence layer only.
 *
 * Domain models live in `session.ts` / `audio.ts` / `analytics.ts`. Repositories map between
 * these rows and those models; row types must not escape the repository boundary (Task 4.2).
 */

/** `sleep_sessions` — one row per night. */
export interface SleepSessionRow {
  readonly id: string;
  readonly started_at: number;
  readonly ended_at: number | null;
  readonly state: string;
  readonly ambient_baseline_db: number;
  readonly snore_count: number;
  readonly total_snoring_ms: number;
  readonly peak_db: number;
  readonly peak_at: number | null;
  readonly sleep_score: number | null;
  readonly snore_score: number | null;
  /** M6.5 (ADR-26). Every row written after the V2 migration carries `2`. */
  readonly score_version: number;
}

/** `snore_events` — one row per episode. */
export interface SnoreEventRow {
  readonly id: string;
  readonly session_id: string;
  readonly timestamp: number;
  readonly duration_ms: number;
  readonly peak_db: number;
  readonly audio_path: string | null;
  /** M6.3 / ADR-21 — mean classifier probability across the episode, clamped to [0, 1]. */
  readonly confidence: number;
  /** M6.3 / ADR-21 — the class with the higher summed probability across the episode. */
  readonly class_label: 'snoring' | 'snort';
  /**
   * M6.3 / ADR-21 — dominant frequency at the loudest frame in Hz. Null when spectral
   * analysis was unavailable (default until the spectral-analysis stage lands).
   */
  readonly spectral_peak_hz: number | null;
}

/** `session_buckets` — pre-aggregated timeline / trend buckets (ADR-11). */
export interface SessionBucketRow {
  readonly session_id: string;
  readonly bucket_start: number;
  readonly average_db: number;
  readonly peak_db: number;
  readonly snoring_ms: number;
}
