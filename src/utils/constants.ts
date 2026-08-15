/**
 * Retention and batching constants for services (ADR-15, PRD storage).
 * Kept in utils so policy numbers live in one place and stay free of SQL.
 */

/** Snippets older than this are deleted first (ADR-15). */
export const SNIPPET_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/** Total snippet bytes allowed before oldest files are deleted (ADR-15). */
export const SNIPPET_QUOTA_BYTES = 500 * 1024 * 1024;

/** Flush buffered snore events when the buffer reaches this many episodes. */
export const SNORE_BATCH_MAX_EVENTS = 25;

/** Flush buffered snore events when the oldest buffered event is this old. */
export const SNORE_BATCH_MAX_WAIT_MS = 5_000;

/** Timeline aggregation window matching Summary mock density (~5 minutes). */
export const TIMELINE_BUCKET_DURATION_MS = 5 * 60 * 1000;

/** Document-directory subfolder where the native engine writes snippets. */
export const SNIPPET_DIRECTORY_NAME = 'snippets';

/**
 * Minimum wall-clock length for a session to be worth keeping (ADR-30). Shorter recordings
 * carry no useful scoring signal, so slide-to-end warns and discards them.
 */
export const MIN_SESSION_DURATION_MS = 5 * 60 * 1000;

/**
 * Surface the one-time native rating prompt on this many saved sessions (ADR-30). Chosen so
 * we only ask after the user has seen real value across a few nights.
 */
export const REVIEW_PROMPT_AFTER_SESSIONS = 3;
