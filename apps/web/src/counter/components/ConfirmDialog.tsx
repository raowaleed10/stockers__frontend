import type { ReactNode } from 'react';
import { Button } from '@/ui/Button';
import { CounterDialog } from '@/ui/CounterDialog';

/**
 * "Money actions ask once" (D63): a sheet that says what is about to happen in one sentence, with a big No and a big Yes.
 * Yes does it; No, and Escape, close the sheet and change nothing. It is the sheet of Paid in full, Put all on credit, Save
 * payment and Close sheet, so the four ask the same way. `docs/NO_DESIGN.md` §39.
 */
export function ConfirmDialog({
  title,
  subtitle,
  yes,
  no,
  onYes,
  onNo,
  pending = false,
  error,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  yes: string;
  no: string;
  onYes: () => void;
  onNo: () => void;
  pending?: boolean;
  /** The words of a refusal from the server, shown on the sheet. */
  error?: string;
  /** More lines between the question and the buttons (what else happens). */
  children?: ReactNode;
}) {
  return (
    <CounterDialog
      width={760}
      titleSize={30}
      title={title}
      subtitle={subtitle}
      showClose={false}
      onClose={onNo}
      actions={
        <>
          <Button
            theme="counter"
            size="counter-main"
            className="min-h-[76px] min-w-[200px] flex-1 text-[24px]"
            disabled={pending}
            onClick={onNo}
          >
            {no}
          </Button>
          <Button
            theme="counter"
            variant="primary"
            size="counter-main"
            className="min-h-[76px] min-w-[200px] flex-1 text-[24px]"
            disabled={pending}
            onClick={onYes}
          >
            {yes}
          </Button>
        </>
      }
    >
      {children}
      {error ? (
        <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
          {error}
        </p>
      ) : null}
    </CounterDialog>
  );
}
