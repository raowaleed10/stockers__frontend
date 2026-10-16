import type { BoardCategory, BoardTable } from '@stockers/shared';
import { useBoard } from '../api';

/**
 * One table with its category and the whole board, for the screens that open over it. They all read the club-wide
 * board (`['board', 'all']`, the one the lock screen uses), so who is playing where is known for the player tags.
 */
export function useTableScreen(id: string | undefined) {
  const board = useBoard('all');
  const table: BoardTable | undefined = board.data?.tables.find((t) => t.id === id);
  const category: BoardCategory | undefined = board.data?.categories.find(
    (c) => c.id === table?.categoryId,
  );
  return { board, table, category };
}
