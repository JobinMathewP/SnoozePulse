import type { IAnalyticsService, IAudioService, ISleepService } from '@/services';

/**
 * What the store is allowed to receive.
 *
 * Strict layering (ADR-12): the store talks to services only. Repositories and the native
 * engine are wired underneath the services at the composition root and never injected into
 * the store (ADR-18).
 */
export interface StoreDependencies {
  readonly audioService: IAudioService;
  readonly sleepService: ISleepService;
  readonly analyticsService: IAnalyticsService;
}
