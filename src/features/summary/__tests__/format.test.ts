import type { SnoreEvent } from '@/types';

import { formatSummaryDateLabel, playableSnippetCount, SNIPPET_LIST_LIMIT, toSnippetRows } from '../format';

function snore(partial: Partial<SnoreEvent> & Pick<SnoreEvent, 'id' | 'timestamp' | 'peakDb'>): SnoreEvent {
  return {
    sessionId: 's1',
    durationMs: 10_000,
    confidence: 0.8,
    classLabel: 'snoring',
    spectralPeakHz: null,
    audioPath: 'file://clip.m4a',
    ...partial,
  };
}

describe('formatSummaryDateLabel', () => {
  it('labels an overnight session by bedtime, not wake time', () => {
    const startedAt = new Date(2026, 7, 14, 22, 0, 0).getTime();
    const endedAt = new Date(2026, 7, 15, 6, 0, 0).getTime();
    expect(formatSummaryDateLabel(startedAt)).toBe('Aug 14, 2026');
    expect(formatSummaryDateLabel(endedAt)).not.toBe('Aug 14, 2026');
  });
});

describe('toSnippetRows', () => {
  it('drops events without audio', () => {
    const rows = toSnippetRows([
      snore({ id: 'a', timestamp: 1, peakDb: 70, audioPath: null }),
      snore({ id: 'b', timestamp: 2, peakDb: 40 }),
    ]);
    expect(rows.map((row) => row.event.id)).toEqual(['b']);
  });

  it('keeps the loudest clips then lists them in night order', () => {
    const rows = toSnippetRows([
      snore({ id: 'late-quiet', timestamp: 300, peakDb: 30 }),
      snore({ id: 'early-loud', timestamp: 100, peakDb: 80 }),
      snore({ id: 'mid', timestamp: 200, peakDb: 50 }),
    ]);
    expect(rows.map((row) => row.event.id)).toEqual(['early-loud', 'mid', 'late-quiet']);
  });

  it('caps at SNIPPET_LIST_LIMIT loudest playable clips', () => {
    const events = Array.from({ length: 15 }, (_, i) =>
      snore({
        id: `e${i}`,
        timestamp: i,
        peakDb: i,
      }),
    );
    const rows = toSnippetRows(events);
    expect(playableSnippetCount(events)).toBe(15);
    expect(rows).toHaveLength(SNIPPET_LIST_LIMIT);
    expect(rows.map((row) => row.event.peakDb)).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });
});
