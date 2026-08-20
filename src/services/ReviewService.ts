import * as StoreReview from 'expo-store-review';

import type { ISettingsRepository, Result } from '@/repositories';
import { ok } from '@/repositories';
import { REVIEW_PROMPT_AFTER_SESSIONS } from '@/utils';

import type { IReviewService } from './IReviewService';

/** `app_settings` keys owned by the rating prompt (ADR-30). */
const KEY_SAVED_COUNT = 'review.savedCount';
const KEY_REQUESTED = 'review.requested';

/**
 * Thin seam over `expo-store-review` so the once-only logic can be unit-tested without the
 * native module. The default implementation delegates to the real store sheet; tests inject
 * a fake.
 */
export type ReviewPrompter = {
  isAvailableAsync: () => Promise<boolean>;
  requestReview: () => Promise<void>;
};

const defaultPrompter: ReviewPrompter = {
  isAvailableAsync: () => StoreReview.isAvailableAsync(),
  requestReview: () => StoreReview.requestReview(),
};

/**
 * Counts saved sessions and fires the native rating sheet once, on the Nth save
 * (`REVIEW_PROMPT_AFTER_SESSIONS`). All persistence goes through the KV settings repo; the
 * native call is behind an injectable {@link ReviewPrompter} (ADR-18).
 */
export class ReviewService implements IReviewService {
  constructor(
    private readonly settingsRepository: ISettingsRepository,
    private readonly prompter: ReviewPrompter = defaultPrompter,
  ) {}

  async recordSavedSessionAndMaybeAsk(): Promise<Result<boolean>> {
    const requestedResult = await this.settingsRepository.get(KEY_REQUESTED);
    if (!requestedResult.ok) {
      return requestedResult;
    }
    // Already prompted once — never ask again, and skip counting to save writes.
    if (requestedResult.value === 'true') {
      return ok(false);
    }

    const countResult = await this.settingsRepository.get(KEY_SAVED_COUNT);
    if (!countResult.ok) {
      return countResult;
    }
    const nextCount = parseCount(countResult.value) + 1;
    const saved = await this.settingsRepository.set(KEY_SAVED_COUNT, String(nextCount));
    if (!saved.ok) {
      return saved;
    }

    if (nextCount < REVIEW_PROMPT_AFTER_SESSIONS) {
      return ok(false);
    }

    // Threshold reached. Mark first so a failed/unavailable native call still never re-asks.
    const marked = await this.settingsRepository.set(KEY_REQUESTED, 'true');
    if (!marked.ok) {
      return marked;
    }

    const requested = await this.tryPrompt();
    return ok(requested);
  }

  /** Feature-detect and surface the sheet; swallow native quirks so callers never break. */
  private async tryPrompt(): Promise<boolean> {
    try {
      const available = await this.prompter.isAvailableAsync();
      if (!available) {
        return false;
      }
      await this.prompter.requestReview();
      return true;
    } catch {
      return false;
    }
  }
}

function parseCount(raw: string | null): number {
  const parsed = raw === null ? 0 : Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}
