import { formatRs, MINUTE_MS, type FormatLang } from '@stockers/shared';
import type { TFunction } from 'i18next';

/** `1 h 45 min`, or `45 min` under an hour (screen 23). Whole minutes. */
export function durationWords(ms: number, t: TFunction<'end'>): string {
  const total = Math.max(0, Math.floor(ms / MINUTE_MS));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? t('duration.hm', { h, m }) : t('duration.m', { m });
}

/** The words of "Example, 1 hour 40 min" (screen 22): minutes made into hours and minutes. */
export function exampleWords(minutes: number, t: TFunction<'end'>): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 && m > 0
    ? t('duration.exampleHm', { h, m })
    : h > 0
      ? t('duration.h', { h })
      : t('duration.m', { m });
}

/**
 * The price of one minute after the first hour ("Rs 25"). A whole number of rupees reads as money; a price that does not
 * divide by 60 shows its paisa ("Rs 11.67"). The charge itself is always rounded once, to the nearest rupee.
 */
export function perMinuteMoney(perMinute: number, lang: FormatLang): string {
  if (Number.isInteger(perMinute)) return formatRs(perMinute, lang);
  const text = perMinute.toFixed(2);
  return lang === 'ur' ? `${text} روپے` : `Rs ${text}`;
}
