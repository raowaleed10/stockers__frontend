import { describe, expect, it } from 'vitest';
import type { BoardTable } from '../api';
import type { Game } from '../types';
import { summarizeTables, tableStatus } from './board';

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
