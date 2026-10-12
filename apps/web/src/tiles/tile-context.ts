import { createContext, useContext } from 'react';
import type { StatusLook } from './status';
import type { TileProps } from './types';

export interface TileState {
  props: TileProps;
  look: StatusLook;
  /** The id of the line that says why a table is locked. */
  lockId: string;
}

export const TileContext = createContext<TileState | null>(null);

/** What the drawing inside a tile needs to know: the props, what the status looks like, the lock id. */
export function useTile(): TileState {
  const state = useContext(TileContext);
  if (!state) throw new Error('Tile pieces must be used inside a tile');
  return state;
}
