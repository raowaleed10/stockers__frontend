import type { ButtonHTMLAttributes } from 'react';
import { cx } from './cx';
import { focusRing, groupFocusRing, type Theme } from './theme';
import { DRAWN_HEIGHT, DRAWN_MARGIN_Y, TOUCH_BOX, type DrawnSize } from './touch-box';

export type ChipSize = 'md' | 'lg';

const SIZE: Record<Theme, Record<ChipSize, string>> = {
  counter: { md: 'min-h-touch px-4 text-[16px]', lg: 'min-h-touch-main px-5 text-[18px]' },
  owner: { md: 'min-h-touch-owner px-3.5 text-[15px]', lg: 'min-h-[48px] px-4 text-[16px]' },
};

// The same paddings and text without a height, for the shape inside a drawn counter chip.
const DRAWN_SHAPE: Record<ChipSize, string> = {
  md: 'px-4 text-[16px]',
  lg: 'px-5 text-[18px]',
};

const LOOK: Record<Theme, Record<'on' | 'off', string>> = {
  counter: {
    on: 'border-2 border-c-brass bg-c-raised font-semibold text-c-text',
    off: 'border border-c-line bg-c-panel text-c-text active:bg-c-raised-2',
  },
  owner: {
    on: 'border-2 border-o-green bg-o-green-tint font-bold text-o-ink',
    off: 'border border-o-line bg-o-card text-o-ink hover:bg-o-soft',
  },
};

const DRAWN_LOOK: Record<'on' | 'off', string> = {
  on: LOOK.counter.on,
  off: 'border border-c-line bg-c-panel text-c-text group-active:bg-c-raised-2',
};

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> {
  selected?: boolean;
  theme: Theme;
  size?: ChipSize;
  /** Counter only. Keeps the height a screen draws (48 on screen 30) inside a 56 px pressable box. */
  drawn?: DrawnSize;
}

/** A filter, a reason or a category you can switch on. Selected is shown by border and weight, and announced. */
export function Chip({
  selected = false,
  theme,
  size = 'md',
  drawn,
  className,
  type = 'button',
  children,
  ...rest
}: ChipProps) {
  if (theme === 'counter' && drawn) {
    return (
      <button
        type={type}
        aria-pressed={selected}
        data-drawn={drawn}
        className={cx(
          'inline-flex min-h-touch items-center',
          TOUCH_BOX,
          DRAWN_MARGIN_Y[drawn],
          className,
        )}
        {...rest}
      >
        <span
          data-visible=""
          className={cx(
            'inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full transition-colors duration-150',
            DRAWN_HEIGHT[drawn],
            DRAWN_SHAPE[size],
            DRAWN_LOOK[selected ? 'on' : 'off'],
            groupFocusRing,
          )}
        >
          {children}
        </span>
      </button>
    );
  }

  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cx(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40',
        SIZE[theme][size],
        LOOK[theme][selected ? 'on' : 'off'],
        focusRing[theme],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
