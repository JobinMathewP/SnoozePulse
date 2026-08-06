/**
 * Assemble the object graph once at app start (ADR-18).
 *
 * Lives under hooks/ so `src/store/` never imports repositories (ADR-12). This file is
 * the only place that may construct concrete services, repositories, and the audio engine.
 * Until the native module ships we inject {@link FakeAudioEngine}; Task 4.5 wires the real
 * {@link AnalyticsService} in place of the earlier placeholder.
 */

import type { IAudioEngine } from '@/native';
import {
  SleepRepository,
  SnoreRepository,
  type ISleepRepository,
  type ISnoreRepository,
} from '@/repositories';
import {
  AnalyticsService,
  AudioService,
  ExpoSnippetStorage,
  FakeAudioEngine,
  SleepService,
  ensureDatabase,
  type IAnalyticsService,
  type IAudioService,
  type ISleepService,
  type ISnippetStorage,
} from '@/services';
import type { StoreDependencies } from '@/store';

export interface Container extends StoreDependencies {
  readonly audioEngine: IAudioEngine;
  readonly sleepRepository: ISleepRepository;
  readonly snoreRepository: ISnoreRepository;
  readonly snippetStorage: ISnippetStorage;
}

export async function createContainer(): Promise<Container> {
  // 1) Persistence — open SQLite (migrations run inside ensureDatabase).
  const db = await ensureDatabase();
  const sleepRepository = new SleepRepository(db);
  const snoreRepository = new SnoreRepository(db);

  // 2) Filesystem + engine — snippets under document/snippets; fake engine until M5.
  const snippetStorage = new ExpoSnippetStorage();
  const audioEngine = new FakeAudioEngine();

  // 3) Analytics before AudioService — stopSession needs scores + buckets at flush time.
  const analyticsService: IAnalyticsService = new AnalyticsService(
    sleepRepository,
    snoreRepository,
  );

  const sleepService: ISleepService = new SleepService(
    sleepRepository,
    snoreRepository,
    audioEngine,
    snippetStorage,
  );

  const audioService: IAudioService = new AudioService(
    audioEngine,
    sleepService,
    snoreRepository,
    analyticsService,
  );

  // 4) Boot maintenance — ensure dir exists, then reclaim orphans / enforce ADR-15 caps.
  await snippetStorage.ensureDirectory();
  void sleepService.reclaimOrphanedSnippets();
  void sleepService.enforceRetention();

  return {
    audioEngine,
    sleepRepository,
    snoreRepository,
    snippetStorage,
    analyticsService,
    sleepService,
    audioService,
  };
}
