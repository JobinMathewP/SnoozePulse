import { Directory, File, Paths } from 'expo-file-system';

import type { Result } from '@/repositories';
import { err, ok, persistenceError } from '@/repositories';
import { SNIPPET_DIRECTORY_NAME, type SnippetFileInfo } from '@/utils';

import type { ISnippetStorage } from './ISnippetStorage';

/**
 * Snippet files under `Paths.document/snippets` (never cache — native-audio.md).
 */
export class ExpoSnippetStorage implements ISnippetStorage {
  private readonly directory: Directory;

  constructor() {
    this.directory = new Directory(Paths.document, SNIPPET_DIRECTORY_NAME);
  }

  get directoryUri(): string {
    return this.directory.uri;
  }

  async ensureDirectory(): Promise<Result<void>> {
    try {
      if (!this.directory.exists) {
        this.directory.create({ intermediates: true, idempotent: true });
      }
      return ok(undefined);
    } catch (cause) {
      return err(persistenceError('Failed to create snippets directory', cause));
    }
  }

  async listFiles(): Promise<Result<readonly SnippetFileInfo[]>> {
    try {
      const ensured = await this.ensureDirectory();
      if (!ensured.ok) {
        return ensured;
      }
      if (!this.directory.exists) {
        return ok([]);
      }
      const entries = this.directory.list();
      const files: SnippetFileInfo[] = [];
      for (const entry of entries) {
        if (entry instanceof File && entry.exists) {
          files.push({
            path: entry.uri,
            sizeBytes: entry.size,
            modifiedAtMs: entry.lastModified ?? entry.modificationTime ?? 0,
          });
        }
      }
      return ok(files);
    } catch (cause) {
      return err(persistenceError('Failed to list snippet files', cause));
    }
  }

  async deleteFile(path: string): Promise<Result<void>> {
    try {
      const file = new File(path);
      if (file.exists) {
        file.delete();
      }
      return ok(undefined);
    } catch (cause) {
      return err(persistenceError(`Failed to delete snippet: ${path}`, cause));
    }
  }
}
