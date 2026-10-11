import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import { focusRing, type Theme } from './theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
// `ownerSm`, not `owner-sm`: a shared component ships in the counter bundle, and `check:bundles`
// forbids the text "owner-" there.
export type ButtonSize = 'counter-main' | 'counter' | 'owner' | 'ownerSm';

const SIZE: Record<ButtonSize, string> = {
  'counter-main': 'min-h-touch-main rounded-btn px-7 text-[20px]',
  counter: 'min-h-touch rounded-btn px-5 text-[18px]',
  owner: 'min-h-[48px] rounded-btn-sm px-[18px] text-[16px]',
  ownerSm: 'min-h-touch-owner rounded-btn-sm px-[18px] text-[15px]',
};

// Pressed is one step lighter (docs/04 §4). Hover is only a bonus on the owner side: nothing depends on it.
const VARIANT: Record<Theme, Record<ButtonVariant, string>> = {
  counter: {
    primary: 'border-transparent bg-c-brass font-bold text-c-brass-ink active:bg-c-brass-press',
    // A dialog sets --btn-secondary-bg to c-raised so a button on a panel is one step lighter than the panel.
    secondary:
      'border-c-line bg-[var(--btn-secondary-bg,var(--c-panel))] font-semibold text-c-text active:bg-c-raised-2',
    outline: 'border-c-line-3 bg-transparent font-semibold text-c-text active:bg-c-raised',
    danger: 'border-c-danger-line bg-c-danger-bg font-bold text-c-danger-ink active:bg-c-raised-2',
    ghost: 'border-transparent bg-transparent font-semibold text-c-text-2 active:bg-c-raised',
  },
  owner: {
    primary:
      'border-transparent bg-o-green font-bold text-white hover:bg-o-green-hover active:bg-o-green-hover',
    secondary: 'border-o-line bg-o-card font-semibold text-o-ink hover:bg-o-soft active:bg-o-soft',
    outline: 'border-o-line-2 bg-transparent font-semibold text-o-ink hover:bg-o-soft',
    danger: 'border-o-red-line bg-o-card font-bold text-o-red hover:bg-o-red-tint',
    ghost: 'border-transparent bg-transparent font-semibold text-o-ink-2 hover:bg-o-soft',
  },
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  theme: Theme;
  /** An icon before the text. Hidden from screen readers; the text names the button. */
  icon?: ReactNode;
}

export function Button({
  variant = 'secondary',
  size,
  theme,
  icon,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const resolvedSize = size ?? (theme === 'counter' ? 'counter' : 'owner');
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2.5 whitespace-nowrap border transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40',
        SIZE[resolvedSize],
        VARIANT[theme][variant],
        focusRing[theme],
        className,
      )}
      {...rest}
    >
      {icon ? (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}
