import { X } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cx } from './cx';
import { IconButton } from './IconButton';
import { useDialog } from './use-dialog';

export interface SidePanelProps {
  title: ReactNode;
  /** A big number before the title (screen 11: the table number). */
  lead?: ReactNode;
  /** A line under the title, for example "Playing since 9:23 PM". */
  subtitle?: ReactNode;
  onClose: () => void;
  /** Buttons at the end of the header, before the close button (the bell's panel: "Mark all read"). */
  actions?: ReactNode;
  /** Draw the panel in place, with no focus handling or Escape. For the kit page. */
  static?: boolean;
  className?: string;
  children?: ReactNode;
}

/** The counter's right-hand panel, 560 to 640 px wide, next to the dimmed board (screen 11). */
export function SidePanel({
  title,
  lead,
  subtitle,
  onClose,
  actions,
  static: inPlace = false,
  className,
  children,
}: SidePanelProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const ref = useDialog<HTMLElement>(onClose, !inPlace);
  return (
    <aside
      ref={ref}
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      className={cx(
        'flex w-full min-w-0 max-w-[640px] flex-col gap-[18px] border-s border-c-line-2 bg-c-panel px-[26px] py-6 text-c-text outline-none',
        'shadow-[-30px_0_60px_rgba(0,0,0,0.5)] rtl:shadow-[30px_0_60px_rgba(0,0,0,0.5)] [--btn-secondary-bg:var(--c-raised)]',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-end gap-3.5">
          {lead ? (
            <span className="font-num text-[80px] font-bold leading-[0.8]">{lead}</span>
          ) : null}
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={titleId} className="text-[24px] font-bold leading-tight">
              {title}
            </h2>
            {subtitle ? (
              <span className="text-[16px] font-semibold text-c-danger-ink">{subtitle}</span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-3">
          {actions}
          <IconButton
            theme="counter"
            label={t('closePanel')}
            icon={<X size={24} strokeWidth={2.2} />}
            onClick={onClose}
          />
        </div>
      </header>
      {children}
    </aside>
  );
}
