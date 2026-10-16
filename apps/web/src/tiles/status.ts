import type { TableStatus } from '@stockers/shared';
import type { TileStatus } from './types';

export type ClothState = 'normal' | 'lit' | 'dim';
export type RingName = 'free' | 'play' | 'over' | 'pause' | 'ooo' | 'none' | 'sel';

export interface StatusLook {
  /** The ring around the table (docs/04 §5). */
  ring: RingName;
  /** `lit` is brighter in the middle, `dim` is faded. */
  cloth: ClothState;
  /** The status shown in the pill. A selected table is a free table with a brass ring. */
  pill: TableStatus;
  /** Disabled: cannot be pressed until something changes (no price yet). */
  locked: boolean;
  /** Grey stripes over the cloth. */
  covered: boolean;
}

/** One table for every tile and every test: what each status looks like (decisions D7 and Q2). */
export const STATUS_LOOK: Record<TileStatus, StatusLook> = {
  free: { ring: 'free', cloth: 'normal', pill: 'free', locked: false, covered: false },
  playing: { ring: 'play', cloth: 'lit', pill: 'playing', locked: false, covered: false },
  overLimit: { ring: 'over', cloth: 'lit', pill: 'overLimit', locked: false, covered: false },
  paused: { ring: 'pause', cloth: 'dim', pill: 'paused', locked: false, covered: false },
  outOfOrder: { ring: 'ooo', cloth: 'normal', pill: 'outOfOrder', locked: false, covered: true },
  noPrice: { ring: 'none', cloth: 'dim', pill: 'noPrice', locked: true, covered: false },
  selected: { ring: 'sel', cloth: 'normal', pill: 'free', locked: false, covered: false },
};

export function ringClass(status: TileStatus): string {
  return `tile-ring-${STATUS_LOOK[status].ring}`;
}

export function clothClass(status: TileStatus): string {
  const { cloth } = STATUS_LOOK[status];
  return cloth === 'lit' ? 'tile-lit' : cloth === 'dim' ? 'tile-dim' : '';
}

/** Balls and coins are set up only on a table that is free (or picked to start on). */
export function isSetUp(status: TileStatus): boolean {
  return STATUS_LOOK[status].pill === 'free';
}
