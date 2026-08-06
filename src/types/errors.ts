/**
 * Typed failures for the domain.
 *
 * Coding standards require typed errors rather than raw throws. Every recoverable failure
 * the app surfaces is a member of `AppError`, discriminated on `code`, so call sites can
 * switch exhaustively and TypeScript rejects an unhandled variant.
 *
 * The pattern is Result-shaped, not exception-shaped: services and repositories *return*
 * these values. Unrecoverable native crashes still go through the platform; everything the
 * JS layers can recover from or present to the user lives here.
 *
 * `message` is always human-readable and safe to show or log. `cause` is reserved for the
 * underlying platform object when one exists, and is intentionally `unknown` — never `any`
 * — so callers must narrow before inspecting it.
 */

/**
 * Microphone permission was denied or never granted.
 *
 * Surfaced by readiness checks on Home before a session can start, and again if the user
 * revokes permission mid-session.
 */
export interface PermissionError {
  readonly code: 'PERMISSION_DENIED';
  readonly message: string;
}

/**
 * The microphone is already held by another app or by a session that has not finished
 * tearing down.
 *
 * Distinct from `PermissionError`: the user has granted access, but the platform will not
 * hand over the audio session right now.
 */
export interface AudioBusyError {
  readonly code: 'AUDIO_BUSY';
  readonly message: string;
}

/**
 * The native audio engine failed while starting, stopping, calibrating, or writing a
 * snippet.
 *
 * `cause` holds the platform error when one was provided. Detection itself continues when
 * only snippet writing fails — that case becomes a null `SnoreEvent.audioPath`, not this
 * error.
 */
export interface AudioEngineError {
  readonly code: 'AUDIO_ENGINE';
  readonly message: string;
  readonly cause?: unknown;
}

/**
 * A state-machine transition that is not allowed from the current state.
 *
 * The store rejects these rather than applying them silently (architecture.md §3). `from`
 * and `to` are `SessionState` strings kept as `string` here so this module does not create
 * a circular import with `session.ts`; callers that build the error already know the union.
 */
export interface IllegalTransitionError {
  readonly code: 'ILLEGAL_TRANSITION';
  readonly message: string;
  readonly from: string;
  readonly to: string;
}

/**
 * SQLite or repository I/O failed.
 *
 * Repositories map driver exceptions into this shape and never let a raw SQLite error
 * escape into the store or UI.
 */
export interface PersistenceError {
  readonly code: 'PERSISTENCE';
  readonly message: string;
  readonly cause?: unknown;
}

/**
 * A snore snippet could not be written because free space or the retention cap was hit.
 *
 * Snippets are retained for 30 days or 500 MB, whichever comes first (ADR-15). Hitting the
 * cap does not discard the snore episode itself — only the file — which is why
 * `SnoreEvent.audioPath` is nullable rather than this error being fatal to detection.
 */
export interface StorageQuotaError {
  readonly code: 'STORAGE_QUOTA';
  readonly message: string;
  readonly usedBytes: number;
  readonly limitBytes: number;
}

/**
 * A requested session, snore event, or bucket row was not found.
 *
 * `entity` narrows which table was queried so the UI can choose a specific empty state
 * rather than a generic "missing" message.
 */
export interface NotFoundError {
  readonly code: 'NOT_FOUND';
  readonly message: string;
  readonly entity: 'session' | 'snoreEvent' | 'bucket';
  readonly id: string;
}

/**
 * Ambient noise calibration could not finish.
 *
 * Typical causes: timeout, too few samples, or a system interruption that seized the audio
 * session mid-pass. Home treats this as a failed readiness check, not a session error.
 */
export interface CalibrationError {
  readonly code: 'CALIBRATION';
  readonly message: string;
}

/**
 * Every recoverable failure the app surfaces to callers.
 *
 * Discriminate on `code`. Adding a new variant is a breaking change for every exhaustive
 * switch; prefer extending an existing member's fields when the failure is a refinement of
 * one already listed.
 */
export type AppError =
  | PermissionError
  | AudioBusyError
  | AudioEngineError
  | IllegalTransitionError
  | PersistenceError
  | StorageQuotaError
  | NotFoundError
  | CalibrationError;

/**
 * The discriminant codes of `AppError`.
 *
 * Useful for logging and for APIs that accept a code without the full payload. Derived from
 * the union so it cannot drift from the members above.
 */
export type AppErrorCode = AppError['code'];
