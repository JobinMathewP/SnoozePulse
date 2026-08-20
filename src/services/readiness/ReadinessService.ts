import type { Result } from '@/repositories';
import { err, ok } from '@/repositories';
import type { ReadinessSnapshot, ReadinessState, ReadinessStep, SleepSchedule } from '@/types';

import type { IReadinessService, ReadinessEvaluateInput } from './IReadinessService';
import { reduceFail, reduceReadiness, reduceReset } from './readinessReducer';
import { scheduleWindowFlags } from './readinessWindows';

export class ReadinessService implements IReadinessService {
  private state: ReadinessState = 'SCHEDULED';

  getState(): ReadinessState {
    return this.state;
  }

  evaluate(input: ReadinessEvaluateInput): Result<ReadinessStep> {
    const step = reduceReadiness(this.state, toSnapshot(input));
    this.state = step.state;
    return ok(step);
  }

  fail(): Result<ReadinessStep> {
    const step = reduceFail(this.state);
    this.state = step.state;
    return ok(step);
  }

  reset(): Result<ReadinessStep> {
    if (this.state !== 'SCHEDULED' && this.state !== 'COMPLETED' && this.state !== 'ERROR') {
      return err({
        code: 'ILLEGAL_TRANSITION',
        message: `Cannot reset Sleep Readiness from ${this.state} to SCHEDULED.`,
        from: this.state,
        to: 'SCHEDULED',
      });
    }
    const step = reduceReset(this.state);
    this.state = step.state;
    return ok(step);
  }
}

export function toSnapshot(input: ReadinessEvaluateInput): ReadinessSnapshot {
  const schedule: SleepSchedule = input.schedule;
  const windows = scheduleWindowFlags(schedule.bedtime, schedule.wakeTime, input.now);
  return {
    automaticTrackingEnabled: schedule.automaticTrackingEnabled,
    scheduleConfigured: schedule.bedtime !== null && schedule.wakeTime !== null,
    inReadinessWindow: windows.inReadinessWindow,
    inWakeWindow: windows.inWakeWindow,
    wakeWindowEnded: windows.wakeWindowEnded,
    phoneSettled: input.phoneSettled,
    interacting: input.interacting,
    environmentAcceptable: input.environmentAcceptable,
    settleElapsedMs: input.settleElapsedMs,
  };
}
