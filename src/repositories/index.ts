/**
 * Persistence contracts.
 *
 * Repositories own SQL and row mapping. They never contain business rules (ADR-19).
 * Callers are services; the store never talks to a repository directly (ADR-12).
 */

export type { Result } from './result';
export type { ISleepRepository } from './ISleepRepository';
export type { ISnoreRepository } from './ISnoreRepository';
