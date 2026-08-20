import type { Result } from '@/repositories';
import { ok } from '@/repositories';
import type { MissedNight, MissedNightReason } from '@/types';

import type { INightOutcomeService } from '../INightOutcomeService';

/** In-memory missed-night port for tests. */
export class FakeNightOutcomeService implements INightOutcomeService {
  missed: MissedNight | null = null;

  async getMissedNight(): Promise<Result<MissedNight | null>> {
    return ok(this.missed);
  }

  async recordMissedNight(
    reason: MissedNightReason,
    nightIso: string,
    atMs: number,
  ): Promise<Result<MissedNight>> {
    if (this.missed !== null && this.missed.nightIso === nightIso) {
      return ok(this.missed);
    }
    this.missed = { reason, nightIso, atMs };
    return ok(this.missed);
  }

  async clearMissedNight(): Promise<Result<void>> {
    this.missed = null;
    return ok(undefined);
  }
}
