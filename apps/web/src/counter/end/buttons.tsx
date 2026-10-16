import { Undo2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/ui/Button';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';

/** "Keep playing" and the other way back on the end screens: the quiet 64 px button on the left (17, 20, 21, 23). */
export function KeepButton({
  children,
  onClick,
  icon = false,
}: {
  children: ReactNode;
  onClick: () => void;
  /** The little undo arrow screen 17 draws before the words. */
  icon?: boolean;
}) {
  return (
    <Button
      theme="counter"
      size="counter-main"
      className="px-6 text-[19px]"
      icon={icon ? <Undo2 size={20} strokeWidth={2.2} /> : undefined}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

/** The brass button that charges (17 to 23): 64 px tall, bold. */
export function ChargeButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      theme="counter"
      variant="primary"
      size="counter-main"
      className="px-[34px] text-[20px]"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

/** "Nobody pays" on screen 17: an outline button with the red edge of the Discard button of screen 11. */
export function NobodyPaysButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'inline-flex min-h-touch-main items-center justify-center rounded-btn border border-c-discard-line bg-transparent px-6 text-[18px] font-semibold text-c-danger-ink transition-colors duration-150 active:bg-c-raised',
        focusRing.counter,
      )}
    >
      {children}
    </button>
  );
}
