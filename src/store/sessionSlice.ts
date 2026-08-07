import type { AppError, SessionState, SleepSession } from '@/types';
import { canTransition } from '@/utils';

import type { StoreDependencies } from './container';
import { liveAudioLevel } from './liveAudioLevel';
import type { Result } from './result';
import { err, ok } from './result';

/** Session slice — owns the live state machine (architecture.md §3). */
export type SessionSlice = {
  readonly sessionState: SessionState;
  readonly isRecording: boolean;
  readonly activeSession: SleepSession | null;
  /** Last typed failure that put the machine in `ERROR` (Task 5.5). */
  readonly lastError: AppError | null;

  startSession: () => Promise<Result<SleepSession>>;
  stopSession: () => Promise<Result<SleepSession>>;
  /**
   * Clear `ERROR` → `IDLE`, stop any lingering capture, and drop `lastError`.
   * Safe to call from Home / Active recovery UI.
   */
  recoverSession: () => Promise<Result<void>>;
  /**
   * System-only (ADR-14). Wired from the audio interruption subscription at the
   * composition root — never exposed on UI hooks.
   */
  pauseSession: () => Promise<Result<void>>;
  /** System-only (ADR-14). */
  resumeSession: () => Promise<Result<void>>;
};

type SetState = (partial: Partial<SessionSlice>) => void;
type GetState = () => Pick<SessionSlice, 'sessionState'>;

export function createSessionSlice(
  deps: StoreDependencies,
  set: SetState,
  get: GetState,
): SessionSlice {
  const transition = (to: SessionState): Result<void> => {
    const from = get().sessionState;
    if (!canTransition(from, to)) {
      return err({
        code: 'ILLEGAL_TRANSITION',
        message: `Cannot transition from ${from} to ${to}`,
        from,
        to,
      });
    }
    set({
      sessionState: to,
      isRecording: to === 'RECORDING' || to === 'PAUSED',
    });
    return ok(undefined);
  };

  const enterError = (error: AppError, clearSession: boolean): void => {
    set({
      sessionState: 'ERROR',
      isRecording: false,
      lastError: error,
      ...(clearSession ? { activeSession: null } : {}),
    });
  };

  return {
    sessionState: 'IDLE',
    isRecording: false,
    activeSession: null,
    lastError: null,

    async startSession() {
      const toStarting = transition('STARTING');
      if (!toStarting.ok) {
        enterError(toStarting.error, true);
        return toStarting;
      }
      set({ lastError: null });

      const result = await deps.audioService.startSession();
      if (!result.ok) {
        enterError(result.error, true);
        return result;
      }

      const toRecording = transition('RECORDING');
      if (!toRecording.ok) {
        enterError(toRecording.error, true);
        return toRecording;
      }

      set({ activeSession: result.value, lastError: null });
      return result;
    },

    async stopSession() {
      const from = get().sessionState;
      // Fast Refresh remounts the store at IDLE while Active Session + native capture may
      // still be live — recover by forcing the engine down instead of blocking the UI.
      if (from !== 'RECORDING' && from !== 'PAUSED') {
        const recovered = await deps.audioService.forceStopRecording();
        set({
          sessionState: 'IDLE',
          isRecording: false,
          activeSession: null,
          lastError: null,
        });
        liveAudioLevel.value = 0;
        if (recovered.ok && recovered.value) {
          return ok(recovered.value);
        }
        if (!recovered.ok) {
          enterError(recovered.error, true);
          return recovered;
        }
        return err({
          code: 'ILLEGAL_TRANSITION',
          message: `Cannot transition from ${from} to STOPPING`,
          from,
          to: 'STOPPING',
        });
      }

      const toStopping = transition('STOPPING');
      if (!toStopping.ok) {
        enterError(toStopping.error, false);
        return toStopping;
      }

      const result = await deps.audioService.stopSession();
      if (!result.ok) {
        enterError(result.error, false);
        return result;
      }

      const toCompleted = transition('COMPLETED');
      if (!toCompleted.ok) {
        enterError(toCompleted.error, false);
        return toCompleted;
      }

      set({ activeSession: result.value, lastError: null });
      transition('IDLE');
      set({ activeSession: null });
      liveAudioLevel.value = 0;
      return result;
    },

    async recoverSession() {
      await deps.audioService.forceStopRecording();
      const from = get().sessionState;
      if (from === 'ERROR') {
        const idle = transition('IDLE');
        if (!idle.ok) {
          set({
            sessionState: 'IDLE',
            isRecording: false,
            activeSession: null,
            lastError: null,
          });
        } else {
          set({ activeSession: null, lastError: null });
        }
      } else {
        set({
          sessionState: 'IDLE',
          isRecording: false,
          activeSession: null,
          lastError: null,
        });
      }
      liveAudioLevel.value = 0;
      return ok(undefined);
    },

    async pauseSession() {
      const paused = transition('PAUSED');
      if (!paused.ok) {
        enterError(paused.error, false);
        return paused;
      }
      const result = await deps.audioService.pauseSession();
      if (!result.ok) {
        enterError(result.error, false);
        return result;
      }
      return ok(undefined);
    },

    async resumeSession() {
      const resumed = transition('RECORDING');
      if (!resumed.ok) {
        enterError(resumed.error, false);
        return resumed;
      }
      const result = await deps.audioService.resumeSession();
      if (!result.ok) {
        enterError(result.error, false);
        return result;
      }
      return ok(undefined);
    },
  };
}
