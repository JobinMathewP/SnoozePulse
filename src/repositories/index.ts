/**
 * Persistence contracts and SQLite implementations.
 *
 * Repositories own SQL and row mapping. They never contain business rules (ADR-19).
 * Callers are services; the store never talks to a repository directly (ADR-12).
 */

export type { Result } from './result';
export { err, mapPersistence, notFound, ok, persistenceError } from './resultHelpers';

export type { ISleepRepository } from './ISleepRepository';
export type { ISnoreRepository } from './ISnoreRepository';
export type { ISettingsRepository } from './ISettingsRepository';

export { SleepRepository } from './SleepRepository';
export { SnoreRepository } from './SnoreRepository';
export { SettingsRepository } from './SettingsRepository';
