import type { BillPart, FormatLang } from '@stockers/shared';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { partWords } from './bill-words';

const upperFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * What a waiting bill is for, in the page language: "2 frames lost, 2 teas", "half of a double", "Century". The
 * words come from the bill's parts, so nothing is stored as an English sentence. A canteen item keeps its stored
 * name, which can be in another script than the page, so that piece is its own `<bdi>` and reads in its own order.
 * `capitalize` starts the line with a capital when nothing comes before it (English only).
 */
export function BillWords({
  parts,
  capitalize = false,
}: {
  parts: readonly BillPart[];
  capitalize?: boolean;
}) {
  const { t, i18n } = useTranslation('board');
  const lang: FormatLang = i18n.language === 'ur' ? 'ur' : 'en';
  return (
    <>
      {parts.map((part, index) => {
        const words = partWords(part, t, lang);
        const text = capitalize && index === 0 ? upperFirst(words) : words;
        return (
          <Fragment key={`${part.kind}-${part.item ?? ''}`}>
            {index > 0 ? t('waiting.separator') : null}
            {part.kind === 'canteen' ? <bdi>{text}</bdi> : text}
          </Fragment>
        );
      })}
    </>
  );
}
