import type { IAudioEngine } from '@/native';
import type { ISnoreRepository, Result } from '@/repositories';
import { err, ok } from '@/repositories';
import type {
  AudioInterruptionEvent,
  AudioLevelEvent,
  MicrophonePermissionStatus,
  ScoreInputs,
  SessionState,
  SleepSession,
  SnoreEvent,
} from '@/types';
import {
  canTransition,
  SNORE_BATCH_MAX_EVENTS,
  SNORE_BATCH_MAX_WAIT_MS,
  TIMELINE_BUCKET_DURATION_MS,
} from '@/utils';

import type { IAnalyticsService } from './IAnalyticsService';
import type { IAudioService } from './IAudioService';
import type { ISleepService } from './ISleepService';

type Listener<T> = (value: T) => void;

/**
 * Recording lifecycle, guarded transitions, and snore-event batching.
 * Depends on injected `IAudioEngine` — never constructed here (ADR-18). Zero SQL.
 */
export class AudioService implements IAudioService {
  private liveState: SessionState = 'IDLE';
  private activeSession: SleepSession | null = null;
  private snoreBuffer: SnoreEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private engineSnoreUnsubscribe: (() => void) | null = null;

  private readonly levelListeners = new Set<Listener<AudioLevelEvent>>();
  private readonly snoreListeners = new Set<Listener<SnoreEvent>>();
  private readonly interruptionListeners = new Set<Listener<AudioInterruptionEvent>>();

  private levelUnsubscribe: (() => void) | null = null;
  private interruptionUnsubscribe: (() => void) | null = null;

  constructor(
    private readonly audioEngine: IAudioEngine,
    private readonly sleepService: ISleepService,
    private readonly snoreRepository: ISnoreRepository,
    private readonly analyticsService: IAnalyticsService,
  ) {
    this.levelUnsubscribe = this.audioEngine.subscribeAudioLevel((event) => {
      for (const listener of this.levelListeners) {
        listener(event);
      }
    });
    this.interruptionUnsubscribe = this.audioEngine.subscribeInterruption(
      (event) => {
        for (const listener of this.interruptionListeners) {
          listener(event);
        }
      },
    );
    this.engineSnoreUnsubscribe = this.audioEngine.subscribeSnore((event) => {
      void this.bufferSnoreEvent(event);
    });
  }

  /** Tear down engine subscriptions. Composition root may call on shutdown/tests. */
  dispose(): void {
    this.levelUnsubscribe?.();
    this.interruptionUnsubscribe?.();
    this.engineSnoreUnsubscribe?.();
    this.clearFlushTimer();
  }

  getPermissionStatus(): Promise<MicrophonePermissionStatus> {
    return this.audioEngine.getPermissionStatus();
  }

  requestPermission(): Promise<Result<MicrophonePermissionStatus>> {
    return this.audioEngine.requestPermission();
  }

  async startSession(): Promise<Result<SleepSession>> {
    const toStarting = this.transition('STARTING');
    if (!toStarting.ok) {
      return toStarting;
    }

    const readiness = await this.sleepService.checkReadiness();
    if (!readiness.ok) {
      this.forceState('ERROR');
      return readiness;
    }
    if (!readiness.value.ready) {
      this.forceState('ERROR');
      if (readiness.value.microphone !== 'granted') {
        return err({
          code: 'PERMISSION_DENIED',
          message: 'Microphone permission is required to start a session',
        });
      }
      return err({
        code: 'CALIBRATION',
        message: 'Ambient calibration is required to start a session',
      });
    }

    const created = await this.sleepService.beginSession();
    if (!created.ok) {
      this.forceState('ERROR');
      return created;
    }

    const started = await this.audioEngine.startRecording(created.value.id);
    if (!started.ok) {
      await this.sleepService.deleteSession(created.value.id);
      this.forceState('ERROR');
      return started;
    }

    const recording = this.transition('RECORDING');
    if (!recording.ok) {
      this.forceState('ERROR');
      return recording;
    }

    this.activeSession = created.value;
    return ok(created.value);
  }

  async stopSession(): Promise<Result<SleepSession>> {
    // After Fast Refresh the service may already be IDLE while native capture still runs.
    if (
      this.liveState === 'IDLE' ||
      this.liveState === 'ERROR' ||
      this.liveState === 'COMPLETED'
    ) {
      const recovered = await this.forceStopRecording();
      if (!recovered.ok) {
        return recovered;
      }
      if (recovered.value) {
        return ok(recovered.value);
      }
      return err({
        code: 'AUDIO_ENGINE',
        message: 'No active session to stop',
      });
    }

    const toStopping = this.transition('STOPPING');
    if (!toStopping.ok) {
      return toStopping;
    }

    return this.finishActiveSession();
  }

  /**
   * Always stops the native engine. Completes `activeSession` when present.
   * Used when the Zustand machine was reset out from under a live capture.
   */
  async forceStopRecording(): Promise<Result<SleepSession | null>> {
    const session = this.activeSession;
    await this.audioEngine.stopRecording();
    this.clearFlushTimer();

    if (!session) {
      this.snoreBuffer = [];
      this.activeSession = null;
      this.forceState('IDLE');
      return ok(null);
    }

    this.forceState('STOPPING');
    const finished = await this.finishActiveSession();
    if (!finished.ok) {
      this.snoreBuffer = [];
      this.activeSession = null;
      this.forceState('IDLE');
      return finished;
    }
    return ok(finished.value);
  }

