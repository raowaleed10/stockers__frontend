/**
 * Counter controls that a PNG draws smaller than 56 px (docs/04 §4, answered by the developer in P01).
 *
 * The `<button>` is the 56 px pressable box. The shape you see is a `<span data-visible>` inside it, drawn at
 * the PNG size. A negative margin of (56 − drawn) / 2 gives the space back, so the layout box is exactly the
 * drawn size and nothing else on the screen moves. The class names are written out in full because Tailwind
 * only keeps classes it can read in the source.
 */
export type DrawnSize = 44 | 48 | 50 | 52 | 54;

/** Height of the visible shape. */
export const DRAWN_HEIGHT: Record<DrawnSize, string> = {
  44: 'h-[44px]',
  48: 'h-[48px]',
  50: 'h-[50px]',
  52: 'h-[52px]',
  54: 'h-[54px]',
};

/** Width of the visible shape, for a square icon button. */
export const DRAWN_WIDTH: Record<DrawnSize, string> = {
  44: 'w-[44px]',
  48: 'w-[48px]',
  50: 'w-[50px]',
  52: 'w-[52px]',
  54: 'w-[54px]',
};

/** Top and bottom margin that cancels the extra height of the 56 px box. */
export const DRAWN_MARGIN_Y: Record<DrawnSize, string> = {
  44: '-my-[6px]',
  48: '-my-[4px]',
  50: '-my-[3px]',
  52: '-my-[2px]',
  54: '-my-[1px]',
};

/** The same on all four sides, for a square icon button. */
export const DRAWN_MARGIN: Record<DrawnSize, string> = {
  44: '-m-[6px]',
  48: '-m-[4px]',
  50: '-m-[3px]',
  52: '-m-[2px]',
  54: '-m-[1px]',
};

/** What the box itself carries: no look of its own, no browser outline (the ring is drawn on the shape). */
export const TOUCH_BOX =
  'group relative bg-transparent p-0 outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40';
