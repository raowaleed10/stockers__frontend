import { beforeEach, describe, expect, it } from 'vitest';
import { eventBus, type LiveEventName } from '@/lib/events';
import { requireWorker } from './auth';
import { counterAlerts } from './alerts';
import { board, markOutOfOrder } from './board';
import type { MockDb } from './db';
import { MockApiError } from './errors';
import { startGame } from './games';
import { createDb } from './load';
import { createPlayer, lastPlayedAt, recentPlayers, searchPlayers } from './players';
import { seed } from './seed';

const at = (iso: string) => Date.parse(iso);
const NIGHT = at('2026-10-03T21:42:00+05:00');

let clock = NIGHT;
const make = (): MockDb => createDb(seed, { app: 'counter', now: () => clock });
const actor = (db: MockDb) => requireWorker(db).by;

function refusal(run: () => unknown): MockApiError {
  try {
    run();
  } catch (error) {
    if (error instanceof MockApiError) return error;
    throw error;
  }
  throw new Error('Expected the operation to be refused');
}

beforeEach(() => {
  eventBus.clear();
  clock = NIGHT;
});

describe('searching players at the counter (screen 8)', () => {
  it('finds a name by the start of any of its words: "ali" is in Ali Raza and Hamid Ali, not in Malik', () => {
    const db = make();
    const names = searchPlayers(db, 'ali', true).map((p) => p.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'Ali Akbar',
        'Ali Haider',
        'Ali Hassan',
        'Ali Raza',
        'Ali Shah',
        'Hamid Ali',
        'Rizwan Ali',
      ]),
    );
    expect(names).toHaveLength(7);
    expect(names).not.toContain('Shoaib Malik');
  });

  it('finds the other word of a name, and the last digits of a phone number', () => {
    const db = make();
    expect(searchPlayers(db, 'raza', true).map((p) => p.name)).toEqual(['Ali Raza']);
    expect(searchPlayers(db, 'ali r', true).map((p) => p.name)).toEqual(['Ali Raza']);
    expect(searchPlayers(db, '2209', true).map((p) => p.name)).toEqual(['Ahmed Nawaz']);
  });

  it('gives the number masked to the counter and whole to the owners', () => {
    const db = make();
    expect(searchPlayers(db, 'ahmed', true)[0]).toMatchObject({
      phone: '0333 •••• 2209',
      phoneTail: '•••• 2209',
    });
    expect(searchPlayers(db, 'ahmed', false)[0].phone).toBe('0333 6612209');
  });
});

describe('when a player last played', () => {
  it('is the start of his latest frame on his statement (Ali Akbar: Thursday 1 Oct)', () => {
    const db = make();
    expect(lastPlayedAt(db, 'ali-akbar')).toBe('2026-10-01T21:30:00+05:00');
    expect(searchPlayers(db, 'akbar', true)[0].lastPlayedAt).toBe('2026-10-01T21:30:00+05:00');
  });

  it('is the start of the game he is in now, if that is later', () => {
    const db = make();
    // Ali Raza and Bilal are in frame 3 on Table 1, started at 9:23 PM.
    expect(lastPlayedAt(db, 'ali-raza')).toBe('2026-10-03T21:23:18+05:00');
  });

  it('is nothing for a player who has not played, and a payment is not playing', () => {
    const db = make();
    expect(lastPlayedAt(db, 'danish')).toBeUndefined();
    expect(lastPlayedAt(db, 'ali-shah')).toBeUndefined();
    expect(searchPlayers(db, 'shah', true)[0]).not.toHaveProperty('lastPlayedAt');
  });

  it('moves when a game starts: the new players played just now', () => {
    const db = make();
    startGame(db, actor(db), {
      tableId: 't2',
      type: 'single',
      playerIds: ['danish', 'ali-shah'],
    });
    expect(lastPlayedAt(db, 'danish')).toBe('2026-10-03T21:42:00+05:00');
    expect(lastPlayedAt(db, 'ali-shah')).toBe('2026-10-03T21:42:00+05:00');
  });
});

