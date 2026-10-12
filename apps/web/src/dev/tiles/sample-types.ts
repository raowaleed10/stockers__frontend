import type { TableKind } from '@stockers/shared';
import type { TileProps } from '@/tiles';

/**
 * One tile on the gallery: the props of a tile, with the timer as text ("18:42", "1:12:05") and a few
 * flags for what the power-cut board adds. `id` is how the visual test finds the tile.
 */
export interface TileSample extends Omit<TileProps, 'timer' | 'trailing'> {
  id: string;
  kind: TableKind;
  /** "18:42" or "1:12:05". The gallery freezes it, so the page looks the same every time. */
  timer?: string;
  /** The timer is yellow, as on the power-cut board (screen 16). */
  frozenTimer?: boolean;
  /** The tile holds a Resume button with this text, so it is drawn as a `div` (screen 16). */
  resume?: string;
}
