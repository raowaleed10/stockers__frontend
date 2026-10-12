import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import { focusRing, groupFocusRing, type Theme } from './theme';
import { DRAWN_HEIGHT, DRAWN_MARGIN, DRAWN_WIDTH, TOUCH_BOX, type DrawnSize } from './touch-box';

export type IconButtonSize = 'counter' | 'counter-main' | 'owner';

const SIZE: Record<IconButtonSize, string> = {
  counter: 'h-touch w-touch min-h-touch min-w-touch rounded-btn',
  'counter-main': 'h-touch-main w-touch-main min-h-touch-main rounded-btn',
  owner: 'h-touch-owner w-touch-owner min-h-touch-owner min-w-touch-owner rounded-input',
};

const LOOK: Record<Theme, Record<'secondary' | 'ghost', string>> = {
  counter: {
    secondary: 'border-c-line bg-c-raised text-c-text active:bg-c-raised-2',
    ghost: 'border-c-line bg-transparent text-c-text-2 active:bg-c-raised',
  },
  owner: {
    secondary: 'border-o-line bg-o-card text-o-ink hover:bg-o-soft',
    ghost: 'border-transparent bg-transparent text-o-ink hover:bg-o-soft',
  },
};

// The same two counter looks for the shape inside a drawn button (`group-active`).
const DRAWN_LOOK: Record<'secondary' | 'ghost', string> = {
  secondary: 'border-c-line bg-c-raised text-c-text group-active:bg-c-raised-2',
  ghost: 'border-c-line bg-transparent text-c-text-2 group-active:bg-c-raised',
};

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'aria-label'
> {
  /** Required: it becomes the accessible name, because there is no visible text. */
  label: string;
  icon: ReactNode;
  theme: Theme;
  variant?: 'secondary' | 'ghost';
  size?: IconButtonSize;
  /**
   * Counter only. A screen that draws this button smaller than 56 px keeps its drawn size; the pressable
   * box stays 56 px square (touch-box.ts).
   */
  drawn?: DrawnSize;
  /** A small count in a corner, for example unread notifications. */
  badge?: number;
}

export function IconButton({
  label,
  icon,
  theme,
  variant = 'secondary',
  size,
  drawn,
  badge,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const resolvedSize = size ?? (theme === 'counter' ? 'counter' : 'owner');
  const hasBadge = badge !== undefined && badge > 0;
  const iconSlot = (
    <span aria-hidden="true" className="inline-flex">
      {icon}
    </span>
  );
  const badgeSlot = hasBadge ? (
    <span
      aria-hidden="true"
      className={cx(
        '-end-1 -top-1 absolute flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1 font-num text-[14px] font-bold leading-none',
        theme === 'counter' ? 'bg-c-brass text-c-brass-ink' : 'bg-o-red text-white',
      )}
    >
      {badge}
    </span>
  ) : null;
  const name = hasBadge ? `${label}, ${badge}` : label;

  if (theme === 'counter' && drawn) {
    return (
      <button
        type={type}
        aria-label={name}
        data-drawn={drawn}
        className={cx(
          'inline-flex h-touch w-touch min-h-touch min-w-touch shrink-0 items-center justify-center',
          TOUCH_BOX,
          DRAWN_MARGIN[drawn],
          className,
        )}
        {...rest}
      >
        <span
          data-visible=""
          className={cx(
            'relative inline-flex items-center justify-center rounded-btn border transition-colors duration-150',
            DRAWN_HEIGHT[drawn],
            DRAWN_WIDTH[drawn],
            DRAWN_LOOK[variant],
            groupFocusRing,
          )}
        >
          {iconSlot}
          {badgeSlot}
        </span>
      </button>
    );
  }

  return (
    <button
      type={type}
      aria-label={name}
      className={cx(
        'relative inline-flex shrink-0 items-center justify-center border transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40',
        SIZE[resolvedSize],
        LOOK[theme][variant],
        focusRing[theme],
        className,
      )}
      {...rest}
    >
      {iconSlot}
      {badgeSlot}
    </button>
  );
}
