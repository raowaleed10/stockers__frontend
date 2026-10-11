import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from './cx';
import type { Theme } from './theme';

export interface EmptyStateProps {
  theme: Theme;
  /** Plain words: what is missing, for example "No expenses this month". */
  title: ReactNode;
  /** One more line saying what to do or why. */
  description?: ReactNode;
  /** A button, if there is something to do about it. */
  action?: ReactNode;
  /** Replaces the default tray icon. */
  icon?: ReactNode;
  className?: string;
}

/** What a list shows when it has nothing in it. */
export function EmptyState({
  theme,
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  const counter = theme === 'counter';
  return (
    <div
      className={cx(
        'flex flex-col items-center gap-3 px-6 py-10 text-center',
        counter ? 'text-c-text' : 'text-o-ink',
        className,
      )}
    >
      <span aria-hidden="true" className={counter ? 'text-c-text-2' : 'text-o-ink-2'}>
        {icon ?? <Inbox size={36} strokeWidth={2} />}
      </span>
      <p className={cx('font-bold', counter ? 'text-[22px]' : 'text-[20px]')}>{title}</p>
      {description ? (
        <p className={cx(counter ? 'text-[17px] text-c-text-2' : 'text-[15px] text-o-ink-2')}>
          {description}
        </p>
      ) : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