describe('"Played here recently" (GET /players/recent)', () => {
  it('lists the last eight to play, the latest first, with their numbers masked', () => {
    const db = make();
    const recent = recentPlayers(db, 8, true);
    expect(recent).toHaveLength(8);
    const times = recent.map((p) => Date.parse(p.lastPlayedAt ?? ''));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
    // Everyone on a table now played tonight, so they are all in the list (Tariq Jamil is on Table 6).
    expect(recent.map((p) => p.name)).toContain('Tariq Jamil');
    expect(recent[0].phone).toMatch(/^\d{4} •••• \d{4}$/);
  });

  it('leaves out players who have never played and stops at the limit', () => {
    const db = make();
    const everyone = recentPlayers(db, 50, true).map((p) => p.id);
    expect(everyone).not.toContain('danish');
    expect(everyone).not.toContain('ali-shah');
    expect(recentPlayers(db, 3, true)).toHaveLength(3);
  });

  it('puts a player who has just started a game first', () => {
    const db = make();
    clock = at('2026-10-03T21:50:00+05:00');
    startGame(db, actor(db), { tableId: 't2', type: 'century', underPlayerId: 'ali-akbar' });
    expect(recentPlayers(db, 8, true)[0]).toMatchObject({ id: 'ali-akbar' });
  });
});

describe('a new player made in the middle of the flow (screen 10)', () => {
  it('gets an account at once with no phone number when it is skipped (Q18)', () => {
    const db = make();
    const player = createPlayer(db, { name: 'Zed Khan' }, true);
    expect(player).toMatchObject({ id: 'zed-khan', name: 'Zed Khan', balance: 0 });
    expect(player).not.toHaveProperty('phone');
    expect(db.statement('zed-khan')).toEqual([]);
    // He can start a game straight away.
    startGame(db, actor(db), { tableId: 't2', type: 'single', playerIds: ['zed-khan', 'danish'] });
    expect(board(db, 'all').players['zed-khan']?.name).toBe('Zed Khan');
  });

  it('refuses a number that is too short and a name that is empty', () => {
    const db = make();
    expect(refusal(() => createPlayer(db, { name: 'Zed', phone: '0302 81' }, true)).body.code).toBe(
      'VALIDATION',
    );
    expect(refusal(() => createPlayer(db, { name: '  ' }, true)).body.code).toBe('VALIDATION');
  });
});

describe('"Mark out of order" on screen 7 (POST /tables/:id/out-of-order)', () => {
  it('puts a free table out of order with the note, the worker’s name and the time', () => {
    const db = make();
    const seen: LiveEventName[] = [];
    eventBus.on('board.changed', () => seen.push('board.changed'));
    const table = markOutOfOrder(db, actor(db), 't2', '  Cloth change  ');
    expect(table.outOfOrder).toMatchObject({
      note: 'Cloth change',
      by: { name: 'Zain' },
      at: '2026-10-03T21:42:00+05:00',
    });
    expect(seen).toEqual(['board.changed']);
    const tile = board(db).tables.find((t) => t.id === 't2');
    expect(tile?.outOfOrder?.note).toBe('Cloth change');
    // A game cannot start on it.
    expect(
      refusal(() =>
        startGame(db, actor(db), { tableId: 't2', type: 'century', underPlayerId: 'danish' }),
      ).body.code,
    ).toBe('TABLE_OUT_OF_ORDER');
  });

  it('adds an alert to the counter’s bell, and the activity history names the worker', () => {
    const db = make();
    const before = counterAlerts(db).unread;
    markOutOfOrder(db, actor(db), 't2', 'Cloth change');
    const { alerts, unread } = counterAlerts(db);
    expect(unread).toBe(before + 1);
    expect(alerts[0]).toMatchObject({
      kind: 'out-of-order',
      title: 'Table 2 marked out of order by Zain',
      text: 'Cloth change',
      read: false,
    });
  });

  it('needs a note, and refuses a table that is in use or already out of order', () => {
    const db = make();
    expect(refusal(() => markOutOfOrder(db, actor(db), 't2', '   ')).body.code).toBe(
      'NOTE_REQUIRED',
    );
    expect(refusal(() => markOutOfOrder(db, actor(db), 't1', 'Cloth')).body.code).toBe(
      'TABLE_BUSY',
    );
    expect(refusal(() => markOutOfOrder(db, actor(db), 't7', 'Cloth')).body.code).toBe(
      'TABLE_OUT_OF_ORDER',
    );
    expect(refusal(() => markOutOfOrder(db, actor(db), 't99', 'Cloth')).body.code).toBe(
      'NOT_FOUND',
    );
    expect(db.table('t2').outOfOrder).toBeUndefined();
  });
});
