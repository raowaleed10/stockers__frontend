// How a table on the board is shown, and the counts on the lock screen (screens 3, 34; decision D7).
// Pure: `now` is always an argument.

import type { BoardTable } from '../api';
import type { TableStatus } from '../types';
import { elapsed, isOver30 } from './time';

/** What a table looks like right now. An out-of-order table wins over everything, then a missing price. */
export function tableStatus(table: BoardTable, now: number): TableStatus {
  if (table.outOfOrder) return 'outOfOrder';
  if (table.price === null) return 'noPrice';
  const game = table.game;
  if (!game) return 'free';
  if (game.status === 'paused') return 'paused';
  // Only a frame turns into a red card at 30 minutes (Q2); a Century and a room run as long as they like.
  const frame = game.type === 'single' || game.type === 'double';
  return frame && isOver30(elapsed(game.startedAt, now, game.pausedMs, game.pausedAt))
    ? 'over30'
    : 'playing';
}

export interface TableSummary {
  /** Tables with a game going. A paused table is still a game in progress, so it counts here. */
  playing: number;
  /** Frames past 30 minutes (the red card). Not counted again in `playing`. */
  over30: number;
  free: number;
  outOfOrder: number;
}

/**
 * The four counts of "Tables right now" on the lock screen. They never overlap: each table is in at most
 * one. A table with no price is locked (D13), so it is left out.
 */
export function summarizeTables(tables: readonly BoardTable[], now: number): TableSummary {
  const summary: TableSummary = { playing: 0, over30: 0, free: 0, outOfOrder: 0 };
  for (const table of tables) {
    switch (tableStatus(table, now)) {
      case 'playing':
      case 'paused':
        summary.playing += 1;
        break;
      case 'over30':
        summary.over30 += 1;
        break;
      case 'free':
        summary.free += 1;
        break;
      case 'outOfOrder':
        summary.outOfOrder += 1;
        break;
      case 'noPrice':
        break;
    }
  }
  return summary;
}
