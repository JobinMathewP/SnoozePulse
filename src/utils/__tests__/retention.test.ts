import { planRetentionCleanup, SNIPPET_QUOTA_BYTES, SNIPPET_RETENTION_MS } from '@/utils';

describe('planRetentionCleanup', () => {
  const now = 1_700_000_000_000;

  it('deletes files older than the retention window', () => {
    const plan = planRetentionCleanup(
      [
        { path: 'a.wav', sizeBytes: 100, modifiedAtMs: now - SNIPPET_RETENTION_MS - 1 },
        { path: 'b.wav', sizeBytes: 100, modifiedAtMs: now - 1000 },
      ],
      now,
      SNIPPET_RETENTION_MS,
      SNIPPET_QUOTA_BYTES,
    );
    expect(plan.expiredPaths).toEqual(['a.wav']);
    expect(plan.overQuotaPaths).toEqual([]);
    expect(plan.remainingBytes).toBe(100);
  });

  it('deletes oldest files when over the byte quota', () => {
    const plan = planRetentionCleanup(
      [
        { path: 'old.wav', sizeBytes: 300, modifiedAtMs: now - 3000 },
        { path: 'mid.wav', sizeBytes: 300, modifiedAtMs: now - 2000 },
        { path: 'new.wav', sizeBytes: 300, modifiedAtMs: now - 1000 },
      ],
      now,
      SNIPPET_RETENTION_MS,
      500,
    );
    expect(plan.expiredPaths).toEqual([]);
    expect(plan.overQuotaPaths).toEqual(['old.wav', 'mid.wav']);
    expect(plan.remainingBytes).toBe(300);
  });

  it('applies age first, then quota on what remains', () => {
    const plan = planRetentionCleanup(
      [
        { path: 'expired.wav', sizeBytes: 900, modifiedAtMs: now - SNIPPET_RETENTION_MS - 5 },
        { path: 'keep-old.wav', sizeBytes: 400, modifiedAtMs: now - 2000 },
        { path: 'keep-new.wav', sizeBytes: 400, modifiedAtMs: now - 1000 },
      ],
      now,
      SNIPPET_RETENTION_MS,
      500,
    );
    expect(plan.expiredPaths).toEqual(['expired.wav']);
    expect(plan.overQuotaPaths).toEqual(['keep-old.wav']);
    expect(plan.remainingBytes).toBe(400);
  });
});
