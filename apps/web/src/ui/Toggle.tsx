import type { ReactNode } from 'react';
import { useId } from 'react';
import { cx } from './cx';
import { focusRing, type Theme } from './theme';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** The words beside the switch. The whole row is the touch target. */
  label?: ReactNode;
  /** Needed when there is no visible `label`. */
  ariaLabel?: string;
  disabled?: boolean;
  theme?: Theme;
  className?: string;
}

const TRACK: Record<Theme, Record<'on' | 'off', string>> = {
  owner: { on: 'bg-o-green', off: 'bg-o-line-2' },
  counter: { on: 'bg-c-brass', off: 'bg-c-raised-2' },
};

/** A 54 by 32 switch in a 56 px row. Announced as a switch with its on/off state. */
export function Toggle({
  checked,
  onChange,
  label,
  ariaLabel,
  disabled = false,
  theme = 'owner',
  className,
}: ToggleProps) {
  const labelId = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={label ? labelId : undefined}
      aria-label={label ? undefined : ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'flex w-full items-center gap-3.5 py-1.5 text-start disabled:cursor-not-allowed disabled:opacity-40',
        theme === 'counter' ? 'min-h-touch text-c-text' : 'min-h-[56px] text-o-ink',
        focusRing[theme],
        className,
      )}
    >
      {label ? (
        <span id={labelId} className="min-w-0 flex-1 text-[16px]">
          {label}
        </span>
      ) : (
        <span className="flex-1" />
      )}
      <span
        aria-hidden="true"
        className={cx(
          'relative inline-block h-8 w-[54px] shrink-0 rounded-full transition-colors duration-150',
          TRACK[theme][checked ? 'on' : 'off'],
        )}
      >
        <span
          className={cx(
            'absolute start-[3px] top-[3px] h-[26px] w-[26px] rounded-full transition-transform duration-150',
            theme === 'counter' ? 'bg-c-text' : 'bg-white',
            checked && 'translate-x-[22px] rtl:-translate-x-[22px]',
          )}
        />
      </span>
    </button>
  );
}
