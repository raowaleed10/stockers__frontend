import {
  clockParts,
  formatClock,
  formatDay,
  formatSlot,
  type ClockParts,
  type FormatLang,
  type ISO,
} from '@stockers/shared';
import { useMemo } from 'react';
import { useLanguageStore } from './language';

export interface Format {
  lang: FormatLang;
  /** `9:42 PM`, or `رات 9:42` in Urdu. */
  clock: (iso: ISO) => string;
  /** `Sat 3 Oct`, or `ہفتہ 3 اکتوبر` in Urdu; with `long`, `Saturday 3 October`. */
  day: (iso: ISO, long?: boolean) => string;
  /** `2:00 PM to 11:00 PM`, or `دوپہر 2:00 سے رات 11:00 تک` in Urdu. */
  slot: (slot: { start: string; end: string }) => string;
  /** The numbers (`9:42`) and the period (`PM`, `رات`) apart, for the big clock. */
  parts: (iso: ISO) => ClockParts;
}

/**
 * Times and dates in the language of the page. The wording is in `packages/shared` (`rules/format.ts`), so the
 * backend writes the same text; this only hands it the language.
 */
export function useFormat(): Format {
  const lang: FormatLang = useLanguageStore((state) => state.lang);
  return useMemo(
    () => ({
      lang,
      clock: (iso) => formatClock(iso, lang),
      day: (iso, long = false) => formatDay(iso, long, lang),
      slot: (slot) => formatSlot(slot, lang),
      parts: (iso) => clockParts(iso, lang),
    }),
    [lang],
  );
}
