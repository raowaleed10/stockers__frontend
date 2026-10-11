import { useId, type ReactNode } from 'react';
import { cx } from './cx';
import { useDialog } from './use-dialog';
import { PHONE_QUERY, useMediaQuery } from './use-media';

export interface OwnerAsideProps {
  title: ReactNode;
  children?: ReactNode;
  /** The Cancel and main buttons, in a row at the bottom. */
  actions?: ReactNode;
  /** Escape calls this. The panel has no × (the design has a Cancel button). */
  onClose: () => void;
  /** Draw the panel in place, with no sheet, focus handling or Escape. For the kit page. */
  static?: boolean;
  className?: string;
}

/**
 * The owner's side dialog: a panel with a blue border next to the content on a wide screen, and a
 * bottom sheet on a phone (screens 49 and 50). On a phone it dims the page and keeps Tab inside.
 */
export function OwnerAside({
  title,
  children,
  actions,
  onClose,
  static: inPlace = false,
  className,
}: OwnerAsideProps) {
  const titleId = useId();
  const phone = useMediaQuery(PHONE_QUERY) && !inPlace;
  const ref = useDialog<HTMLElement>(onClose, !inPlace, phone);

  return (
    <>
      {phone ? (
        <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-40 bg-o-ink/40" />
      ) : null}
      <aside
        ref={ref}
        role="dialog"
        aria-modal={phone ? true : undefined}
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          'flex min-w-0 flex-col gap-3.5 border-2 border-o-blue bg-o-card p-5 text-o-ink shadow-dialog-light outline-none',
          phone
            ? 'fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-[22px] rounded-b-none'
            : 'rounded-card',
          className,
        )}
      >
        <h2 id={titleId} className="text-[20px] font-bold leading-tight">
          {title}
        </h2>
        {children}
        {actions ? <div className="flex gap-2.5">{actions}</div> : null}
      </aside>
    </>
  );
}
