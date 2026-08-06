/**
 * Primitives shared by every other type module.
 *
 * This folder is types only: no enums, no const objects, no helper functions. Everything
 * here erases completely at compile time, which is why unions of string literals are used
 * where an enum would otherwise be natural.
 */

/** Milliseconds since the Unix epoch. Every instant in the domain is stored this way. */
export type EpochMs = number;

/** A calendar day as `YYYY-MM-DD`, used where a date is a label rather than an instant. */
export type IsoDate = string;

/** A half-open interval `[startedAt, endedAt)`. */
export interface DateRange {
  readonly startedAt: EpochMs;
  readonly endedAt: EpochMs;
}

/**
 * One page of results. `ISleepRepository.listSessions()` is paginated because a user with a
 * year of history has several hundred sessions and the History screen renders a window.
 */
export interface Page<T> {
  readonly items: readonly T[];
  /** Total rows matching the query, ignoring `offset` and `limit`. */
  readonly total: number;
  readonly offset: number;
  readonly limit: number;
}

/** Query window for a paginated read. */
export interface PageRequest {
  readonly offset: number;
  readonly limit: number;
}
