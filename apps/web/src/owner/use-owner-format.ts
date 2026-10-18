import {
  formatAmount,
  formatDate,
  formatRs,
  formatWeekday,
  monthName,
  type TableRef,
} from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { useFormat } from '@/lib/use-format';

/**
 * Money, dates and table names in the language of the page, for the owner screens. The wording is in `packages/shared`, so the
 * backend writes the same text; this only hands it the language.
 */
export function useOwnerFormat() {
  const format = useFormat();
  const { t } = useTranslation('dashboard');
  const { lang } = format;

  return {
    ...format,
    /** `Rs 1,350`, or `1,350 روپے` in Urdu. */
    money: (value: number) => formatRs(value, lang),
    /** `1,350`, with no `Rs`: the figures of a table that says Rs once in its heading. */
    amount: (value: number) => formatAmount(value),
    /** `Table 4`, `Room 1`: a table written in the language of the page. */
    table: (ref: TableRef) => t(`table.${ref.kind}`, { number: ref.number.replace(/^R/i, '') }),
    /** The name of the month of an ISO date or a `2026-09` key. */
    month: (key: string, short = false) => monthName(Number(key.slice(5, 7)), lang, short),
    /** `3 Oct`: the day and the month, from a moment. */
    date: (iso: string) => formatDate(iso, lang),
    /** `Saturday`, from a moment. */
    weekday: (iso: string) => formatWeekday(iso, lang),
    /** `4 September`: the day and the month written out, from an ISO date (`2026-09-04`). */
    longDate: (iso: string) =>
      `${Number(iso.slice(8, 10))} ${monthName(Number(iso.slice(5, 7)), lang)}`,
  };
}

/** The day at noon club time, for the formatters that need a moment (`2026-09-04` → `2026-09-04T12:00:00+05:00`). */
export const noonOf = (isoDate: string) => `${isoDate.slice(0, 10)}T12:00:00+05:00`;
