import type { IAudioEngine } from '@/native';
import type { ISleepRepository, ISnoreRepository } from '@/repositories';
import type { IAnalyticsService, IAudioService, ISleepService } from '@/services';

/**
 * What the store is allowed to receive.
 *
 * Strict layering (ADR-12): the store talks to services only. Repositories and the native
 * engine are wired underneath the services at the composition root and never injected into
 * the store, a hook, or a component (ADR-18).
 */
export interface StoreDependencies {
  readonly audioService: IAudioService;
  readonly sleepService: ISleepService;
  readonly analyticsService: IAnalyticsService;
}

/**
 * The full object graph the composition root constructs once at app start.
 *
 * Concrete classes are created here and nowhere else. Tests supply fakes that satisfy the
 * same interfaces. Extends `StoreDependencies` so the store-facing subset is explicit.
 */
export interface Container extends StoreDependencies {
  readonly audioEngine: IAudioEngine;
  readonly sleepRepository: ISleepRepository;
  readonly snoreRepository: ISnoreRepository;
}
