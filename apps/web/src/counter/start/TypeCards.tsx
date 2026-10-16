import { formatRs, type Rs } from '@stockers/shared';
import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormat } from '@/lib/use-format';
import { cx } from '@/ui/cx';
import { MoneyText } from '@/ui/MoneyText';
import { OptionCard } from '@/ui/OptionCard';
import { focusRing } from '@/ui/theme';
import type { StartKind } from './draft';

export const MIN_RATE = 1;
export const MAX_RATE = 999;

export interface TypeCardsProps {
  /** What each card costs: the frame, the double frame, and the Century rate for a minute. */
  prices: { single: Rs; double: Rs; century: Rs };
  selected: StartKind;
  onSelect: (kind: StartKind) => void;
  /** The type the game has now: its card gets the "Now" tag (screen 12). */
  current?: StartKind;
  /** The Century rate the worker is setting. */
  rate: Rs;
  onRate: (rate: Rs) => void;
  /** The line under "Century rate for this game": it differs on screen 7 and screen 12. */
  rateNote: ReactNode;
  /** A table where Century is not played shows only the two frames. */
  centuryAllowed?: boolean;
}

const STEP =
  'flex h-16 w-16 shrink-0 items-center justify-center rounded-[16px] border border-c-line-2 bg-c-panel font-semibold text-c-text transition-colors duration-150 active:bg-c-raised-2 disabled:cursor-not-allowed disabled:opacity-40 ' +
  focusRing.counter;

/**
 * The three cards of "Start a game" and "Change the game type" (screens 7 and 12), and the Century rate row under
 * them: a minus, the rate, a plus. The rate row is there for every type so the dialog does not change height, but it
 * only works while Century is picked.
 */
export function TypeCards({
  prices,
  selected,
  onSelect,
  current,
  rate,
  onRate,
  rateNote,
  centuryAllowed = true,
}: TypeCardsProps) {
  const { t } = useTranslation('start');
  const { lang } = useFormat();
  const inputId = useId();
  const century = selected === 'century';
  // While the box is typed in it shows what is typed (it may be empty for a moment); otherwise it shows the rate.
  const [typed, setTyped] = useState<string | null>(null);
  const text = typed ?? String(rate);

  const kinds: { kind: StartKind; price: Rs }[] = [
    { kind: 'single', price: prices.single },
    { kind: 'double', price: prices.double },
    ...(centuryAllowed ? [{ kind: 'century' as const, price: prices.century }] : []),
  ];

  return (
    <>
      <div className="flex flex-wrap gap-3.5">
        {kinds.map(({ kind, price }) => (
          <OptionCard
            key={kind}
            className="flex-[1_1_260px]"
            title={t(`types.${kind}.title`)}
            description={t(`types.${kind}.text`)}
            value={
              kind === 'century' ? (
                t('rate.perMinute', { price: formatRs(price, lang) })
              ) : (
                <MoneyText value={price} />
              )
            }
            selected={selected === kind}
            badge={current === kind ? t('change.now') : undefined}
            onClick={() => onSelect(kind)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-[18px] rounded-[18px] border border-c-line bg-c-raised px-5 py-[18px]">
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-0.5">
          <label htmlFor={inputId} className="text-[19px] font-bold">
            {t('rate.label')}
          </label>
          <span className="text-[16px] text-c-text-2">{rateNote}</span>
        </div>
        <div dir="ltr" className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label={t('rate.lower')}
            disabled={!century || rate <= MIN_RATE}
            className={cx(STEP, 'text-[30px]')}
            onClick={() => onRate(Math.max(MIN_RATE, rate - 1))}
          >
            −
          </button>
          <div className="flex min-h-[64px] items-center gap-1.5 rounded-[16px] border-2 border-c-brass bg-c-page px-4">
            <span className="text-[18px] text-c-text-2">{t('rate.rs')}</span>
            <input
              id={inputId}
              value={text}
              disabled={!century}
              inputMode="numeric"
              autoComplete="off"
              dir="ltr"
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '').slice(0, 3);
                setTyped(digits);
                const value = Number(digits);
                if (digits !== '' && value >= MIN_RATE) onRate(Math.min(MAX_RATE, value));
              }}
              onBlur={() => setTyped(null)}
              className="w-[70px] bg-transparent text-center font-num text-[40px] font-semibold text-c-text outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span className="text-[16px] text-c-text-2">{t('rate.unit')}</span>
          </div>
          <button
            type="button"
            aria-label={t('rate.raise')}
            disabled={!century || rate >= MAX_RATE}
            className={cx(STEP, 'text-[30px]')}
            onClick={() => onRate(Math.min(MAX_RATE, rate + 1))}
          >
            +
          </button>
        </div>
      </div>
    </>
  );
}
