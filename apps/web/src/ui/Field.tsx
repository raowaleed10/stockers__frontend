import { useId, type ReactNode } from 'react';
import { cx } from './cx';
import type { Theme } from './theme';

/** What a control inside a `Field` must receive, so the label, hint and error are tied to it. */
export interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
}

export interface FieldProps {
  /** Always visible, above the control (never only a placeholder). */
  label: ReactNode;
  theme: Theme;
  /** Help under the control. */
  hint?: ReactNode;
  /** Plain words saying what to fix. Shown in red under the control. */
  error?: ReactNode;
  /** The control: `{(control) => <TextInput {...control} />}`. */
  children: (control: FieldControlProps) => ReactNode;
  className?: string;
}

/** A label above a control, with help and an error below. */
export function Field({ label, theme, hint, error, children, className }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');
  const counter = theme === 'counter';

  return (
    <div className={cx('flex min-w-0 flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className={cx(
          'font-semibold',
          counter ? 'text-[19px] font-bold text-c-text' : 'text-[15px] text-o-ink',
        )}
      >
        {label}
      </label>
      {children({
        id,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
      })}
      {hint ? (
        <span
          id={hintId}
          className={cx(counter ? 'text-[16px] text-c-text-2' : 'text-[14px] text-o-ink-2')}
        >
          {hint}
        </span>
      ) : null}
      {error ? (
        <span
          id={errorId}
          className={cx(
            'font-semibold',
            counter ? 'text-[16px] text-c-danger-ink' : 'text-[14px] text-o-red',
          )}
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}
