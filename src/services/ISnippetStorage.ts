import type { Result } from '@/repositories';
import type { SnippetFileInfo } from '@/utils';

/**
 * Document-directory snippet files. SleepService uses this for retention and orphan
 * reclaim; the native engine writes into the same directory. No SQL (ADR-19).
 */
export interface ISnippetStorage {
  /** Ensure the snippets directory exists under the document directory. */
  ensureDirectory(): Promise<Result<void>>;

  /** Absolute URI of the snippets directory (trailing slash optional). */
  readonly directoryUri: string;

  listFiles(): Promise<Result<readonly SnippetFileInfo[]>>;

  deleteFile(path: string): Promise<Result<void>>;
}
