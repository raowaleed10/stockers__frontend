import { ChevronDown } from 'lucide-react';
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cx } from './cx';
import { focusRing, focusWithinRing, type Theme } from './theme';

export type InputSize = 'md' | 'lg';

// The border turns blue (owner) or brass (counter) when the control has focus, and goes red when it is invalid.
const SHELL: Record<Theme, string> = {
  owner:
    'rounded-input border border-o-line-2 bg-o-card text-o-ink has-[:focus-visible]:border-o-blue has-[[aria-invalid=true]]:border-o-red',
  counter:
    'rounded-input border-2 border-c-line-2 bg-c-page text-c-text has-[:focus-visible]:border-c-brass has-[[aria-invalid=true]]:border-c-danger-line',
};

const SIZE: Record<Theme, Record<InputSize, string>> = {
  owner: { md: 'min-h-[52px] text-[16px]', lg: 'min-h-[56px] text-[22px] font-bold' },
  counter: {
    md: 'min-h-touch text-[18px]',
    lg: 'min-h-touch-main font-num text-[32px] font-semibold',
  },
};

// The same look for a control that has no box around it (a select or a text area).
const DIRECT: Record<Theme, string> = {
  owner:
    'rounded-input border border-o-line-2 bg-o-card text-o-ink focus-visible:border-o-blue aria-[invalid=true]:border-o-red',
  counter:
    'rounded-input border-2 border-c-line-2 bg-c-page text-c-text focus-visible:border-c-brass aria-[invalid=true]:border-c-danger-line',
};

const FIELD =
  'min-w-0 flex-1 self-stretch bg-transparent px-3.5 outline-none disabled:cursor-not-allowed disabled:opacity-40';
const PLACEHOLDER: Record<Theme, string> = {
  owner: 'placeholder:text-o-ink-2',
  counter: 'placeholder:text-c-text-2',
};

interface ShellProps {
  theme: Theme;
  size: InputSize;
  prefix?: ReactNode;
  suffix?: ReactNode;
  className?: string;
  children: ReactNode;
}

function Shell({ theme, size, prefix, suffix, className, children }: ShellProps) {
  const extra = cx(theme === 'counter' ? 'text-c-text-2' : 'text-o-ink-2', 'shrink-0 text-[16px]');
  return (
    <div
      className={cx(
        'flex w-full items-center',
        SHELL[theme],
        SIZE[theme][size],
        focusWithinRing[theme],
        className,
      )}
    >
      {prefix ? <span className={cx(extra, 'ps-3.5')}>{prefix}</span> : null}
      {children}
      {suffix ? <span className={cx(extra, 'pe-3.5')}>{suffix}</span> : null}
    </div>
  );
}

export interface TextInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'prefix'
> {
  theme: Theme;
  size?: InputSize;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Applies to the bordered box, not the input inside. */
  boxClassName?: string;
}

/** A one-line text box. Use it inside a `Field` so it has a visible label. */
export function TextInput({
  theme,
  size = 'md',
  prefix,
  suffix,
  boxClassName,
  className,
  ...rest
}: TextInputProps) {
  return (
    <Shell theme={theme} size={size} prefix={prefix} suffix={suffix} className={boxClassName}>
      <input className={cx(FIELD, PLACEHOLDER[theme], className)} {...rest} />
    </Shell>
  );
}

export interface MoneyInputProps extends Omit<
  TextInputProps,
  'value' | 'onChange' | 'type' | 'inputMode'
> {
  /** Whole rupees, or null while the box is empty. */
  value: number | null;
  onChange: (value: number | null) => void;
}

const MAX_DIGITS = 9;

/** Whole rupees only. Shows the number with thousands commas while you type; the keyboard is numeric. */
export function MoneyInput({
  value,
  onChange,
  theme,
  size = 'md',
  className,
  ...rest
}: MoneyInputProps) {
  const text = value === null ? '' : String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (
    <TextInput
      theme={theme}
      size={size}
      inputMode="numeric"
      autoComplete="off"
      value={text}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS);
        onChange(digits === '' ? null : Number(digits));
      }}
      className={cx('font-num tabular-nums', size === 'lg' && 'text-center', className)}
      {...rest}
    />
  );
}

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  theme: Theme;
}

/** A box for a few lines, such as a reason or a note. */
export function TextArea({ theme, className, rows = 3, ...rest }: TextAreaProps) {
  return (
    <textarea
      rows={rows}
      className={cx(
        'w-full resize-y p-3.5 disabled:cursor-not-allowed disabled:opacity-40',
        DIRECT[theme],
        PLACEHOLDER[theme],
        theme === 'owner' ? 'min-h-[96px] text-[16px]' : 'min-h-[112px] text-[18px]',
        focusRing[theme],
        className,
      )}
      {...rest}
    />
  );
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  theme: Theme;
  size?: InputSize;
}

/** A native drop-down list, so the device's own picker opens on a phone. Put `<option>` elements inside. */
export function Select({ theme, size = 'md', className, children, ...rest }: SelectProps) {
  return (
    <div className="relative inline-flex w-full">
      <select
        className={cx(
          'w-full appearance-none ps-3.5 pe-10 disabled:cursor-not-allowed disabled:opacity-40',
          DIRECT[theme],
          SIZE[theme][size],
          focusRing[theme],
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        size={20}
        strokeWidth={2.2}
        className={cx(
          'pointer-events-none absolute end-3 top-1/2 -translate-y-1/2',
          theme === 'counter' ? 'text-c-text-2' : 'text-o-ink-2',
        )}
      />
    </div>
  );
}
