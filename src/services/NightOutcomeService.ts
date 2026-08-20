import type { ISettingsRepository, Result } from '@/repositories';
import { ok } from '@/repositories';
import type { MissedNight, MissedNightReason } from '@/types';

import type { INightOutcomeService } from './INightOutcomeService';

const KEY_MISSED_NIGHT = 'night.missed';

const REASONS: readonly MissedNightReason[] = [
  'microphone',
  'battery',
  'schedule',
  'engine',
];

/**
 * KV persistence for a skipped automatic night. Values are JSON; the repository
 * still only stores strings (ADR-19).
 */
export class NightOutcomeService implements INightOutcomeService {
  constructor(private readonly settingsRepository: ISettingsRepository) {}

  async getMissedNight(): Promise<Result<MissedNight | null>> {
    const raw = await this.settingsRepository.get(KEY_MISSED_NIGHT);
    if (!raw.ok) {
      return raw;
    }
    return ok(parseMissedNight(raw.value));
  }

  async recordMissedNight(
    reason: MissedNightReason,
    nightIso: string,
    atMs: number,
  ): Promise<Result<MissedNight>> {
    const existing = await this.getMissedNight();
    if (!existing.ok) {
      return existing;
    }
    if (existing.value !== null && existing.value.nightIso === nightIso) {
      return ok(existing.value);
    }
    const next: MissedNight = { reason, nightIso, atMs };
    const written = await this.settingsRepository.set(KEY_MISSED_NIGHT, JSON.stringify(next));
    if (!written.ok) {
      return written;
    }
    return ok(next);
  }

  clearMissedNight(): Promise<Result<void>> {
    return this.settingsRepository.remove(KEY_MISSED_NIGHT);
  }
}

function parseMissedNight(raw: string | null): MissedNight | null {
  if (raw === null) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    const reason = record.reason;
    const nightIso = record.nightIso;
    const atMs = record.atMs;
    if (
      typeof reason !== 'string' ||
      !REASONS.includes(reason as MissedNightReason) ||
      typeof nightIso !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(nightIso) ||
      typeof atMs !== 'number' ||
      !Number.isFinite(atMs)
    ) {
      return null;
    }
    return { reason: reason as MissedNightReason, nightIso, atMs };
  } catch {
    return null;
  }
}
