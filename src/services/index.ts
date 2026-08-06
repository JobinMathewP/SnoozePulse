/**
 * Business-logic contracts.
 *
 * Services own orchestration, scoring, retention, and the recording lifecycle. They never
 * contain SQL (ADR-19). The store depends on these interfaces only — never on repositories
 * or the native engine directly (ADR-12, ADR-18).
 */

export type { IAudioService } from './IAudioService';
export type { ISleepService, RetentionCleanup, SessionReadiness } from './ISleepService';
export type { IAnalyticsService } from './IAnalyticsService';
