import type { IEnvironmentMonitor } from './IReadinessSignals';

/**
 * Pre-start environmental audio. Always `null` until a short sample goes through
 * the existing native module (ADR-32) — no second capture pipeline. Missing
 * sample does not block auto-start; a known-noisy sample does.
 */
export class UnknownEnvironmentMonitor implements IEnvironmentMonitor {
  getAcceptable(): boolean | null {
    return null;
  }

  subscribe(listener: (acceptable: boolean | null) => void): () => void {
    listener(null);
    return () => undefined;
  }
}
