import type { ButtonHTMLAttributes } from 'react';
import { cx } from '@/ui/cx';
import { groupFocusRing } from '@/ui/theme';
import { DRAWN_HEIGHT, DRAWN_MARGIN_Y, TOUCH_BOX } from '@/ui/touch-box';

/**
 * A button on a tile, such as Resume on the power-cut board (screen 16): a yellow-bordered button on the
 * cloth. The PNG draws it 50 px tall, so the shape is 50 px inside a 56 px pressable box (docs/04 §4).
 * Use it inside a tile with `as="div"`; a button cannot sit inside a button.
 */
export function TileActionButton({
  className,
  children,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      data-drawn={50}
      className={cx(
        'tile-btn inline-flex min-h-touch items-center',
        TOUCH_BOX,
        DRAWN_MARGIN_Y[50],
        className,
      )}
      {...rest}
    >
      <span
        data-visible=""
        className={cx(
          'inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-[12px] border-2 border-s-pause bg-tile-btn px-[18px] text-[17px] font-bold text-c-text transition-colors duration-150 group-active:bg-c-raised-2',
          DRAWN_HEIGHT[50],
          groupFocusRing,
        )}
      >
        {children}
      </span>
    </button>
  );
}
