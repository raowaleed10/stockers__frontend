import { X } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { cx } from './cx';
import { IconButton } from './IconButton';
import { useDialog } from './use-dialog';

export interface CounterDialogProps {
  title: ReactNode;
  /** A short line above the title (screen 19: "Table 4 ran over 30 minutes"). */
  kicker?: ReactNode;
  /** A line under the title. */
  subtitle?: ReactNode;
  /** Drawn inside a 64 px ball before the title. Pass the icon element. */
  icon?: ReactNode;
  /** A big number before the title (screen 7: the table number). */
  lead?: ReactNode;
  /** `warning` has a red border and a red ball (screen 19). */
  tone?: 'normal' | 'warning';
  /** `lg` is the 32 px title of a warning dialog. */
  titleSize?: 'md' | 'lg';
  /** `lg` is the wide dialog for two columns (screens 8, 9). */
  size?: 'md' | 'lg';
  /** The row of buttons at the bottom. Put a flexible spacer between the groups. */
  actions?: ReactNode;
  /** Escape and the close button call this. */
  onClose: () => void;
  /** Hide the × when the actions already hold a Back or Cancel button. */
  showClose?: boolean;
  /** Draw the panel in place, with no dimmed page, focus trap or Escape. For the kit page. */
  static?: boolean;
  children?: ReactNode;
}

/** The centred counter dialog (screens 7 and 19). Traps focus, closes on Escape, returns focus. */
export function CounterDialog({
  title,
  kicker,
  subtitle,
  icon,
  lead,
  tone = 'normal',
  titleSize = 'md',
  size = 'md',
  actions,
  onClose,
  showClose = true,
  static: inPlace = false,
  children,
}: CounterDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const ref = useDialog<HTMLElement>(onClose, !inPlace);
  const warning = tone === 'warning';

  const panel = (
    <section
      ref={ref}
      role="dialog"
      aria-modal={inPlace ? undefined : true}
      aria-labelledby={titleId}
      tabIndex={-1}
      // A secondary button on this panel is one step lighter than the panel (see Button).
      className={cx(
        'dialog-in flex w-full flex-col gap-[22px] rounded-dialog bg-c-panel px-8 py-7 text-c-text shadow-dialog-dark outline-none [--btn-secondary-bg:var(--c-raised)]',
        size === 'lg' ? 'max-w-[1240px]' : 'max-w-[1046px]',
        warning ? 'border-2 border-c-danger-line' : 'border border-c-line-2',
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className={cx('flex gap-[18px]', lead ? 'items-end' : 'items-start')}>
          {icon ? (
            <span
              aria-hidden="true"
              className={cx(
                'flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-c-brass-ink shadow-[inset_-8px_-8px_0_rgba(0,0,0,0.25)]',
                warning ? 'bg-s-play' : 'bg-c-brass',
              )}
            >
              {icon}
            </span>
          ) : null}
          {lead ? (
            <span className="font-num text-[72px] font-bold leading-[0.8]">{lead}</span>
          ) : null}
          <div className="flex min-w-0 flex-col gap-1.5">
            {kicker ? (
              <span
                className={cx(
                  'text-[17px] font-semibold',
                  warning ? 'text-c-danger-ink' : 'text-c-text-2',
                )}
              >
                {kicker}
              </span>
            ) : null}
            <h2
              id={titleId}
              className={cx(
                'font-bold',
                titleSize === 'lg' ? 'text-[32px]' : 'text-[26px]',
                'leading-tight',
              )}
            >
              {title}
            </h2>
            {subtitle ? (
              <span
                className={cx('text-c-text-2', titleSize === 'lg' ? 'text-[18px]' : 'text-[17px]')}
              >
                {subtitle}
              </span>
            ) : null}
          </div>
        </div>
        {showClose ? (
          <IconButton
            theme="counter"
            label={t('close')}
            icon={<X size={24} strokeWidth={2.2} />}
            onClick={onClose}
          />
        ) : null}
      </header>

      {children}

      {actions ? <div className="flex flex-wrap items-center gap-3 pt-1">{actions}</div> : null}
    </section>
  );

  if (inPlace) return panel;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-c-scrim p-6">
      {panel}
    </div>,
    document.body,
  );
}
