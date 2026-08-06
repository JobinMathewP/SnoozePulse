/**
 * Pure retention selection — which snippet files to delete under ADR-15.
 * Side-effect free: callers perform the deletes.
 */

export interface SnippetFileInfo {
  readonly path: string;
  readonly sizeBytes: number;
  /** Last modification time, epoch ms. */
  readonly modifiedAtMs: number;
}

export interface RetentionPlan {
  /** Paths deleted because they are older than the retention window. */
  readonly expiredPaths: readonly string[];
  /** Paths deleted to bring total size under the quota (oldest first). */
  readonly overQuotaPaths: readonly string[];
  /** Bytes remaining after both passes. */
  readonly remainingBytes: number;
}

/**
 * Plan deletions: drop files older than `retentionMs`, then drop oldest files until
 * total size is ≤ `quotaBytes`. "Whichever comes first" is applied by running both
 * limits on the same inventory.
 */
export function planRetentionCleanup(
  files: readonly SnippetFileInfo[],
  nowMs: number,
  retentionMs: number,
  quotaBytes: number,
): RetentionPlan {
  const expiredPaths: string[] = [];
  const kept: SnippetFileInfo[] = [];

  for (const file of files) {
    if (nowMs - file.modifiedAtMs > retentionMs) {
      expiredPaths.push(file.path);
    } else {
      kept.push(file);
    }
  }

  kept.sort((a, b) => a.modifiedAtMs - b.modifiedAtMs);

  const overQuotaPaths: string[] = [];
  let remainingBytes = kept.reduce((sum, file) => sum + file.sizeBytes, 0);
  let index = 0;
  while (remainingBytes > quotaBytes && index < kept.length) {
    const file = kept[index];
    overQuotaPaths.push(file.path);
    remainingBytes -= file.sizeBytes;
    index += 1;
  }

  return { expiredPaths, overQuotaPaths, remainingBytes: Math.max(0, remainingBytes) };
}
