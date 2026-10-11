import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from './cx';
import { focusRing, type Theme } from './theme';

export interface SegmentedOption<V extends string = string> {
  value: V;
  label: ReactNode;
  /** The language of the label when it differs from the page, for example `ur` on "اردو". */
  lang?: string;
}

export interface SegmentedProps<V extends string = string> {
  options: SegmentedOption<V>[];
  value: V;
  onChange: (value: V) => void;
  theme: Theme;
  /** Names the group for screen readers, for example "Language" or "From AM or PM". */
  label: string;
  size?: 'md' | 'lg';
  className?: string;
}

const TRACK: Record<Theme, string> = {
  owner: 'rounded-[12px] bg-o-track',
  counter: 'rounded-[12px] border border-c-line bg-c-panel',
};

const ITEM: Record<Theme, Record<'on' | 'off' | 'md' | 'lg', string>> = {
  owner: {
    on: 'bg-o-card font-bold text-o-ink shadow-thumb',
    off: 'text-o-ink hover:bg-o-card/60',
    md: 'min-h-touch-owner px-[18px]',
    lg: 'min-h-[48px] px-3.5',
  },
  counter: {
    on: 'bg-c-raised-2 font-semibold text-c-text',
    off: 'text-c-text-2 active:bg-c-raised',
    md: 'min-h-touch px-4',
    lg: 'min-h-touch-main px-5',
  },
};

/** A small switch between a few choices, such as English or Urdu. One radio group: arrow keys move. */
export function Segmented<V extends string = string>({
  options,
  value,
  onChange,
  theme,
  label,
  size = 'md',
  className,
}: SegmentedProps<V>) {
  const group = useRef<HTMLDivElement>(null);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (!keys.includes(event.key) || !group.current) return;
    event.preventDefault();
    const rtl = getComputedStyle(group.current).direction === 'rtl';
    const forward = event.key === 'ArrowDown' || event.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
    const index = options.findIndex((option) => option.value === value);
    const next = options[(index + (forward ? 1 : -1) + options.length) % options.length];
    onChange(next.value);
    group.current.querySelector<HTMLElement>(`[data-value="${next.value}"]`)?.focus();
  }

  return (
    <div
      ref={group}
      role="radiogroup"
      aria-label={label}
      className={cx('inline-flex p-1', TRACK[theme], className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            data-value={option.value}
            lang={option.lang}
            onClick={() => onChange(option.value)}
            onKeyDown={onKeyDown}
            className={cx(
              'inline-flex items-center justify-center whitespace-nowrap rounded-[9px] text-[16px] transition-colors duration-150',
              ITEM[theme][size],
              ITEM[theme][selected ? 'on' : 'off'],
              option.lang === 'ur' && 'font-urdu text-[18px] leading-none',
              focusRing[theme],
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
