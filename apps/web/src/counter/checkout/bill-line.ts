import {
  creditAgeDays,
  formatRs,
  isOldCredit,
  toClubIso,
  type BillPart,
  type FormatLang,
  type WaitingBill,
} from '@stockers/shared';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useNow } from '@/lib/clock';
import { useFormat } from '@/lib/use-format';
import { canteenWords } from '../components/bill-words';

/** How a line of a bill card is drawn: amber when old credit is more than 15 days old, green when advance is used. */
export type BillLineTone = 'plain' | 'warn' | 'ok';

/** One part of tonight's bill, in words: "3 frames", "one charged double", "Half a double", "Century Rs 630", "2 teas". */
function partText(part: BillPart, t: TFunction<'checkout'>, lang: FormatLang): string {
  const doubled = part.doubled ? `, ${t('parts.doubled', { count: part.doubled })}` : '';
  switch (part.kind) {
    case 'frame':
      return `${t('parts.frame', { count: part.count })}${doubled}`;
    case 'game':
      return `${t('parts.game', { count: part.count })}${doubled}`;
    case 'double':
      return t('parts.double', { count: part.count });
    case 'century':
      return t('parts.century', { count: part.count, amount: formatRs(part.amount, lang) });
    case 'room':
      // One room reads as it does on his statement ("Room 1, 1 h 40 min"), the way a typed note does.
      return part.text ?? t('parts.room', { count: part.count });
    case 'damage':
      return t('parts.damage', { count: part.count });
    case 'canteen':
      return part.item
        ? canteenWords(part.item, part.count, lang)
        : t('parts.canteen', { count: part.count });
  }
}

/**
 * The line under a player's name on a checkout card (screen 24): what tonight's bill is made of, then the old credit
 * with its age when it is more than 15 days, or the advance used. The words are built from the bill's parts, so a
 * frame, a double, a Century and a room are words in the page language; names and typed notes show as stored.
 */
export function useBillLine() {
  const { t } = useTranslation('checkout');
  const { lang } = useFormat();
  const now = useNow(60_000);
  const money = (value: number) => formatRs(value, lang);

  return (
    bill: Pick<WaitingBill, 'parts' | 'oldCredit' | 'advance' | 'oldestUnpaidAt'>,
  ): { text: string; tone: BillLineTone } => {
    const parts = bill.parts.map((part) => partText(part, t, lang)).join(t('comma'));
    const old = bill.oldCredit > 0;
    const days = bill.oldestUnpaidAt ? creditAgeDays(bill.oldestUnpaidAt, toClubIso(now)) : 0;
    const aged = old && isOldCredit(bill.oldestUnpaidAt, toClubIso(now));

    if (old && parts) {
      const key = aged ? 'card.withOldDays' : 'card.withOld';
      return {
        text: t(key, { parts, amount: money(bill.oldCredit), days }),
        tone: aged ? 'warn' : 'plain',
      };
    }
    if (old) {
      return {
        text: t(aged ? 'card.owesDays' : 'card.owes', { amount: money(bill.oldCredit), days }),
        tone: aged ? 'warn' : 'plain',
      };
    }
    if (bill.advance > 0 && parts) {
      return { text: t('card.withAdvance', { parts, advance: money(bill.advance) }), tone: 'ok' };
    }
    return { text: parts, tone: 'plain' };
  };
}
