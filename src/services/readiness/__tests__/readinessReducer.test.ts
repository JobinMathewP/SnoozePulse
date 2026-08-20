import type { ReadinessSnapshot, SleepSchedule } from '@/types';

import { READINESS } from '../readinessConstants';
import { reduceFail, reduceReadiness, reduceReset } from '../readinessReducer';
import { ReadinessService } from '../ReadinessService';

const ENABLED: SleepSchedule = {
  bedtime: { hours: 23, minutes: 30 },
  wakeTime: { hours: 7, minutes: 0 },
  automaticTrackingEnabled: true,
};

function snapshot(overrides: Partial<ReadinessSnapshot> = {}): ReadinessSnapshot {
  return {
    automaticTrackingEnabled: true,
    scheduleConfigured: true,
    inReadinessWindow: true,
    inWakeWindow: false,
    wakeWindowEnded: false,
    phoneSettled: false,
    interacting: false,
    environmentAcceptable: false,
    settleElapsedMs: 0,
    ...overrides,
  };
}

describe('reduceReadiness', () => {
  it('opens the readiness window around bedtime without starting', () => {
    const step = reduceReadiness('SCHEDULED', snapshot({ inReadinessWindow: true }));
    expect(step).toEqual({ state: 'READINESS_WINDOW', intent: 'none' });
  });

  it('does not start from a stationary phone alone (outside the window)', () => {
    const step = reduceReadiness(
      'SCHEDULED',
      snapshot({
        inReadinessWindow: false,
        phoneSettled: true,
        interacting: false,
        environmentAcceptable: true,
        settleElapsedMs: READINESS.SETTLE_DURATION_MS,
      }),
    );
    expect(step.intent).toBe('none');
    expect(step.state).toBe('SCHEDULED');
  });

  it('does not start from a stationary phone alone (in window, still interacting)', () => {
    const step = reduceReadiness(
      'READINESS_WINDOW',
      snapshot({
        phoneSettled: true,
        interacting: true,
        environmentAcceptable: true,
        settleElapsedMs: READINESS.SETTLE_DURATION_MS,
      }),
    );
    expect(step.intent).toBe('none');
    expect(step.state).toBe('READINESS_WINDOW');
  });

  it('does not start from a stationary phone alone (settling, environment not acceptable)', () => {
    const step = reduceReadiness(
      'SETTLING',
      snapshot({
        phoneSettled: true,
        interacting: false,
        environmentAcceptable: false,
        settleElapsedMs: READINESS.SETTLE_DURATION_MS,
      }),
    );
    expect(step.intent).toBe('none');
    expect(step.state).toBe('SETTLING');
  });

  it('does not start until settle duration elapses', () => {
    const step = reduceReadiness(
      'SETTLING',
      snapshot({
        phoneSettled: true,
        interacting: false,
        environmentAcceptable: true,
        settleElapsedMs: READINESS.SETTLE_DURATION_MS - 1,
      }),
    );
    expect(step.intent).toBe('none');
    expect(step.state).toBe('SETTLING');
  });

  it('emits start_session only when window + settled + idle + environment combine', () => {
    const intoSettling = reduceReadiness(
      'READINESS_WINDOW',
      snapshot({ phoneSettled: true, interacting: false }),
    );
    expect(intoSettling.state).toBe('SETTLING');
    expect(intoSettling.intent).toBe('none');

    const start = reduceReadiness(
      'SETTLING',
      snapshot({
        phoneSettled: true,
        interacting: false,
        environmentAcceptable: true,
        settleElapsedMs: READINESS.SETTLE_DURATION_MS,
      }),
    );
    expect(start).toEqual({ state: 'MONITORING', intent: 'start_session' });
  });

  it('completes with stop_session after the wake window ends', () => {
    const intoWake = reduceReadiness('MONITORING', snapshot({ inWakeWindow: true }));
    expect(intoWake).toEqual({ state: 'WAKE_WINDOW', intent: 'none' });

    const done = reduceReadiness(
      'WAKE_WINDOW',
      snapshot({ inReadinessWindow: false, inWakeWindow: false, wakeWindowEnded: true }),
    );
    expect(done).toEqual({ state: 'COMPLETED', intent: 'stop_session' });
  });

  it('fails to ERROR from any state', () => {
    expect(reduceFail('SETTLING').state).toBe('ERROR');
    expect(reduceReset('COMPLETED')).toEqual({ state: 'SCHEDULED', intent: 'none' });
  });
});

describe('ReadinessService', () => {
  it('walks the happy path using injected now/signals, never a clock', () => {
    const service = new ReadinessService();
    const base = {
      schedule: ENABLED,
      phoneSettled: false,
      interacting: false,
      environmentAcceptable: false,
      settleElapsedMs: 0,
    };

    expect(service.evaluate({ ...base, now: { hours: 20, minutes: 0 } }).ok).toBe(true);
    expect(service.getState()).toBe('SCHEDULED');

    service.evaluate({ ...base, now: { hours: 23, minutes: 15 } });
    expect(service.getState()).toBe('READINESS_WINDOW');

    service.evaluate({
      ...base,
      now: { hours: 23, minutes: 40 },
      phoneSettled: true,
    });
    expect(service.getState()).toBe('SETTLING');

    const started = service.evaluate({
      ...base,
      now: { hours: 23, minutes: 50 },
      phoneSettled: true,
      environmentAcceptable: true,
      settleElapsedMs: READINESS.SETTLE_DURATION_MS,
    });
    expect(started.ok && started.value).toEqual({
      state: 'MONITORING',
      intent: 'start_session',
    });

    service.evaluate({ ...base, now: { hours: 7, minutes: 0 } });
    expect(service.getState()).toBe('WAKE_WINDOW');

    const stopped = service.evaluate({ ...base, now: { hours: 8, minutes: 0 } });
    expect(stopped.ok && stopped.value).toEqual({
      state: 'COMPLETED',
      intent: 'stop_session',
    });
  });

  it('rejects reset while a night is still in progress', () => {
    const service = new ReadinessService();
    service.evaluate({
      schedule: ENABLED,
      now: { hours: 23, minutes: 15 },
      phoneSettled: false,
      interacting: false,
      environmentAcceptable: false,
      settleElapsedMs: 0,
    });
    const reset = service.reset();
    expect(reset.ok).toBe(false);
    if (!reset.ok) {
      expect(reset.error.code).toBe('ILLEGAL_TRANSITION');
    }
    expect(service.getState()).toBe('READINESS_WINDOW');
  });
});
