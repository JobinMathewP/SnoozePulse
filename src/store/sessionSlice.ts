import type { Result } from './result';
import { err, ok } from './result';
import type { SessionState, SleepSession } from '@/types';
import { canTransition } from '@/utils';

import type { StoreDependencies } from './container';
import { liveAudioLevel } from './liveAudioLevel';

/** Session slice — owns the live state machine (architecture.md §3). */
export type SessionSlice = {
  readonly sessionState: SessionState;
  readonly isRecording: boolean;
  readonly activeSession: SleepSession | null;

  startSession: () => Promise<Result<SleepSession>>;
  stopSession: () => Promise<Result<SleepSession>>;
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

  return {
    sessionState: 'IDLE',
    isRecording: false,
    activeSession: null,

    async startSession() {
      const toStarting = transition('STARTING');
      if (!toStarting.ok) {
        return toStarting;
      }

      const result = await deps.audioService.startSession();
      if (!result.ok) {
        set({
          sessionState: 'ERROR',
          isRecording: false,
          activeSession: null,
        });
        return result;
      }

      const toRecording = transition('RECORDING');
      if (!toRecording.ok) {
        set({
          sessionState: 'ERROR',
          isRecording: false,
          activeSession: null,
        });
        return toRecording;
      }

      set({ activeSession: result.value });
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
        });
        liveAudioLevel.value = 0;
        if (recovered.ok && recovered.value) {
          return ok(recovered.value);
        }
        if (!recovered.ok) {
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
        return toStopping;
      }

      const result = await deps.audioService.stopSession();
      if (!result.ok) {
        set({
          sessionState: 'ERROR',
          isRecording: false,
        });
        return result;
      }

      const toCompleted = transition('COMPLETED');
      if (!toCompleted.ok) {
        set({ sessionState: 'ERROR', isRecording: false });
        return toCompleted;
      }

      set({ activeSession: result.value });
      transition('IDLE');
      set({ activeSession: null });
      liveAudioLevel.value = 0;
      return result;
    },

    async pauseSession() {
      const paused = transition('PAUSED');
      if (!paused.ok) {
        return paused;
      }
      const result = await deps.audioService.pauseSession();
      if (!result.ok) {
        set({ sessionState: 'ERROR', isRecording: false });
        return result;
      }
      return ok(undefined);
    },

    async resumeSession() {
      const resumed = transition('RECORDING');
      if (!resumed.ok) {
        return resumed;
      }
      const result = await deps.audioService.resumeSession();
      if (!result.ok) {
        set({ sessionState: 'ERROR', isRecording: false });
        return result;
      }
      return ok(undefined);
    },
  };
}
