import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import type { IAudioEngine } from '@/native';
import type { ISnoreRepository, Result } from '@/repositories';
import { err, ok } from '@/repositories';
import type {
  AudioInterruptionEvent,
  AudioLevelEvent,
  MicrophonePermissionStatus,
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

import { deriveScoreInputs } from './analytics';
import type { IAnalyticsService } from './IAnalyticsService';
import type { IAudioService, SnippetPlaybackStatus } from './IAudioService';
import type { ISleepService } from './ISleepService';

type Listener<T> = (value: T) => void;

const IDLE_PLAYBACK: SnippetPlaybackStatus = {
  eventId: null,
  audioPath: null,
  playing: false,
  positionMs: 0,
  durationMs: 0,
};

/**
 * Recording lifecycle, guarded transitions, snore batching, and snippet playback.
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
  private readonly playbackListeners = new Set<Listener<SnippetPlaybackStatus>>();

  private levelUnsubscribe: (() => void) | null = null;
  private interruptionUnsubscribe: (() => void) | null = null;

  private player: AudioPlayer | null = null;
  private playerStatusSub: { remove: () => void } | null = null;
  private playbackStatus: SnippetPlaybackStatus = IDLE_PLAYBACK;

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
    void this.releasePlayer();
  }

  getPermissionStatus(): Promise<MicrophonePermissionStatus> {
    return this.audioEngine.getPermissionStatus();
  }

  requestPermission(): Promise<Result<MicrophonePermissionStatus>> {
    return this.audioEngine.requestPermission();
  }

  async startSession(): Promise<Result<SleepSession>> {
    // Capture and playback never share the session (native-audio.md).
    await this.releasePlayer();

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
    const inputs = deriveScoreInputs(
      {
        sessionDurationMs: Math.max(0, endedAt - session.startedAt),
        snoreCount: totals.snoreCount,
        totalSnoringMs: totals.totalSnoringMs,
        peakDb: totals.peakDb,
      },
      events.value,
    );

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

  async playSnippet(eventId: string, audioPath: string): Promise<Result<void>> {
    if (this.isCaptureActive()) {
      return err({
        code: 'AUDIO_BUSY',
        message: 'Cannot play a snippet while a sleep session is recording',
      });
    }
    if (!audioPath) {
      return err({
        code: 'NOT_FOUND',
        message: 'This snore episode has no audio snippet',
        entity: 'snoreEvent',
        id: eventId,
      });
    }

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
        interruptionMode: 'doNotMix',
      });

      const uri = toFileUri(audioPath);
      if (this.player && this.playbackStatus.audioPath === audioPath) {
        this.player.play();
        this.publishPlayback({
          ...this.playbackStatus,
          eventId,
          playing: true,
        });
        return ok(undefined);
      }

      await this.releasePlayer();
      const player = createAudioPlayer({ uri });
      this.player = player;
      this.playerStatusSub = player.addListener('playbackStatusUpdate', (status) => {
        this.publishPlayback({
          eventId,
          audioPath,
          playing: status.playing,
          positionMs: Math.round(status.currentTime * 1000),
          durationMs: Math.round(status.duration * 1000),
        });
        if (status.didJustFinish) {
          void player.seekTo(0).catch(() => undefined);
          this.publishPlayback({
            eventId,
            audioPath,
            playing: false,
            positionMs: 0,
            durationMs: Math.round(status.duration * 1000),
          });
        }
      });

      this.publishPlayback({
        eventId,
        audioPath,
        playing: true,
        positionMs: 0,
        durationMs: Math.round((player.duration || 0) * 1000),
      });
      player.play();
      return ok(undefined);
    } catch (cause) {
      await this.releasePlayer();
      return err({
        code: 'AUDIO_ENGINE',
        message: 'Failed to play snore snippet',
        cause,
      });
    }
  }

  async pauseSnippet(): Promise<Result<void>> {
    try {
      this.player?.pause();
      this.publishPlayback({
        ...this.playbackStatus,
        playing: false,
      });
      return ok(undefined);
    } catch (cause) {
      return err({
        code: 'AUDIO_ENGINE',
        message: 'Failed to pause snippet',
        cause,
      });
    }
  }

  async stopSnippet(): Promise<Result<void>> {
    await this.releasePlayer();
    return ok(undefined);
  }

  getPlaybackStatus(): SnippetPlaybackStatus {
    return this.playbackStatus;
  }

  subscribePlaybackStatus(
    listener: Listener<SnippetPlaybackStatus>,
  ): () => void {
    this.playbackListeners.add(listener);
    listener(this.playbackStatus);
    return () => {
      this.playbackListeners.delete(listener);
    };
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

  private isCaptureActive(): boolean {
    return (
      this.liveState === 'STARTING' ||
      this.liveState === 'RECORDING' ||
      this.liveState === 'PAUSED' ||
      this.liveState === 'STOPPING'
    );
  }

  private publishPlayback(status: SnippetPlaybackStatus): void {
    this.playbackStatus = status;
    for (const listener of this.playbackListeners) {
      listener(status);
    }
  }

  private async releasePlayer(): Promise<void> {
    this.playerStatusSub?.remove();
    this.playerStatusSub = null;
    if (this.player) {
      try {
        this.player.pause();
      } catch {
        // ignore
      }
      try {
        this.player.remove();
      } catch {
        // ignore
      }
      this.player = null;
    }
    this.publishPlayback(IDLE_PLAYBACK);
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

function toFileUri(path: string): string {
  if (path.startsWith('file://')) {
    return path;
  }
  return `file://${path}`;
}