  /** Assumes `liveState === STOPPING` and `activeSession` is set. */
  private async finishActiveSession(): Promise<Result<SleepSession>> {
    const session = this.activeSession;
    if (!session) {
      this.forceState('ERROR');
      return err({
        code: 'AUDIO_ENGINE',
        message: 'No active session to stop',
      });
    }

    const stopped = await this.audioEngine.stopRecording();
    if (!stopped.ok) {
      this.forceState('ERROR');
      return stopped;
    }

    const flushed = await this.flushSnoreBuffer();
    if (!flushed.ok) {
      this.forceState('ERROR');
      return flushed;
    }

    const events = await this.snoreRepository.getEvents(session.id);
    if (!events.ok) {
      this.forceState('ERROR');
      return events;
    }

    const endedAt = Date.now();
    const totals = summarizeEvents(events.value);
    const inputs: ScoreInputs = {
      sessionDurationMs: Math.max(0, endedAt - session.startedAt),
      snoreCount: totals.snoreCount,
      totalSnoringMs: totals.totalSnoringMs,
      peakDb: totals.peakDb,
    };

    const sleepScore = this.analyticsService.computeSleepScore(inputs);
    const snoreScore = this.analyticsService.computeSnoreScore(inputs);
    const buckets = this.analyticsService.aggregateBuckets(
      session.id,
      events.value,
      TIMELINE_BUCKET_DURATION_MS,
    );

    const savedBuckets = await this.sleepService.saveBuckets(buckets);
    if (!savedBuckets.ok) {
      this.forceState('ERROR');
      return savedBuckets;
    }

    const completed = await this.sleepService.completeSession(session.id, {
      endedAt,
      state: 'COMPLETED',
      snoreCount: totals.snoreCount,
      totalSnoringMs: totals.totalSnoringMs,
      peakDb: totals.peakDb,
      peakAt: totals.peakAt,
      sleepScore: sleepScore.value,
      snoreScore: snoreScore.value,
    });

    if (!completed.ok) {
      this.forceState('ERROR');
      return completed;
    }

    const toCompleted = this.transition('COMPLETED');
    if (!toCompleted.ok) {
      this.forceState('ERROR');
      return toCompleted;
    }

    this.activeSession = null;
    this.transition('IDLE');
    void this.sleepService.enforceRetention();
    return completed;
  }

  async pauseSession(): Promise<Result<void>> {
    const paused = this.transition('PAUSED');
    if (!paused.ok) {
      return paused;
    }
    const result = await this.audioEngine.pauseRecording();
    if (!result.ok) {
      this.forceState('ERROR');
      return result;
    }
    return ok(undefined);
  }

  async resumeSession(): Promise<Result<void>> {
    const resumed = this.transition('RECORDING');
    if (!resumed.ok) {
      return resumed;
    }
    const result = await this.audioEngine.resumeRecording();
    if (!result.ok) {
      this.forceState('ERROR');
      return result;
    }
    return ok(undefined);
  }

  subscribeAudioLevel(listener: Listener<AudioLevelEvent>): () => void {
    this.levelListeners.add(listener);
    return () => {
      this.levelListeners.delete(listener);
    };
  }

  subscribeSnore(listener: Listener<SnoreEvent>): () => void {
    this.snoreListeners.add(listener);
    return () => {
      this.snoreListeners.delete(listener);
    };
  }

  subscribeInterruption(listener: Listener<AudioInterruptionEvent>): () => void {
    this.interruptionListeners.add(listener);
    return () => {
      this.interruptionListeners.delete(listener);
    };
  }

  private transition(to: SessionState): Result<void> {
    const from = this.liveState;
    if (!canTransition(from, to)) {
      return err({
        code: 'ILLEGAL_TRANSITION',
        message: `Cannot transition from ${from} to ${to}`,
        from,
        to,
      });
    }
    this.liveState = to;
    return ok(undefined);
  }

  private forceState(to: SessionState): void {
    this.liveState = to;
  }

  private async bufferSnoreEvent(event: SnoreEvent): Promise<void> {
    this.snoreBuffer.push(event);
    if (this.snoreBuffer.length === 1) {
      this.scheduleFlush();
    }
    if (this.snoreBuffer.length >= SNORE_BATCH_MAX_EVENTS) {
      await this.flushSnoreBuffer();
    }
  }

  private scheduleFlush(): void {
    this.clearFlushTimer();
    this.flushTimer = setTimeout(() => {
      void this.flushSnoreBuffer();
    }, SNORE_BATCH_MAX_WAIT_MS);
  }

  private clearFlushTimer(): void {
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private async flushSnoreBuffer(): Promise<Result<void>> {
    this.clearFlushTimer();
    if (this.snoreBuffer.length === 0) {
      return ok(undefined);
    }
    const batch = this.snoreBuffer;
    this.snoreBuffer = [];
    const saved = await this.snoreRepository.saveSnoreEvents(batch);
    if (!saved.ok) {
      this.snoreBuffer = batch.concat(this.snoreBuffer);
      return saved;
    }
    for (const event of batch) {
      for (const listener of this.snoreListeners) {
        listener(event);
      }
    }
    return ok(undefined);
  }
}

function summarizeEvents(events: readonly SnoreEvent[]): {
  snoreCount: number;
  totalSnoringMs: number;
  peakDb: number;
  peakAt: number | null;
} {
  let totalSnoringMs = 0;
  let peakDb = 0;
  let peakAt: number | null = null;
  for (const event of events) {
    totalSnoringMs += event.durationMs;
    if (event.peakDb >= peakDb) {
      peakDb = event.peakDb;
      peakAt = event.timestamp;
    }
  }
  return {
    snoreCount: events.length,
    totalSnoringMs,
    peakDb,
    peakAt,
  };
}
