import type { ReadinessSignalsSnapshot } from '@/types';

import type { ReadinessEvaluateInput } from './IReadinessService';

/**
 * Pass signal flags through to evaluate. `null` (no sample) is not coerced to
 * false — the reducer treats missing motion/environment as "skip that check".
 */
export function toEvaluateFlags(
  signals: ReadinessSignalsSnapshot,
): Pick<ReadinessEvaluateInput, 'phoneSettled' | 'interacting' | 'environmentAcceptable'> {
  return {
    phoneSettled: signals.phoneSettled,
    interacting: signals.interacting,
    environmentAcceptable: signals.environmentAcceptable,
  };
}
