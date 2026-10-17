import type { BoardTable } from '@stockers/shared';
import { useMemo } from 'react';
import { useBoard } from '../api';

/** Where each player is playing now, from the board: the table or room, and its place in the board's order. */
export function useBusyPlayers() {
  const board = useBoard('all');
  return useMemo(() => {
    const busy = new Map<string, { table: BoardTable; order: number }>();
    board.data?.tables.forEach((table, order) => {
      const game = table.game;
      if (!game) return;
      const ids = [
        ...(game.playerIds ?? []),
        ...(game.sides?.flat() ?? []),
        ...(game.underPlayerId ? [game.underPlayerId] : []),
      ];
      ids.forEach((id) => busy.set(id, { table, order }));
    });
    return busy;
  }, [board.data]);
}
