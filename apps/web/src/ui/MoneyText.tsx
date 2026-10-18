import { formatRs, type FormatLang } from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { cx } from './cx';

export type MoneySize = 'inherit' | 'row' | 'big' | 'total' | 'hero';

// row: an amount in a list (screen 25). big and hero: the numbers in Barlow Condensed (26, 25 total).
const SIZE: Record<MoneySize, { text: string; condensed: boolean }> = {
  inherit: { text: '', condensed: false },
  row: { text: 'text-[20px] font-semibold', condensed: false },
  big: { text: 'text-[40px] font-semibold leading-none', condensed: true },
  // total: the amount that goes on a bill in the end dialogs (21, 23).
  total: { text: 'text-[52px] font-bold leading-none', condensed: true },
  hero: { text: 'text-[60px] font-bold leading-none', condensed: true },
};

export interface MoneyTextProps {
  /** Whole rupees. All the maths is done before this; the component only writes the amount. */
  value: number;
  size?: MoneySize;
  /** Crossed out, for a price that no longer applies. */
  strike?: boolean;
  /** Digits of the same width (the default). The owner dashboards are drawn with proportional digits. */
  tabular?: boolean;
  className?: string;
}

/** `Rs 1,350`, or `1,350 روپے` in Urdu. Digits are always Western. */
export function MoneyText({
  value,
  size = 'inherit',
  strike = false,
  tabular = true,
  className,
}: MoneyTextProps) {
  const { i18n } = useTranslation();
  const lang: FormatLang = i18n.language === 'ur' ? 'ur' : 'en';
  const look = SIZE[size];
  const text = formatRs(value, lang);
  const split = lang === 'ur' ? /^(\S+) (.+)$/u.exec(text) : null;

  return (
    <span
      className={cx(
        'whitespace-nowrap',
        tabular && 'tabular-nums',
        look.text,
        look.condensed && lang === 'en' && 'font-num',
        strike && 'line-through decoration-2 opacity-70',
        className,
      )}
    >
      {split ? (
        <>
          <span className={cx(look.condensed && 'font-num')}>{split[1]}</span>{' '}
          <span className="font-urdu text-[0.55em] font-medium">{split[2]}</span>
        </>
      ) : (
        text
      )}
    </span>
  );
}
