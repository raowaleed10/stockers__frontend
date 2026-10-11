import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import { focusRing, type Theme } from './theme';

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
  /** A small count in a corner, for example unread notifications. */
  badge?: number;
}

export function IconButton({
  label,
  icon,
  theme,
  variant = 'secondary',
  size,
  badge,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const resolvedSize = size ?? (theme === 'counter' ? 'counter' : 'owner');
  const hasBadge = badge !== undefined && badge > 0;
  return (
    <button
      type={type}
      aria-label={hasBadge ? `${label}, ${badge}` : label}
      className={cx(
        'relative inline-flex shrink-0 items-center justify-center border transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40',
        SIZE[resolvedSize],
        LOOK[theme][variant],
        focusRing[theme],
        className,
      )}
      {...rest}
    >
      <span aria-hidden="true" className="inline-flex">
        {icon}
      </span>
      {hasBadge ? (
        <span
          aria-hidden="true"
          className={cx(
            '-end-1 -top-1 absolute flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1 font-num text-[14px] font-bold leading-none',
            theme === 'counter' ? 'bg-c-brass text-c-brass-ink' : 'bg-o-red text-white',
          )}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}
