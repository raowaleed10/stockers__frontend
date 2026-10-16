import i18n from '@/lib/i18n';
import type { DiscountDraft } from './draft';

/**
 * The discount as the server takes it. The reason is written in English whatever language the counter is in, like every
 * reason the owners read (D59), and the note is what the worker typed.
 */
export function discountRequest(discount: DiscountDraft) {
  const english = i18n.getFixedT('en', 'checkout');
  const note = discount.note.trim();
  return {
    amount: discount.amount,
    reason: english(`discount.reasons.${discount.reason}`),
    ...(note ? { note } : {}),
  };
}
