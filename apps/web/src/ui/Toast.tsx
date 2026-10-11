import type { ReactNode } from 'react';
import { Button } from './Button';
import { cx } from './cx';
import type { Theme } from './theme';

export interface ToastAction {
  /** The words on the button, for example "Undo, 1:56 left". */
  label: ReactNode;
  onPress: () => void;
}

export interface ToastProps {
  theme: Theme;
  /** What happened, in the same words as the action ("Frame charged"). */
  message: ReactNode;
  action?: ToastAction;
  className?: string;
}

/** A short message that says what just happened, with an optional action such as Undo. Announced politely. */
export function Toast({ theme, message, action, className }: ToastProps) {
  const counter = theme === 'counter';
  return (
    <div
      role="status"
      className={cx(
        'flex flex-wrap items-center gap-x-5 gap-y-3 rounded-btn px-5 py-3.5',
        counter
          ? 'border border-c-line-2 bg-c-raised text-[17px] text-c-text shadow-dialog-dark'
          : 'bg-o-ink text-[15px] text-white shadow-dialog-light',
        className,
      )}
    >
      <span className="min-w-0 flex-1 font-semibold">{message}</span>
      {action ? (
        <Button
          theme={theme}
          variant="outline"
          size={counter ? 'counter' : 'ownerSm'}
          onClick={action.onPress}
          className={counter ? undefined : 'border-white/40 text-white hover:bg-white/10'}
        >
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
