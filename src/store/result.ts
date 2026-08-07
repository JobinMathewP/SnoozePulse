import type { AppError } from '@/types';

/**
 * Store-local Result helpers. Mirrors the service/native envelope so the store stays
 * above persistence (ADR-12).
 */
export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: AppError };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T>(error: AppError): Result<T> {
  return { ok: false, error };
}
