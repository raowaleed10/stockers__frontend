import { Check } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import { focusRing } from './theme';

export interface OptionCardProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'title' | 'value' | 'aria-pressed'
> {
  title: ReactNode;
  description?: ReactNode;
  /** The big number at the bottom (a price). Usually a `<MoneyText />`. */
  value?: ReactNode;
  selected?: boolean;
  /** A small tag beside the title, for example "Now" (screen 12). */
  badge?: ReactNode;
  /**
   * `type` is the tall card of screen 7 (title, words, price at the bottom).
   * `price` is the wide card of screen 19 (a small title and a 58 px price).
   */
  layout?: 'type' | 'price';
  /** `danger` is the red choice (screen 19: the double price). */
  tone?: 'normal' | 'danger';
}

/** A big card to tap, one of a few choices. Selected has a thick brass border and a tick. */
export function OptionCard({
  title,
  description,
  value,
  selected = false,
  badge,
  layout = 'type',
  tone = 'normal',
  className,
  type = 'button',
  ...rest
}: OptionCardProps) {
  const danger = tone === 'danger';
  const priceLayout = layout === 'price';
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cx(
        'flex min-w-0 flex-col text-start text-c-text transition-colors duration-150',
        priceLayout
          ? 'min-h-[170px] justify-center gap-1.5 rounded-[22px] px-[26px]'
          : 'min-h-[196px] gap-2.5 rounded-[20px]',
        // Selected is a thicker border with the padding made smaller, so the card does not grow (screen 7).
        selected
          ? cx('border-[3px] border-c-brass bg-c-selected', priceLayout ? '' : 'p-[18px]')
          : priceLayout
            ? cx(
                'border-2',
                danger ? 'border-c-danger-line bg-c-danger-bg' : 'border-c-line-2 bg-c-raised',
              )
            : cx(
                'border p-5',
                danger ? 'border-c-danger-line bg-c-danger-bg' : 'border-c-line bg-c-raised',
              ),
        'active:bg-c-raised-2',
        focusRing.counter,
        className,
      )}
      {...rest}
    >
      <span className="flex w-full items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            className={cx(
              priceLayout ? 'text-[22px] font-semibold' : 'text-[26px] font-bold leading-tight',
              priceLayout && danger && 'text-c-danger-ink',
            )}
          >
            {title}
          </span>
          {badge ? (
            <span className="rounded-full bg-c-brass px-2.5 py-0.5 text-[14px] font-bold text-c-brass-ink">
              {badge}
            </span>
          ) : null}
        </span>
        {selected ? (
          <span
            aria-hidden="true"
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-c-brass text-c-brass-ink"
          >
            <Check size={18} strokeWidth={3} />
          </span>
        ) : null}
      </span>
      {description ? (
        <span className="text-[17px] leading-[1.4] text-c-text-3">{description}</span>
      ) : null}
      {value ? (
        <span
          className={cx(
            'font-num tabular-nums',
            priceLayout
              ? 'text-[58px] font-bold leading-none'
              : 'mt-auto text-[34px] font-semibold',
          )}
        >
          {value}
        </span>
      ) : null}
    </button>
  );
}
