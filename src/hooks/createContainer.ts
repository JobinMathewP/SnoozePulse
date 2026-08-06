import type { IAudioEngine } from '@/native';
import {
  SleepRepository,
  SnoreRepository,
  type ISleepRepository,
  type ISnoreRepository,
} from '@/repositories';
import {
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

import { PlaceholderAnalyticsService } from './PlaceholderAnalyticsService';

/**
 * Full object graph assembled once at app start (ADR-18).
 * Lives under hooks/ so `src/store/` stays free of repository imports (ADR-12).
 */
export interface Container extends StoreDependencies {
  readonly audioEngine: IAudioEngine;
  readonly sleepRepository: ISleepRepository;
  readonly snoreRepository: ISnoreRepository;
  readonly snippetStorage: ISnippetStorage;
}

/**
 * Construct every concrete dependency. This is the only place that may `new` services,
 * repositories, and the engine (ADR-18). Uses FakeAudioEngine until the native module lands.
 */
export async function createContainer(): Promise<Container> {
  const db = await ensureDatabase();
  const sleepRepository = new SleepRepository(db);
  const snoreRepository = new SnoreRepository(db);
  const snippetStorage = new ExpoSnippetStorage();
  const audioEngine = new FakeAudioEngine();
  const analyticsService: IAnalyticsService = new PlaceholderAnalyticsService();

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
