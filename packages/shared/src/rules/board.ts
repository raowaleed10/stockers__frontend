// How a table on the board is shown, and the counts on the lock screen (screens 3, 34; decision D7).
// Pure: `now` is always an argument.

import type { BoardCategory, BoardTable } from '../api';
import type { Game, Session, TableStatus } from '../types';
import { elapsed, isOver30 } from './time';

/** One tab of the board: a game type, or snooker tables and rooms together. */
export interface BoardTab {
  /** `snooker` is the first tab, and its route is `/`; the others use the category id (`/board/pool`). */
  id: string;
  /** The category's own name, for a tab the screen has no words for. */
  name: string;
  inUse: number;
  total: number;
}

/** The id of the tab that holds snooker tables and rooms (screen 3). */
export const SNOOKER_TAB = 'snooker';

/**
 * The tabs of the live board, in the club's order. Snooker tables and rooms are one tab, "Snooker and rooms",
 * with their counts added ("6 of 9 in use"); every other category is its own tab.
 */
export function boardTabs(categories: readonly BoardCategory[]): BoardTab[] {
  const tabs: BoardTab[] = [];
  const snooker: BoardTab = { id: SNOOKER_TAB, name: 'Snooker and rooms', inUse: 0, total: 0 };
  for (const category of [...categories].sort((a, b) => a.order - b.order)) {
    if (category.kind === 'snooker' || category.kind === 'room') {
      snooker.inUse += category.inUse;
      snooker.total += category.total;
      if (!tabs.includes(snooker)) tabs.push(snooker);
    } else {
      tabs.push({
        id: category.id,
        name: category.name,
        inUse: category.inUse,
        total: category.total,
      });
    }
  }
  return tabs;
}

export interface SessionStanding {
  /** The frame now being played ("Frame 3"). */
  frameNo: number;
  /** Who is ahead and by how much ("Ali leads 2–0"). Not set when the players are level. */
  leader?: { playerId: string; wins: number; otherWins: number };
}

/**
 * Where a session stands while its game is running: the frame number and, when the same two players have
 * played frames before, who leads. Only frames that have ended by `now` count. A game with no frame number
 * has no standing. Each frame has one winner: the player who did not lose it.
 */
export function sessionStanding(
  game: Pick<Game, 'frameNo'>,
  session: Session | undefined,
  now: number,
): SessionStanding | undefined {
  if (game.frameNo === undefined) return undefined;
  const standing: SessionStanding = { frameNo: game.frameNo };
  if (!session) return standing;

  const wins = new Map<string, number>(session.playerIds.map((id) => [id, 0]));
  for (const frame of session.frames) {
    if (Date.parse(frame.endedAt) > now) continue;
    for (const id of session.playerIds) {
      if (!frame.loserIds.includes(id)) wins.set(id, (wins.get(id) ?? 0) + 1);
    }
  }
  const [first, second] = session.playerIds.map((id) => [id, wins.get(id) ?? 0] as const);
  if (first && second && first[1] !== second[1]) {
    const [ahead, behind] = first[1] > second[1] ? [first, second] : [second, first];
    standing.leader = { playerId: ahead[0], wins: ahead[1], otherWins: behind[1] };
  }
  return standing;
}

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
