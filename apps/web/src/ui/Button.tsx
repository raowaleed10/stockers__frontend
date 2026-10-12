import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import { focusRing, groupFocusRing, type Theme } from './theme';
import { DRAWN_HEIGHT, DRAWN_MARGIN_Y, TOUCH_BOX, type DrawnSize } from './touch-box';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
// `ownerSm`, not `owner-sm`: a shared component ships in the counter bundle, and `check:bundles`
// forbids the text "owner-" there.
export type ButtonSize = 'counter-main' | 'counter' | 'owner' | 'ownerSm';

// The look of each size without its height, so a drawn button (touch-box.ts) can set its own.
const SHAPE: Record<ButtonSize, string> = {
  'counter-main': 'rounded-btn px-7 text-[20px]',
  counter: 'rounded-btn px-5 text-[18px]',
  owner: 'rounded-btn-sm px-[18px] text-[16px]',
  ownerSm: 'rounded-btn-sm px-[18px] text-[15px]',
};

const SIZE: Record<ButtonSize, string> = {
  'counter-main': 'min-h-touch-main',
  counter: 'min-h-touch',
  owner: 'min-h-[48px]',
  ownerSm: 'min-h-touch-owner',
};

// Counter looks, split so the pressed colour can be written for the button itself or, on a drawn button,
// for the shape inside it (`group-active`).
const COUNTER_REST: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-c-brass font-bold text-c-brass-ink',
  // A dialog sets --btn-secondary-bg to c-raised so a button on a panel is one step lighter than the panel.
  secondary: 'border-c-line bg-[var(--btn-secondary-bg,var(--c-panel))] font-semibold text-c-text',
  outline: 'border-c-line-3 bg-transparent font-semibold text-c-text',
  danger: 'border-c-danger-line bg-c-danger-bg font-bold text-c-danger-ink',
  ghost: 'border-transparent bg-transparent font-semibold text-c-text-2',
};
const COUNTER_PRESS: Record<ButtonVariant, string> = {
  primary: 'active:bg-c-brass-press',
  secondary: 'active:bg-c-raised-2',
  outline: 'active:bg-c-raised',
  danger: 'active:bg-c-raised-2',
  ghost: 'active:bg-c-raised',
};
const COUNTER_GROUP_PRESS: Record<ButtonVariant, string> = {
  primary: 'group-active:bg-c-brass-press',
  secondary: 'group-active:bg-c-raised-2',
  outline: 'group-active:bg-c-raised',
  danger: 'group-active:bg-c-raised-2',
  ghost: 'group-active:bg-c-raised',
};

// Pressed is one step lighter (docs/04 §4). Hover is only a bonus on the owner side: nothing depends on it.
const OWNER: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-o-green font-bold text-white hover:bg-o-green-hover active:bg-o-green-hover',
  secondary: 'border-o-line bg-o-card font-semibold text-o-ink hover:bg-o-soft active:bg-o-soft',
  outline: 'border-o-line-2 bg-transparent font-semibold text-o-ink hover:bg-o-soft',
  danger: 'border-o-red-line bg-o-card font-bold text-o-red hover:bg-o-red-tint',
  ghost: 'border-transparent bg-transparent font-semibold text-o-ink-2 hover:bg-o-soft',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  theme: Theme;
  /** An icon before the text. Hidden from screen readers; the text names the button. */
  icon?: ReactNode;
  /**
   * Counter only. A screen that draws this button smaller than 56 px keeps its drawn height; the pressable
   * box stays 56 px (touch-box.ts).
   */
  drawn?: DrawnSize;
}

export function Button({
  variant = 'secondary',
  size,
  theme,
  icon,
  drawn,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const resolvedSize = size ?? (theme === 'counter' ? 'counter' : 'owner');
  const content = (
    <>
      {icon ? (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {icon}
        </span>
      ) : null}
      {children}
    </>
  );

  if (theme === 'counter' && drawn) {
    return (
      <button
        type={type}
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
            'inline-flex flex-1 items-center justify-center gap-2.5 whitespace-nowrap border transition-colors duration-150',
            DRAWN_HEIGHT[drawn],
            SHAPE[resolvedSize],
            COUNTER_REST[variant],
            COUNTER_GROUP_PRESS[variant],
            groupFocusRing,
          )}
        >
          {content}
        </span>
      </button>
    );
  }

  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2.5 whitespace-nowrap border transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40',
        SIZE[resolvedSize],
        SHAPE[resolvedSize],
        theme === 'counter' ? cx(COUNTER_REST[variant], COUNTER_PRESS[variant]) : OWNER[variant],
        focusRing[theme],
        className,
      )}
      {...rest}
    >
      {content}
    </button>
  );
}
