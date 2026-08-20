import type { IReadinessService, IReadinessSignals } from '@/services';
import {
  localTimeOfDayFromDate,
  READINESS,
  scheduleWindowFlags,
  toEvaluateFlags,
} from '@/services/readiness';
import { shouldSaveAndStopForBattery } from '@/utils';
import type { StoreApi } from 'zustand/vanilla';

import type { AppStore } from './createAppStore';

export type ReadinessLoopState = {
  settleStartedAt: number | null;
  startInFlight: boolean;
};

/**
 * One scheduler tick. Extracted so tests can drive auto-start without timers.
 * Calls the same store `startSession()` as the Home button (Task 7.5).
 */
export async function runReadinessTick(args: {
  store: StoreApi<AppStore>;
  readiness: IReadinessService;
  signals: Parameters<typeof toEvaluateFlags>[0];
  now: Date;
  state: ReadinessLoopState;
}): Promise<void> {
  const { store, readiness, signals, now, state } = args;
  const schedule = {
    bedtime: store.getState().bedtime,
    wakeTime: store.getState().wakeTime,
    automaticTrackingEnabled: store.getState().automaticTrackingEnabled,
  };
  const flags = toEvaluateFlags(signals);
  const clock = localTimeOfDayFromDate(now);
  const windows = scheduleWindowFlags(schedule.bedtime, schedule.wakeTime, clock);
  const batteryBlocksStart = shouldSaveAndStopForBattery(
    signals.batteryLevel,
    signals.charging,
  );
  const becoming =
    schedule.automaticTrackingEnabled &&
    windows.inReadinessWindow &&
    flags.phoneSettled !== false &&
    !flags.interacting &&
    !batteryBlocksStart;

  const nowMs = now.getTime();
  if (!becoming) {
    state.settleStartedAt = null;
  } else if (state.settleStartedAt === null) {
    state.settleStartedAt = nowMs;
  }

  const step = readiness.evaluate({
    schedule,
    now: clock,
    phoneSettled: flags.phoneSettled,
    interacting: flags.interacting || batteryBlocksStart,
    environmentAcceptable: flags.environmentAcceptable,
    settleElapsedMs: state.settleStartedAt === null ? 0 : nowMs - state.settleStartedAt,
  });
  if (!step.ok || step.value.intent !== 'start_session') {
    return;
  }

  const sessionState = store.getState().sessionState;
  if (sessionState !== 'IDLE' || state.startInFlight) {
    return;
  }

  state.startInFlight = true;
  try {
    const started = await store.getState().startSession();
    if (!started.ok) {
      console.warn('[readiness] auto-start failed', started.error);
      readiness.fail();
    }
  } finally {
    state.startInFlight = false;
  }
}

/**
 * Arm Sleep Readiness while the JS process is alive. Killed-state wake is ADR-32
 * (Task 7.6), not a silent workaround here.
 */
export function bindReadinessScheduler(
  store: StoreApi<AppStore>,
  readiness: IReadinessService,
  signals: IReadinessSignals,
  options?: {
    now?: () => Date;
    intervalMs?: number;
  },
): () => void {
  const state: ReadinessLoopState = { settleStartedAt: null, startInFlight: false };
  const now = options?.now ?? (() => new Date());
  const intervalMs = options?.intervalMs ?? READINESS.TICK_INTERVAL_MS;

  const tick = (): void => {
    void signals.getSnapshot().then((snapshot) =>
      runReadinessTick({
        store,
        readiness,
        signals: snapshot,
        now: now(),
        state,
      }),
    );
  };

  void store.getState().loadSchedule().then(() => {
    tick();
  });

  const unsubSignals = signals.subscribe(() => {
    tick();
  });
  const timer = setInterval(tick, intervalMs);

  return () => {
    unsubSignals();
    clearInterval(timer);
  };
}
