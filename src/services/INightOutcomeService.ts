import type { Result } from '@/repositories';
import type { MissedNight, MissedNightReason } from '@/types';

/**
 * Persists the latest skipped / failed automatic night so Home can stay honest after
 * a process death. Does not invent scores (ADR-31).
 */
export interface INightOutcomeService {
  getMissedNight(): Promise<Result<MissedNight | null>>;
  /**
   * Store `reason` for `nightIso` unless that night is already recorded (first cause wins).
   */
  recordMissedNight(reason: MissedNightReason, nightIso: string, atMs: number): Promise<Result<MissedNight>>;
  clearMissedNight(): Promise<Result<void>>;
}
