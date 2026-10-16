import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import { focusRing } from './theme';

export interface PersonStatus {
  text: ReactNode;
  /** `busy` is red ("Playing on Table 1"), `warn` is amber ("Rs 600 waiting"). */
  tone?: 'neutral' | 'busy' | 'warn';
}

export interface PersonCardProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-pressed'
> {
  name: string;
  /** Already masked, for example `•••• 4512` (use `phoneTail()`). */
  phoneTail: string;
  /** A short line, for example "Last played Thursday". */
  note?: ReactNode;
  status?: PersonStatus;
  selected?: boolean;
  /**
   * `row` is a search result (screen 8), `tile` a recent player, `large` the "who lost?" card (screen 17).
   */
  variant?: 'row' | 'tile' | 'large';
}

const STATUS_TONE = {
  neutral: 'text-c-text-2',
  busy: 'text-c-danger-ink',
  warn: 'text-c-warn-ink',
} as const;

/** A player you can tap. The phone number is masked, so players with the same name can be told apart. */
export function PersonCard({
  name,
  phoneTail,
  note,
  status,
  selected = false,
  variant = 'row',
  className,
  type = 'button',
  ...rest
}: PersonCardProps) {
  const statusText = status ? (
    <span className={cx(STATUS_TONE[status.tone ?? 'neutral'])}>{status.text}</span>
  ) : null;

  const look = selected
    ? 'border-2 border-c-brass bg-c-selected'
    : variant === 'large'
      ? 'border-2 border-c-line-2 bg-c-raised'
      : variant === 'tile'
        ? 'border border-c-line-2 bg-c-panel'
        : 'border border-c-line bg-c-raised';

  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cx(
        'min-w-0 text-start text-c-text transition-colors duration-150 active:bg-c-raised-2',
        variant === 'row' &&
          'flex min-h-[68px] items-center justify-between gap-4 rounded-[14px] px-[18px]',
        variant === 'tile' &&
          'flex min-h-[72px] flex-col justify-center rounded-[14px] px-3.5 py-2',
        variant === 'large' &&
          'flex min-h-[220px] flex-col items-start justify-between rounded-[22px] px-[26px] py-6',
        look,
        focusRing.counter,
        className,
      )}
      {...rest}
    >
      {variant === 'row' ? (
        <>
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-3.5">
            <span className="text-[20px] font-semibold">{name}</span>
            <bdi dir="ltr" className="text-[16px] text-c-text-2">
              {phoneTail}
            </bdi>
          </span>
          <span className="text-[15px] text-c-text-2">{statusText ?? note}</span>
        </>
      ) : null}
      {variant === 'tile' ? (
        <>
          <span className="text-[18px] font-semibold">{name}</span>
          <bdi dir="ltr" className="text-start text-[14px] text-c-text-2">
            {phoneTail}
          </bdi>
        </>
      ) : null}
      {variant === 'large' ? (
        <>
          <span className="flex flex-col gap-1">
            <span className="text-[34px] font-bold leading-tight">{name}</span>
            <bdi dir="ltr" className="text-start text-[18px] text-c-text-2">
              {phoneTail}
            </bdi>
          </span>
          <span className="flex w-full justify-between gap-3 text-[18px] text-c-text-3">
            <span>{note}</span>
            {statusText}
          </span>
        </>
      ) : null}
    </button>
  );
}
