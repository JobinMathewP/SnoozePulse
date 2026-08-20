import type { IsoDate } from './common';

/** Why automatic tracking did not produce a scored night (feature PRD §15). */
export type MissedNightReason = 'microphone' | 'battery' | 'schedule' | 'engine';

/** One skipped / failed sleep night. `nightIso` is the wake-morning calendar date. */
export type MissedNight = {
  readonly reason: MissedNightReason;
  readonly nightIso: IsoDate;
  readonly atMs: number;
};
