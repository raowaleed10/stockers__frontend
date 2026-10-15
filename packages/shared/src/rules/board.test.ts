import { describe, expect, it } from 'vitest';
import type { BoardCategory, BoardTable } from '../api';
import type { Game, Session } from '../types';
import { boardTabs, sessionStanding, summarizeTables, tableStatus } from './board';

const MIN = 60_000;
const NOW = Date.parse('2026-10-03T21:42:00+05:00');
const ago = (minutes: number) => new Date(NOW - minutes * MIN).toISOString();
const by = { id: 'zain', name: 'Zain', role: 'worker' as const };

function table(id: string, extra: Partial<BoardTable> = {}): BoardTable {
  return {
    id,
    categoryId: 'snooker',
    kind: 'snooker',
    number: id,
    name: `Table ${id}`,
    price: 250,
    ...extra,
  };
}

function game(type: Game['type'], minutes: number, extra: Partial<Game> = {}): Game {
  return {
    id: `g-${type}-${minutes}`,
    tableId: 't',
    sheetId: 's48',
    type,
    status: 'running',
    startedAt: ago(minutes),
    startedBy: by,
    pausedMs: 0,
    price: 250,
    ...extra,
  };
}

/** The nine snooker tables and rooms at 9:42 PM (screen 3). */
const SCREEN_3: BoardTable[] = [
  table('1', { game: game('single', 18) }),
  table('2'),
  table('3', { game: game('century', 37) }),
  table('4', { price: 200, game: game('single', 34) }),
  table('5', { price: 200, game: game('double', 22) }),
  table('6', { game: game('single', 12, { status: 'paused', pausedAt: ago(3) }) }),
  table('7', { outOfOrder: { note: 'Cloth change', by, at: ago(327) } }),
  table('r1', { categoryId: 'room', kind: 'room', price: 1500, game: game('room', 72) }),
  table('r2', { categoryId: 'room', kind: 'room', price: 1500 }),
];

describe('tableStatus', () => {
  it('is free with no game, and playing under 30 minutes', () => {
    expect(tableStatus(table('2'), NOW)).toBe('free');
    expect(tableStatus(table('1', { game: game('single', 18) }), NOW)).toBe('playing');
  });

  it('turns to the red card at 30:00 and not at 29:59', () => {
    const at = (ms: number) =>
      tableStatus(
        table('4', { game: game('single', 0, { startedAt: new Date(NOW - ms).toISOString() }) }),
        NOW,
      );
    expect(at(30 * MIN - 1000)).toBe('playing');
    expect(at(30 * MIN)).toBe('over30');
  });

  it('applies to a double frame too, but never to a Century or a room', () => {
    expect(tableStatus(table('5', { game: game('double', 31) }), NOW)).toBe('over30');
    expect(tableStatus(table('3', { game: game('century', 42) }), NOW)).toBe('playing');
    expect(tableStatus(table('r1', { game: game('room', 100) }), NOW)).toBe('playing');
  });

  it('is paused for a paused game, and the paused minutes are not counted', () => {
    const paused = game('single', 80, { status: 'paused', pausedAt: ago(70), pausedMs: 0 });
    // 10 minutes were played before the pause; the 70 minutes since do not count.
    expect(tableStatus(table('6', { game: paused }), NOW)).toBe('paused');
  });

  it('puts out of order before everything, then a missing price', () => {
    const broken = table('7', {
      game: game('single', 5),
      outOfOrder: { note: 'Cloth change', by, at: ago(30) },
    });
    expect(tableStatus(broken, NOW)).toBe('outOfOrder');
    expect(tableStatus(table('po1', { price: null }), NOW)).toBe('noPrice');
    expect(tableStatus(table('po1', { price: null, outOfOrder: broken.outOfOrder }), NOW)).toBe(
      'outOfOrder',
    );
  });
});

function category(
  id: string,
  kind: BoardCategory['kind'],
  order: number,
  inUse: number,
  total: number,
): BoardCategory {
  return {
    id,
    name: id,
    kind,
    pricing: 'frame',
    centuryAllowed: false,
    order,
    inUse,
    total,
  };
}

