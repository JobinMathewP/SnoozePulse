import type { Result } from '@/repositories';

/**
 * One-time in-app rating prompt (ADR-30).
 *
 * Wraps the native store-review sheet behind the settings repository so the count and the
 * once-only flag persist. Never blocks a user flow and never asks its own "did you like
 * it?" question — Apple throttles the OS sheet and does not report the outcome, so this
 * service only decides *whether* to surface it.
 */
export interface IReviewService {
  /**
   * Record that another session was saved and, on the configured Nth save, surface the
   * native rating sheet exactly once for the lifetime of the install.
   * Resolves to `true` when the sheet was actually requested.
   */
  recordSavedSessionAndMaybeAsk(): Promise<Result<boolean>>;
}
