import type { AppError } from '@/types';

/**
 * Success / failure envelope for repository (and service) methods.
 *
 * Structurally identical to `Result` in `src/native/IAudioEngine.ts`. Kept local so
 * repositories do not import from native solely for a utility type, and so `src/types/`
 * stays untouched under Task 1.6's file constraints. Prefer returning this over throwing.
 */
export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: AppError };
