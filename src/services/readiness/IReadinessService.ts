import type { Result } from '@/repositories';
import type {
  LocalTimeOfDay,
  ReadinessState,
  ReadinessStep,
  SleepSchedule,
} from '@/types';

/**
 * Sleep Readiness service (ADR-31). Owns the nightly scheduler state and emits
 * start/stop *intents* only — it never calls `IAudioService` (Task 7.5 wires that).
 *
 * Clock and sensors are injected per `evaluate` call. This class does not read
 * `Date.now`, motion, or the microphone.
 */
export type ReadinessEvaluateInput = {
  readonly schedule: SleepSchedule;
  readonly now: LocalTimeOfDay;
  readonly phoneSettled: boolean | null;
  readonly interacting: boolean;
  readonly environmentAcceptable: boolean | null;
  readonly settleElapsedMs: number;
};

export interface IReadinessService {
  getState(): ReadinessState;
  evaluate(input: ReadinessEvaluateInput): Result<ReadinessStep>;
  fail(): Result<ReadinessStep>;
  reset(): Result<ReadinessStep>;
}
