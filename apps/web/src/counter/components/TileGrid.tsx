import type { TableKind } from '@stockers/shared';
import type { ReactNode } from 'react';
import { cx } from '@/ui/cx';

// The grid each game uses on screen 5: as many columns as fit, with each kind's own tile width. They are written out
// in full so the style sheet is built with them.
const COLUMNS: Record<Exclude<TableKind, 'snooker' | 'room'>, string> = {
  pool: 'grid-cols-[repeat(auto-fill,minmax(300px,1fr))]',
  carrom: 'grid-cols-[repeat(auto-fill,minmax(250px,300px))]',
  foosball: 'grid-cols-[repeat(auto-fill,minmax(380px,1fr))]',
  ludo: 'grid-cols-[repeat(auto-fill,minmax(320px,1fr))]',
  playstation: 'grid-cols-[repeat(auto-fill,minmax(250px,1fr))]',
};

export type GridKind = keyof typeof COLUMNS;

/** The tiles of one game (screen 5): a grid with a 26 px gap and the padding the screen draws. */
export function TileGrid({
  kind,
  label,
  children,
}: {
  kind: GridKind;
  label: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={label} className={cx('grid gap-[26px] px-2 pb-1.5 pt-3', COLUMNS[kind])}>
      {children}
    </section>
  );
}

/** The tiles of the live board (screens 3, 4 and 6): wrap onto rows, 22 px apart. Each tile is `flex-[1_1_300px]`. */
export const TILE_FLEX = 'flex-[1_1_300px] min-w-0';

export function TileRow({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className={cx('flex min-w-0 flex-wrap gap-[22px] p-1.5', className)}
    >
      {children}
    </section>
  );
}
