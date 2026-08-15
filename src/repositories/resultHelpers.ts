import type { AppError } from '@/types';

import type { Result } from './result';

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T>(error: AppError): Result<T> {
  return { ok: false, error };
}

export function persistenceError(message: string, cause?: unknown): AppError {
  return { code: 'PERSISTENCE', message, cause };
}

export function notFound(
  entity: 'session' | 'snoreEvent' | 'bucket',
  id: string,
): AppError {
  return {
    code: 'NOT_FOUND',
    message: `${entity} not found: ${id}`,
    entity,
    id,
  };
}

/** Map a driver throw into a typed persistence failure; never rethrow raw. */
export async function mapPersistence<T>(run: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await run());
  } catch (cause) {
    const detail = sqliteDetail(cause);
    if (__DEV__) {
      console.warn('[sqlite]', detail, cause);
    }
    return err(persistenceError(`SQLite operation failed: ${detail}`, cause));
  }
}

function sqliteDetail(cause: unknown): string {
  if (cause instanceof Error && cause.message.length > 0) {
    return cause.message;
  }
  if (typeof cause === 'string' && cause.length > 0) {
    return cause;
  }
  return 'unknown error';
}