describe('boardTabs', () => {
  const CATEGORIES = [
    category('pool', 'pool', 3, 0, 4),
    category('room', 'room', 2, 2, 2),
    category('snooker', 'snooker', 1, 4, 7),
    category('playstation', 'playstation', 7, 0, 5),
    category('foosball', 'foosball', 4, 0, 3),
    category('carrom', 'carrom', 5, 0, 3),
    category('ludo', 'ludo', 6, 0, 4),
  ];

  it('screen 3: snooker tables and rooms are one tab, "6 of 9 in use", then the other games in order', () => {
    expect(boardTabs(CATEGORIES).map(({ id, inUse, total }) => [id, inUse, total])).toEqual([
      ['snooker', 6, 9],
      ['pool', 0, 4],
      ['foosball', 0, 3],
      ['carrom', 0, 3],
      ['ludo', 0, 4],
      ['playstation', 0, 5],
    ]);
  });

  it('gives the first tab a name and the other tabs the name of their category', () => {
    const tabs = boardTabs(CATEGORIES);
    expect(tabs[0]?.name).toBe('Snooker and rooms');
    expect(tabs[1]?.name).toBe('pool');
  });

  it('is empty for no categories, and a club with rooms only still has the one tab', () => {
    expect(boardTabs([])).toEqual([]);
    expect(boardTabs([category('room', 'room', 1, 1, 2)])).toEqual([
      { id: 'snooker', name: 'Snooker and rooms', inUse: 1, total: 2 },
    ]);
  });
});

describe('sessionStanding', () => {
  const session = (frames: Session['frames']): Session => ({
    id: 'sess-t1',
    tableId: 't1',
    playerIds: ['ali', 'bilal'],
    frames,
  });
  const frame = (no: number, loser: string, endedMinutesAgo: number) => ({
    no,
    loserIds: [loser],
    amount: 250,
    startedAt: ago(endedMinutesAgo + 20),
    endedAt: ago(endedMinutesAgo),
  });

  it('screen 3, Table 1: Frame 3, Ali leads 2–0 (Bilal lost the first two)', () => {
    const frames = [frame(1, 'bilal', 50), frame(2, 'bilal', 25), frame(3, 'bilal', -9)];
    // Frame 3 ends at 9:51 PM, after "now", so it does not count yet.
    expect(sessionStanding({ frameNo: 3 }, session(frames), NOW)).toEqual({
      frameNo: 3,
      leader: { playerId: 'ali', wins: 2, otherWins: 0 },
    });
  });

  it('counts a frame once it has ended', () => {
    const frames = [frame(1, 'bilal', 50), frame(2, 'bilal', 25), frame(3, 'bilal', -9)];
    expect(sessionStanding({ frameNo: 3 }, session(frames), NOW + 10 * MIN)?.leader).toEqual({
      playerId: 'ali',
      wins: 3,
      otherWins: 0,
    });
  });

  it('says who leads when the other player is ahead', () => {
    const frames = [frame(1, 'ali', 50), frame(2, 'ali', 25), frame(3, 'bilal', 10)];
    expect(sessionStanding({ frameNo: 4 }, session(frames), NOW)?.leader).toEqual({
      playerId: 'bilal',
      wins: 2,
      otherWins: 1,
    });
  });

  it('has no leader when the players are level, or when no frame has been played', () => {
    expect(
      sessionStanding({ frameNo: 3 }, session([frame(1, 'ali', 50), frame(2, 'bilal', 25)]), NOW),
    ).toEqual({ frameNo: 3 });
    expect(sessionStanding({ frameNo: 1 }, session([]), NOW)).toEqual({ frameNo: 1 });
  });

  it('has only the frame number with no session, and nothing for a game with no frame number', () => {
    expect(sessionStanding({ frameNo: 4 }, undefined, NOW)).toEqual({ frameNo: 4 });
    expect(sessionStanding({}, session([frame(1, 'bilal', 50)]), NOW)).toBeUndefined();
  });
});

describe('summarizeTables', () => {
  it('gives screen 34 at 9:42 PM: 5 playing (paused counts), 1 over 30 min, 2 free, 1 out of order', () => {
    expect(summarizeTables(SCREEN_3, NOW)).toEqual({
      playing: 5,
      over30: 1,
      free: 2,
      outOfOrder: 1,
    });
  });

  it('counts each table once: the four numbers add up to the tables that can be used', () => {
    const { playing, over30, free, outOfOrder } = summarizeTables(SCREEN_3, NOW);
    expect(playing + over30 + free + outOfOrder).toBe(SCREEN_3.length);
  });

  it('leaves out tables with no price (they are locked)', () => {
    const locked = [table('po1', { price: null }), table('po2', { price: null })];
    expect(summarizeTables([...SCREEN_3, ...locked], NOW)).toEqual(summarizeTables(SCREEN_3, NOW));
  });

  it('is all zeros for no tables', () => {
    expect(summarizeTables([], NOW)).toEqual({ playing: 0, over30: 0, free: 0, outOfOrder: 0 });
  });

  it('moves a table from playing to over 30 as the clock passes 30 minutes', () => {
    const tables = [table('4', { game: game('single', 29) })];
    expect(summarizeTables(tables, NOW).playing).toBe(1);
    expect(summarizeTables(tables, NOW + 2 * MIN)).toMatchObject({ playing: 0, over30: 1 });
  });
});
