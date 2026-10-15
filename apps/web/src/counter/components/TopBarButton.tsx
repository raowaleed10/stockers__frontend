import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from '@/ui/cx';
import { groupFocusRing } from '@/ui/theme';
import { DRAWN_MARGIN, DRAWN_MARGIN_Y, TOUCH_BOX } from '@/ui/touch-box';

export interface TopBarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** A square button, like the bell. */
  square?: boolean;
  /** Extra classes for the visible shape (padding, gap). */
  shapeClassName?: string;
  children: ReactNode;
}

/**
 * The bell, the worker chip and Lock (screens 3 to 6) are drawn 52 px tall. The button is the 56 px pressable
 * box and the shape is drawn inside it at 52, with a negative margin so nothing moves (docs/04 §4). These three
 * use the top bar's own 12 px corners, so they have their own shape here rather than the `Button` one.
 */
export const TopBarButton = forwardRef<HTMLButtonElement, TopBarButtonProps>(function TopBarButton(
  { square = false, shapeClassName, className, type = 'button', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      data-drawn={52}
      className={cx(
        'inline-flex min-h-touch shrink-0 items-center justify-center',
        square && 'h-touch w-touch min-w-touch',
        TOUCH_BOX,
        square ? DRAWN_MARGIN[52] : DRAWN_MARGIN_Y[52],
        className,
      )}
      {...rest}
    >
      <span
        data-visible=""
        className={cx(
          'relative inline-flex h-[52px] items-center justify-center rounded-btn-sm border border-c-line bg-c-panel text-c-text transition-colors duration-150 group-active:bg-c-raised-2',
          square ? 'w-[52px]' : 'flex-1',
          groupFocusRing,
          shapeClassName,
        )}
      >
        {children}
      </span>
    </button>
  );
});
