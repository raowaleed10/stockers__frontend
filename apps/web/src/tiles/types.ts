import type { TableStatus } from '@stockers/shared';
import type { ReactNode } from 'react';

/** The six table statuses of decision D7, plus `selected`: a free table picked on a "choose a table" screen. */
export type TileStatus = TableStatus | 'selected';

export interface TileProps {
  status: TileStatus;
  /** "1", "R1", "8" */
  number: string;
  /** The kind, then the price: ["Table", "Rs 250 a frame"]. Already translated. */
  label: [string, string];
  /** Replaces the words of the status pill, for example text that is already translated. */
  pillLabel?: string;
  /** The game's time limit in minutes, for the pill of a game that is over it: "Over 30 min". */
  limit?: number;
  /** "Single frame" with a detail such as "Frame 3, Ali leads 2–0". */
  gameLine?: { main: string; detail?: string };
  /** "Ali Raza vs Bilal Ahmed", or "Under Saad Hussain". A list of names, such as ludo, is just `a`. */
  players?: { a: string; b?: string; under?: boolean };
  /** Usually a `<TimerText/>`. */
  timer?: ReactNode;
  /** Whole rupees so far. */
  amount?: number;
  /** The call to action of a free table. A table on the power-cut board has only the hint. */
  cta?: { title?: string; hint?: string };
  /**
   * The note on a table that is out of order: "Cloth change" and who marked it. With no title, the detail
   * alone is drawn larger ("Dice missing").
   */
  note?: { title?: string; detail?: string };
  /** Why a table is locked, for example "Locked until an owner sets the price". Read out as its description. */
  lockReason?: string;
  /** Extra controls at the end of the bottom row, such as the Resume button. Use with `as="div"`. */
  trailing?: ReactNode;
  /** `div` when the tile contains its own buttons: a button cannot sit inside a button. */
  as?: 'button' | 'div';
  onPress?: () => void;
  /** "Table 4, over 30 minutes" (the limit of that game) */
  ariaLabel: string;
  /** Layout from the page: the flex or grid size of the tile. */
  className?: string;
}
