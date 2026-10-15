import type { BillPart, FormatLang } from '@stockers/shared';
import type { TFunction } from 'i18next';

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/**
 * A canteen item with its count: "2 teas". The name is stored as typed. In English it is written in lower case,
 * with an "s" added for more than one unless the name already ends in "s" or holds a comma ("water, small").
 * Urdu keeps the stored name as it is.
 */
export function canteenWords(item: string, count: number, lang: FormatLang): string {
  if (lang === 'ur') return `${count} ${item}`;
  const name = lowerFirst(item);
  const many = count === 1 || name.includes(',') || /s$/i.test(name) ? name : `${name}s`;
  return `${count} ${many}`;
}

/** The words of one part of a bill: "2 frames lost", "half of a double", "Century", "2 teas". */
export function partWords(part: BillPart, t: TFunction<'board'>, lang: FormatLang): string {
  switch (part.kind) {
    case 'frame':
      return t('parts.frame', { count: part.count });
    case 'game':
      return t('parts.game', { count: part.count });
    case 'double':
      return t('parts.double', { count: part.count });
    case 'century':
      return t('parts.century', { count: part.count });
    case 'room':
      return t('parts.room', { count: part.count });
    case 'damage':
      return t('parts.damage', { count: part.count });
    case 'canteen':
      return part.item
        ? canteenWords(part.item, part.count, lang)
        : t('parts.canteenAny', { count: part.count });
  }
}
