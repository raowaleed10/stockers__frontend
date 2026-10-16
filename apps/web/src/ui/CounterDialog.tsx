import { ChevronLeft, X } from 'lucide-react';
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
  /** The kicker in normal weight, as the end screens draw it (17, 20 to 23); screens 15 and 19 draw it bold. */
  kickerPlain?: boolean;
  /** A line under the title. */
  subtitle?: ReactNode;
  /** Drawn inside a 64 px ball before the title. Pass the icon element. */
  icon?: ReactNode;
  /** A big number before the title (screen 7: the table number). */
  lead?: ReactNode;
  /** Its size in px when a screen draws it bigger than 72 (80 on screens 21 to 23). */
  leadSize?: number;
  /** `warning` has a red border and a red ball (screen 19); `brass` a 2 px brass border (screen 15, the damage charge). */
  tone?: 'normal' | 'warning' | 'brass';
  /** `lg` is the 32 px title of a warning dialog. */
  titleSize?: 'md' | 'lg' | number;
  /** The panel's own width in px, for a screen that draws one (the end screens, 17 to 23). Replaces `size`. */
  width?: number;
  /** `end` lines the header up along its bottom edge, so a big amount at the end sits on the title's baseline (17, 20). */
  headerAlign?: 'start' | 'end';
  /** `felt` is the flat green ball of a success header (screen 18); `brass` is the round brass ball. */
  iconTone?: 'brass' | 'felt';
  /** `lg` is the wide dialog for two columns (screens 8, 9); `form` is the one with a keypad beside it (screen 10); `xl` is the damage charge (screen 15). */
  size?: 'md' | 'form' | 'xl' | 'lg';
  /** A round Back button before the title (screens 8, 9). The dialog then has no × unless `showClose` says so. */
  back?: { label: string; onBack: () => void };
  /** A short text at the end of the header, in place of the × (screen 8: "Step 2 of 2"). */
  aside?: ReactNode;
  /** A second column beside the header, the body and the buttons (screen 10: the phone keypad). */
  side?: ReactNode;
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
  kickerPlain = false,
  subtitle,
  icon,
  lead,
  leadSize,
  tone = 'normal',
  titleSize = 'md',
  width,
  headerAlign = 'start',
  iconTone = 'brass',
  size = 'md',
  back,
  aside,
  side,
  actions,
  onClose,
  showClose = back || aside ? false : true,
  static: inPlace = false,
  children,
}: CounterDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const ref = useDialog<HTMLElement>(onClose, !inPlace);
  const warning = tone === 'warning';
  const brass = tone === 'brass';

  const content = (
    <>
      <header
        className={cx(
          'flex flex-wrap justify-between gap-4',
          headerAlign === 'end' ? 'items-end' : back || aside ? 'items-center' : 'items-start',
        )}
      >
        <div
          className={cx(
            'flex gap-[18px]',
            back ? 'items-center' : lead ? 'items-end' : 'items-start',
          )}
        >
          {back ? (
            <IconButton
              theme="counter"
              label={back.label}
              icon={<ChevronLeft size={24} strokeWidth={2.2} />}
              onClick={back.onBack}
            />
          ) : null}
          {icon ? (
            <span
              aria-hidden="true"
              className={cx(
                'flex h-16 w-16 shrink-0 items-center justify-center rounded-full',
                iconTone === 'felt'
                  ? 'bg-c-felt text-c-text'
                  : cx(
                      'text-c-brass-ink shadow-[inset_-8px_-8px_0_rgba(0,0,0,0.25)]',
                      warning ? 'bg-s-play' : 'bg-c-brass',
                    ),
              )}
            >
              {icon}
            </span>
          ) : null}
          {lead ? (
            <span
              style={leadSize ? { fontSize: leadSize } : undefined}
              className="font-num text-[72px] font-bold leading-[0.8]"
            >
              {lead}
            </span>
          ) : null}
          <div className="flex min-w-0 flex-col gap-1.5">
            {kicker ? (
              <span
                className={cx(
                  'text-[17px] rtl:leading-[1.8]',
                  !kickerPlain && 'font-semibold',
                  warning ? 'text-c-danger-ink' : brass ? 'text-c-brass' : 'text-c-text-2',
                )}
              >
                {kicker}
              </span>
            ) : null}
            <h2
              id={titleId}
              style={typeof titleSize === 'number' ? { fontSize: titleSize } : undefined}
              className={cx(
                'font-bold',
                titleSize === 'lg' ? 'text-[32px]' : titleSize === 'md' ? 'text-[26px]' : '',
                'leading-tight rtl:leading-[1.7]',
              )}
            >
              {title}
            </h2>
            {subtitle ? (
              <span
                className={cx(
                  'text-c-text-2 rtl:leading-[1.8]',
                  titleSize === 'md' ? 'text-[17px]' : 'text-[18px]',
                )}
              >
                {subtitle}
              </span>
            ) : null}
          </div>
        </div>
        {aside ? <span className="text-[16px] text-c-text-2">{aside}</span> : null}
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
    </>
  );

  const panel = (
    <section
      ref={ref}
      role="dialog"
      aria-modal={inPlace ? undefined : true}
      aria-labelledby={titleId}
      tabIndex={-1}
      style={width ? { maxWidth: width } : undefined}
      // A secondary button on this panel is one step lighter than the panel (see Button).
      className={cx(
        'dialog-in screen-text flex w-full flex-col gap-[22px] rounded-dialog bg-c-panel px-8 py-7 font-body text-c-text shadow-dialog-dark outline-none [--btn-secondary-bg:var(--c-raised)]',
        size === 'lg'
          ? 'max-w-[1240px]'
          : size === 'form'
            ? 'max-w-[1166px]'
            : size === 'xl'
              ? 'max-w-[1128px]'
              : 'max-w-[1046px]',
        warning
          ? 'border-2 border-c-danger-line'
          : brass
            ? 'border-2 border-c-warn-line'
            : 'border border-c-line-2',
      )}
    >
      {side ? (
        <div className="flex flex-wrap gap-7">
          <div className="flex min-w-0 flex-[3_1_460px] flex-col gap-[18px]">{content}</div>
          <div className="flex min-w-0 flex-[2_1_300px] flex-col">{side}</div>
        </div>
      ) : (
        content
      )}
    </section>
  );

  if (inPlace) return panel;
  return createPortal(
    // The designs centre a dialog in the page below the 70 px top bar (screens 7 to 15), so the padding on top is the
    // bar's, and the dialog sits in what is left. A dialog taller than that scrolls.
    <div className="fixed inset-0 z-50 overflow-y-auto bg-c-scrim pt-[70px] [body[data-undo-toast]_&]:pb-[110px]">
      <div className="flex min-h-full items-center justify-center p-6">{panel}</div>
    </div>,
    document.body,
  );
}
