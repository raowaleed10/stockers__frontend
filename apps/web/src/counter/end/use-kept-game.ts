import type { BoardTable, Game } from '@stockers/shared';
import { useState } from 'react';

/**
 * The game of a table, still there for the moment after the write that ends it. Ending a game makes it vanish from
 * the board, and a screen that redirects when its table has no game would send the worker to the board before the next
 * screen (18) opens. The screens of the end flow keep the last game they saw instead, and leave by their own
 * navigation when the write has finished.
 */
export function useKeptGame(table: BoardTable): Game | undefined {
  const [kept, setKept] = useState<Game | undefined>(table.game);
  // Following the table's game while it has one (the usual way to derive state from what a component is given).
  if (table.game && table.game !== kept) setKept(table.game);
  return table.game ?? kept;
}
