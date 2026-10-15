import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from './cx';
import { focusRing, groupFocusRing, type Theme } from './theme';
import { DRAWN_HEIGHT, DRAWN_MARGIN_Y, TOUCH_BOX, type DrawnSize } from './touch-box';

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
  /**
   * Counter only. Keeps the height a screen draws (44 for the language switch, 52 or 54 for the tabs on
   * screens 20, 24 and 30) inside a 56 px pressable box. The track stays drawn + 8 px.
   */
  drawn?: DrawnSize;
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

// A drawn item (touch-box.ts): the same colours with the pressed state on the shape, and the sides a screen draws.
const DRAWN_ITEM: Record<'on' | 'off' | 'md' | 'lg', string> = {
  on: ITEM.counter.on,
  off: 'text-c-text-2 group-active:bg-c-raised',
  md: 'px-4 rounded-[9px]',
  lg: 'px-[18px] rounded-[11px]',
};

/** A small switch between a few choices, such as English or Urdu. One radio group: arrow keys move. */
export function Segmented<V extends string = string>({
  options,
  value,
  onChange,
  theme,
  label,
  size = 'md',
  drawn,
  className,
}: SegmentedProps<V>) {
  const group = useRef<HTMLDivElement>(null);
  const drawnSize = theme === 'counter' ? drawn : undefined;

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
        const words = cx(
          'text-[16px]',
          // Screens 1 to 6 draw the Urdu word of the language switch at 15 px; the owner portal keeps 18.
          option.lang === 'ur' &&
            cx('font-urdu leading-none', theme === 'counter' ? 'text-[15px]' : 'text-[18px]'),
        );
        const common = {
          type: 'button' as const,
          role: 'radio' as const,
          'aria-checked': selected,
          tabIndex: selected ? 0 : -1,
          'data-value': option.value,
          lang: option.lang,
          onClick: () => onChange(option.value),
          onKeyDown,
        };

        if (drawnSize) {
          return (
            <button
              key={option.value}
              {...common}
              data-drawn={drawnSize}
              className={cx(
                'inline-flex min-h-touch items-center',
                TOUCH_BOX,
                DRAWN_MARGIN_Y[drawnSize],
              )}
            >
              <span
                data-visible=""
                className={cx(
                  'inline-flex flex-1 items-center justify-center whitespace-nowrap transition-colors duration-150',
                  DRAWN_HEIGHT[drawnSize],
                  DRAWN_ITEM[size],
                  DRAWN_ITEM[selected ? 'on' : 'off'],
                  words,
                  groupFocusRing,
                )}
              >
                {option.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={option.value}
            {...common}
            className={cx(
              'inline-flex items-center justify-center whitespace-nowrap rounded-[9px] transition-colors duration-150',
              ITEM[theme][size],
              ITEM[theme][selected ? 'on' : 'off'],
              words,
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
