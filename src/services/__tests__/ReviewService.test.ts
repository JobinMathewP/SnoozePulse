import { ReviewService, type ReviewPrompter } from '@/services/ReviewService';
import { REVIEW_PROMPT_AFTER_SESSIONS } from '@/utils';
import { FakeSettingsRepository } from '@/__tests__/helpers/fakes';

function build(available = true) {
  const repo = new FakeSettingsRepository();
  const requestReview = jest.fn(async () => undefined);
  const prompter: ReviewPrompter = {
    isAvailableAsync: async () => available,
    requestReview,
  };
  const service = new ReviewService(repo, prompter);
  return { repo, service, requestReview };
}

describe('ReviewService.recordSavedSessionAndMaybeAsk', () => {
  it('does not prompt before the configured session count', async () => {
    const { service, requestReview } = build();
    for (let i = 1; i < REVIEW_PROMPT_AFTER_SESSIONS; i += 1) {
      const result = await service.recordSavedSessionAndMaybeAsk();
      expect(result.ok && result.value).toBe(false);
    }
    expect(requestReview).not.toHaveBeenCalled();
  });

  it('prompts exactly once on the Nth saved session', async () => {
    const { service, requestReview } = build();
    let requested = false;
    for (let i = 0; i < REVIEW_PROMPT_AFTER_SESSIONS; i += 1) {
      const result = await service.recordSavedSessionAndMaybeAsk();
      if (result.ok && result.value) {
        requested = true;
      }
    }
    expect(requested).toBe(true);
    expect(requestReview).toHaveBeenCalledTimes(1);
  });

  it('never asks again after the first prompt', async () => {
    const { service, requestReview } = build();
    for (let i = 0; i < REVIEW_PROMPT_AFTER_SESSIONS + 5; i += 1) {
      await service.recordSavedSessionAndMaybeAsk();
    }
    expect(requestReview).toHaveBeenCalledTimes(1);
  });

  it('marks as prompted even when the native sheet is unavailable, so it never re-asks', async () => {
    const { service, requestReview } = build(false);
    for (let i = 0; i < REVIEW_PROMPT_AFTER_SESSIONS + 3; i += 1) {
      await service.recordSavedSessionAndMaybeAsk();
    }
    // Unavailable: requestReview is never reached, and the flag stops further attempts.
    expect(requestReview).not.toHaveBeenCalled();
    const again = await service.recordSavedSessionAndMaybeAsk();
    expect(again.ok && again.value).toBe(false);
  });
});

describe('ReviewService.requestReviewManually', () => {
  it('surfaces the sheet on demand when available', async () => {
    const { service, requestReview } = build();
    const result = await service.requestReviewManually();
    expect(result.ok).toBe(true);
    expect(requestReview).toHaveBeenCalledTimes(1);
  });

  it('never throws when the sheet is unavailable', async () => {
    const { service } = build(false);
    const result = await service.requestReviewManually();
    expect(result.ok).toBe(true);
  });
});
