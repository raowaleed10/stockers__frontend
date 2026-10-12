import { statementBalance } from '@stockers/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { eventBus, type LiveEventName } from '@/lib/events';
import { publicWorkers, requireWorker, workerSignIn, workerUnlock } from './auth';
import { board, unreadCount, waitingBills } from './board';
import { canteenSale, counterCanteenItems } from './canteen';
import { checkout, checkoutBill, checkoutList } from './checkout';
import type { MockDb } from './db';
import { MockApiError } from './errors';
import {
  cancelGame,
  damageCharge,
  discardGame,
  disputeGame,
  endCentury,
  endGame,
  endRoom,
  moveGame,
  nextFrame,
  pauseAll,
  pauseGame,
  resumeAll,
  resumeGame,
  startGame,
  undoGame,
} from './games';
import { createDb, type CreateDbOptions } from './load';
import { createPlayer, searchPlayers, statementOf } from './players';
import { seed } from './seed';
import { closePreview, closeSheet, drawerExpense, todayTotals } from './sheet';

const at = (iso: string) => Date.parse(iso);
const NIGHT = at('2026-10-03T21:42:00+05:00');

let clock = NIGHT;
const make = (options: Partial<CreateDbOptions> = {}): MockDb => {
  clock = options.scenario ? at(seed.scenarios[options.scenario].now ?? '') || NIGHT : NIGHT;
  return createDb(seed, { app: 'counter', now: () => clock, ...options });
};

/** The worker who is signed in (Zain, or Shabir in the closing scenarios). */
const actor = (db: MockDb) => requireWorker(db).by;

/** The answer a refused operation gives. */
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

describe('loading the seed', () => {
  it.each([undefined, 'paused', 'checkout', 'closing', 'closed', 'empty'] as const)(
    'loads scenario %s, and every balance equals the sum of that player’s statement',
    (scenario) => {
      const db = make({ scenario: scenario ?? null });
      expect(db.s.players).toHaveLength(21);
      for (const player of db.s.players) {
        expect(statementBalance(db.statement(player.id)), player.name).toBe(player.balance);
      }
    },
  );

  it('keeps the PINs out of what the sign-in page gets', () => {
    const db = make();
    const text = JSON.stringify(publicWorkers(db));
    expect(text).not.toContain('1111');
    expect(text).not.toContain('2222');
    expect(text).not.toContain('pin');
  });

  it('shows Zain as available and Shabir as not now at 9:42 PM', () => {
    expect(publicWorkers(make())).toEqual([
      { id: 'shabir', name: 'Shabir', slot: { start: '02:00', end: '10:00' }, canSignInNow: false },
      { id: 'zain', name: 'Zain', slot: { start: '14:00', end: '23:00' }, canSignInNow: true },
    ]);
  });

  it('posts tonight’s bills on load: Kamran 1,100 + 250 = 1,350, as on screen 30', () => {
    const db = make();
    expect(db.player('kamran').balance).toBe(1350);
    const bill = waitingBills(db).find((b) => b.playerId === 'kamran');
    expect(bill).toMatchObject({ tonight: 250, oldCredit: 1100, total: 1350 });
  });

  it('gives Bilal the credit he brought (500) and tonight’s 2 frames and 2 teas (600)', () => {
    const db = make();
    const bill = waitingBills(db).find((b) => b.playerId === 'bilal');
    expect(bill).toMatchObject({
      summary: '2 frames lost, 2 teas',
      tonight: 600,
      oldCredit: 500,
      total: 1100,
    });
    expect(db.tonightLines('bilal').map((l) => l.charge)).toEqual([250, 250, 100]);
  });

  it('lists the five waiting players of screen 3 in order, Rs 1,550 in all', () => {
    const bills = waitingBills(make());
    expect(bills.map((b) => b.playerId)).toEqual(['bilal', 'zubair', 'kamran', 'faisal', 'tariq']);
    expect(bills.reduce((sum, b) => sum + b.tonight, 0)).toBe(1550);
  });

  it('gives a player with old credit an opening balance from an owner (D28)', () => {
    const db = make();
    const [line] = db.statement('ali-haider');
    expect(line).toMatchObject({ kind: 'opening', charge: 1200, balance: 1200 });
    expect(line.doneBy.role).toBe('owner');
  });

  it('turns the closing Century’s `rate` into a `price`', () => {
    const db = make({ scenario: 'closing' });
    expect(db.game('g-t2-c').price).toBe(15);
  });
});

describe('scenarios', () => {
  it('paused: every game is paused since 9:58 PM and the board says so (screen 16)', () => {
    const db = make({ scenario: 'paused' });
    expect(db.s.games.every((g) => g.status === 'paused')).toBe(true);
    expect(db.game('g-t1-3').pausedAt).toBe('2026-10-03T21:58:00+05:00');
    expect(db.game('g-t6-1').pausedAt).toBe('2026-10-03T21:39:00+05:00');
    expect(board(db).pausedAll).toBe(true);
  });

  it('checkout: 8 players are waiting, Rs 6,880 in all (screen 24)', () => {
    const db = make({ scenario: 'checkout' });
    const list = checkoutList(db);
    expect(list.bills).toHaveLength(8);
    expect(list.total).toBe(6880);
    expect(list.bills.find((b) => b.playerId === 'tariq')).toBeUndefined();
    expect(list.bills.find((b) => b.playerId === 'saad')).toMatchObject({
      tonight: 630,
      advance: 200,
      total: 430,
    });
  });

  it('closing: Shabir is signed in, one Century on Table 2, Waqas and Shoaib waiting', () => {
    const db = make({ scenario: 'closing' });
    expect(actor(db).name).toBe('Shabir');
    expect(db.s.games.map((g) => g.id)).toEqual(['g-t2-c']);
    expect(waitingBills(db).map((b) => [b.playerId, b.tonight])).toEqual([
      ['waqas', 450],
      ['shoaib', 250],
    ]);
  });

  it('closed: sheet 48 is closed by Shabir, sheet 49 is open, the Century moved', () => {
    const db = make({ scenario: 'closed' });
    const closed = db.sheet('s48');
    expect(closed.closedBy?.name).toBe('Shabir');
    expect(closed).toMatchObject({
      earned: 35150,
      received: 33300,
      newCredit: 3650,
      oldCreditPaid: 1800,
    });
    expect(closed.cash).toMatchObject({ expected: 21750, counted: 21550, difference: -200 });
    expect(db.s.currentSheetId).toBe('s49');
    expect(db.game('g-t2-c').sheetId).toBe('s49');
    expect(db.s.activity).toHaveLength(12); // the seed already holds a11 and a12
    expect(db.statement('waqas').at(-1)?.kind).toBe('left-without-checkout');
    expect(waitingBills(db)).toEqual([]);
  });

  it('empty: no games, no bills, no activity', () => {
    const db = make({ scenario: 'empty' });
    expect(db.s.games).toEqual([]);
    expect(waitingBills(db)).toEqual([]);
    expect(db.s.activity).toEqual([]);
    expect(board(db).categories[0]).toMatchObject({ inUse: 0, total: 7 });
  });
});

describe('who is signed in at the start', () => {
  it('the counter starts as Zain, the owner app as Aqil', () => {
    expect(make().s.auth.session).toMatchObject({ kind: 'worker', workerId: 'zain' });
    expect(make({ app: 'owner' }).s.auth.session).toMatchObject({ kind: 'owner', ownerId: 'aqil' });
  });

  it('?as= overrides it, and none means nobody', () => {
    expect(make({ as: 'shabir' }).s.auth.session).toMatchObject({
      kind: 'worker',
      workerId: 'shabir',
    });
    expect(make({ as: 'adil', app: 'counter' }).s.auth.session).toMatchObject({
      kind: 'owner',
      ownerId: 'adil',
    });
    expect(make({ as: 'none' }).s.auth.session).toBeNull();
  });
});

describe('sign-in with sign-in times', () => {
  it('refuses Shabir at 9:42 PM with NOT_YOUR_TIME and the times, and Zain gets in', () => {
    const db = make({ as: 'none' });
    const error = refusal(() => workerSignIn(db, { workerId: 'shabir', pin: '1111' }));
    expect(error.status).toBe(403);
    expect(error.body.code).toBe('NOT_YOUR_TIME');
    expect(error.body.details).toEqual({
      slot: { start: '02:00', end: '10:00' },
      now: '2026-10-03T21:42:00+05:00',
    });
    expect(error.body.message).toBe(
      'Not your time to sign in. Shabir can sign in from 2:00 AM to 10:00 AM. It is 9:42 PM now. Only an owner can change sign-in times.',
    );
    expect(db.s.auth.session).toBeNull();

    const session = workerSignIn(db, { workerId: 'zain', pin: '2222' });
    expect(session.worker.name).toBe('Zain');
    expect(session.until).toBe('2026-10-03T23:00:00+05:00');
    expect(db.s.workers.find((w) => w.id === 'zain')?.signedIn?.at).toBe(
      '2026-10-03T21:42:00+05:00',
    );
  });

  it('checks the time before the PIN, so a wrong PIN outside the time is still "not your time"', () => {
    const db = make({ as: 'none' });
    expect(refusal(() => workerSignIn(db, { workerId: 'shabir', pin: '0000' })).body.code).toBe(
      'NOT_YOUR_TIME',
    );
  });

  it('says wrong PIN, and after 5 wrong tries makes him wait 5 minutes', () => {
    const db = make({ as: 'none' });
    for (let i = 0; i < 4; i += 1) {
      const error = refusal(() => workerSignIn(db, { workerId: 'zain', pin: '0000' }));
      expect([error.status, error.body.code, error.body.message]).toEqual([
        401,
        'WRONG_PIN',
        'Wrong PIN. Try again.',
      ]);
    }
    const locked = refusal(() => workerSignIn(db, { workerId: 'zain', pin: '0000' }));
    expect([locked.status, locked.body.code]).toEqual([429, 'TOO_MANY_TRIES']);
    expect(locked.body.details).toEqual({ retryAfterSec: 300 });
    // The right PIN does not help while he waits.
    expect(refusal(() => workerSignIn(db, { workerId: 'zain', pin: '2222' })).status).toBe(429);
    clock += 5 * 60_000 + 1000;
    expect(workerSignIn(db, { workerId: 'zain', pin: '2222' }).worker.id).toBe('zain');
  });

  it('works from the lock screen with his own PIN', () => {
    const db = make();
    expect(refusal(() => workerUnlock(db, { pin: '1234' })).body.code).toBe('WRONG_PIN');
    expect(workerUnlock(db, { pin: '2222' }).worker.id).toBe('zain');
  });

  it('answers 401 with no worker session', () => {
    const db = make({ as: 'none' });
    expect(refusal(() => requireWorker(db)).status).toBe(401);
  });

  it('signs Zain out at 11:00 PM: SESSION_ENDED, and the games keep running under him', () => {
    const db = make();
    const game = startGame(db, actor(db), {
      tableId: 't2',
      type: 'single',
      playerIds: ['ahmed-nawaz', 'ali-akbar'],
    });
    clock = at('2026-10-03T22:59:59+05:00');
    expect(requireWorker(db).worker.id).toBe('zain');
    clock = at('2026-10-03T23:00:00+05:00');
    const error = refusal(() => requireWorker(db));
    expect([error.status, error.body.code]).toEqual([401, 'SESSION_ENDED']);
    expect(db.s.auth.session).toBeNull();
    expect(db.game(game.id)).toMatchObject({ status: 'running', startedBy: { name: 'Zain' } });
  });
});

describe('the board', () => {
  it('shows 6 of 9 snooker tables and rooms in use, with the tab counts (screen 3)', () => {
    const response = board(make());
    expect(response.categories.find((c) => c.id === 'snooker')).toMatchObject({
      inUse: 5,
      total: 7,
    });
    expect(response.categories.find((c) => c.id === 'room')).toMatchObject({ inUse: 1, total: 2 });
    expect(response.tables.map((t) => t.id)).toEqual([
      't1',
      't2',
      't3',
      't4',
      't5',
      't6',
      't7',
      'r1',
      'r2',
    ]);
    expect(response.tables.filter((t) => t.game)).toHaveLength(6);
    expect(response.waiting).toHaveLength(5);
  });

  it('gives the whole club for `all`, which the owners’ live view uses', () => {
    const response = board(make(), 'all');
    expect(response.tables).toHaveLength(28);
    expect(response.tables.filter((t) => t.game)).toHaveLength(6);
  });

  it('gives pool tables with no price (screen 4) and a table filter of its own', () => {
    const response = board(make(), 'pool');
    expect(response.tables).toHaveLength(4);
    expect(response.tables.every((t) => t.price === null && !t.game)).toBe(true);
    expect(refusal(() => board(make(), 'chess')).status).toBe(404);
  });

  it('names every player on a table, and brings the session with the game', () => {
    const response = board(make());
    expect(response.players['ali-raza']).toEqual({ id: 'ali-raza', name: 'Ali Raza' });
    expect(response.players['saad']).toEqual({ id: 'saad', name: 'Saad Hussain' });
    expect(response.tables.find((t) => t.id === 't1')?.session?.frames).toHaveLength(2);
  });

  it('says the last backup was on the hour: 9:00 PM at 9:42 PM (screen 3)', () => {
    expect(board(make()).backedUpAt).toBe('2026-10-03T21:00:00+05:00');
  });

  it('counts the unread notifications that have already happened', () => {
    expect(unreadCount(make())).toBe(0);
    clock = at('2026-10-04T03:45:00+05:00');
    expect(unreadCount(make({ scenario: 'closed' }))).toBe(2);
  });
});

describe('starting a game', () => {
  it('starts a single frame on free Table 2 at its price, under Zain, and the board shows it', () => {
    const db = make();
    const seen: LiveEventName[] = [];
    eventBus.on('*', (name) => seen.push(name));
    const game = startGame(db, actor(db), {
      tableId: 't2',
      type: 'single',
      playerIds: ['ahmed-nawaz', 'ali-akbar'],
    });
    expect(game).toMatchObject({
      tableId: 't2',
      type: 'single',
      status: 'running',
      price: 250,
      frameNo: 1,
    });
    expect(game.startedBy).toEqual({ id: 'zain', name: 'Zain', role: 'worker' });
    expect(game.startedAt).toBe('2026-10-03T21:42:00+05:00');
    expect(board(db).tables.find((t) => t.id === 't2')?.game?.id).toBe(game.id);
    expect(board(db).categories.find((c) => c.id === 'snooker')?.inUse).toBe(6);
    expect(seen).toEqual(expect.arrayContaining(['game.changed', 'board.changed']));
    expect(db.s.sheetHistory.s48?.at(-1)).toMatchObject({
      by: { name: 'Zain' },
      text: 'Started single frame on Table 2, Rs 250',
    });
  });

  it('refuses a busy table, an out-of-order table and a table with no price', () => {
    const db = make();
    const by = actor(db);
    const players: [string, string] = ['ahmed-nawaz', 'ali-akbar'];
    expect(
      refusal(() => startGame(db, by, { tableId: 't1', type: 'single', playerIds: players })).body
        .code,
    ).toBe('TABLE_BUSY');
    expect(
      refusal(() => startGame(db, by, { tableId: 't7', type: 'single', playerIds: players })).body
        .code,
    ).toBe('TABLE_OUT_OF_ORDER');
    const pool = refusal(() =>
      startGame(db, by, { tableId: 'po1', type: 'game', playerIds: players }),
    );
    expect([pool.status, pool.body.code]).toEqual([409, 'PRICE_NOT_SET']);
  });

  it('doubles the price for a double and takes the Century rate from the price card', () => {
    const db = make();
    const by = actor(db);
    const double = startGame(db, by, {
      tableId: 't2',
      type: 'double',
      sides: [
        ['imran', 'naveed'],
        ['faisal', 'kamran'],
      ],
    });
    expect(double.price).toBe(500);

    const other = make();
    const century = startGame(other, actor(other), {
      tableId: 't2',
      type: 'century',
      underPlayerId: 'saad',
    });
    expect(century.price).toBe(15);
    const custom = make();
    expect(
      startGame(custom, actor(custom), {
        tableId: 't2',
        type: 'century',
        underPlayerId: 'saad',
        price: 20,
      }).price,
    ).toBe(20);
  });

  it('does not allow Century on a pool table (Q4)', () => {
    const db = make();
    // Pool has no price yet, so it is locked first; the Century rule is the second guard.
    expect(
      refusal(() =>
        startGame(db, actor(db), { tableId: 'po1', type: 'century', underPlayerId: 'saad' }),
      ).body.code,
    ).toBe('PRICE_NOT_SET');
    db.table('po1').price = 300;
    expect(
      refusal(() =>
        startGame(db, actor(db), { tableId: 'po1', type: 'century', underPlayerId: 'saad' }),
      ).body.message,
    ).toBe('Century is not played on this table.');
  });

  it('checks the players: two different people for a frame, one or two on each side for a double', () => {
    const db = make();
    const by = actor(db);
    expect(
      refusal(() =>
        startGame(db, by, { tableId: 't2', type: 'single', playerIds: ['imran', 'imran'] }),
      ).status,
    ).toBe(400);
    expect(
      refusal(() =>
        startGame(db, by, { tableId: 't2', type: 'single', playerIds: ['imran', 'nobody'] }),
      ).status,
    ).toBe(404);
    expect(
      refusal(() =>
        startGame(db, by, { tableId: 't2', type: 'double', sides: [['imran'], ['imran']] }),
      ).status,
    ).toBe(400);
  });

  it('starts a room under one player at the hourly price the worker set (Q8)', () => {
    const db = make();
    const room = startGame(db, actor(db), {
      tableId: 'r2',
      type: 'room',
      underPlayerId: 'saad',
      price: 1200,
    });
    expect(room).toMatchObject({ type: 'room', price: 1200, underPlayerId: 'saad' });
  });
});

describe('undo, cancel, discard and dispute', () => {
  it('undoes a game within 2 minutes with no reason, and logs it for the owners', () => {
    const db = make();
    const by = actor(db);
    const game = startGame(db, by, {
      tableId: 't2',
      type: 'single',
      playerIds: ['ahmed-nawaz', 'ali-akbar'],
    });
    clock += 40_000;
    expect(undoGame(db, by, game.id).status).toBe('cancelled');
    expect(db.activeGameOn('t2')).toBeUndefined();
    expect(db.s.activity[0]).toMatchObject({
      type: 'undo',
      title: 'Game undone on Table 2',
      detail: 'Started by mistake, undone after 40 seconds. No reason needed.',
      by: { name: 'Zain' },
    });
    expect(db.s.notifications[0]).toMatchObject({ kind: 'cancelled-or-discarded', read: false });
  });

  it('refuses an undo after 2 minutes, but allows a cancel with a reason', () => {
    const db = make();
    const by = actor(db);
    const game = startGame(db, by, {
      tableId: 't2',
      type: 'single',
      playerIds: ['ahmed-nawaz', 'ali-akbar'],
    });
    clock += 2 * 60_000 + 1000;
    const error = refusal(() => undoGame(db, by, game.id));
    expect([error.status, error.body.code]).toEqual([409, 'UNDO_EXPIRED']);
    expect(refusal(() => cancelGame(db, by, game.id, { reason: ' ' })).body.code).toBe(
      'NOTE_REQUIRED',
    );
    expect(cancelGame(db, by, game.id, { reason: 'Players never came' }).status).toBe('cancelled');
    expect(db.s.activity[0]).toMatchObject({ type: 'cancel', detail: '“Players never came”' });
  });

  it('discards a frame: nobody pays, the owners see what was not charged', () => {
    const db = make();
    const by = actor(db);
    const game = discardGame(db, by, 'g-t6-1', {
      reason: 'Players left halfway',
      note: 'Tariq got a call',
    });
    expect(game.status).toBe('discarded');
    expect(db.s.activity[0]).toMatchObject({
      type: 'discard',
      title: 'Frame discarded on Table 6',
      detail: 'Players left halfway. “Tariq got a call”',
      amount: 250,
    });
    expect(db.tonightLines('hamid')).toEqual([]);
  });

  it('marks a dispute: unpaid, and the owners decide later', () => {
    const db = make();
    const game = disputeGame(db, actor(db), 'g-t4-1', { note: 'Both say the other fouled' });
    expect(game.status).toBe('dispute');
    const event = db.s.activity[0];
    expect(event).toMatchObject({ type: 'dispute', needsDecision: true, amount: 200 });
    expect(db.s.disputes[event.id]).toEqual({
      tableId: 't4',
      playerIds: ['usman-t', 'zubair'],
      amount: 200,
    });
    expect(refusal(() => disputeGame(db, actor(db), 'g-t4-1', { note: 'again' })).body.code).toBe(
      'GAME_NOT_RUNNING',
    );
  });
});

describe('ending a frame', () => {
  it('charges the loser the table price and puts it on his bill (Table 1, Bilal)', () => {
    const db = make();
    const result = endGame(db, actor(db), 'g-t1-3', { loserIds: ['bilal'] });
    expect(result.amount).toBe(250);
    expect(result.lines[0]).toMatchObject({
      kind: 'frame',
      text: 'Frame, Table 1, lost to Ali Raza',
      charge: 250,
      doneBy: { name: 'Zain' },
    });
    expect(waitingBills(db).find((b) => b.playerId === 'bilal')).toMatchObject({
      tonight: 850,
      total: 1350,
    });
    expect(db.game('g-t1-3')).toMatchObject({
      status: 'ended',
      result: { loserIds: ['bilal'], amount: 250 },
    });
    expect(db.player('ali-raza')).toMatchObject({ framesWon: 53, framesPlayed: 81 });
    expect(db.s.sessions.find((s) => s.id === 'sess-t1')?.frames).toHaveLength(3);
  });

  it('starts the next frame for the same players in the same session (D10)', () => {
    const db = make();
    const by = actor(db);
    endGame(db, by, 'g-t1-3', { loserIds: ['bilal'] });
    const next = nextFrame(db, by, 'g-t1-3');
    expect(next).toMatchObject({
      sessionId: 'sess-t1',
      frameNo: 4,
      price: 250,
      playerIds: ['ali-raza', 'bilal'],
    });
    expect(refusal(() => nextFrame(db, by, 'g-t1-3')).body.code).toBe('TABLE_BUSY');
  });

  it('asks nothing under 30 minutes and refuses a double charge then', () => {
    const db = make();
    const error = refusal(() =>
      endGame(db, actor(db), 'g-t1-3', { loserIds: ['bilal'], chargeDouble: true }),
    );
    expect(error.body.message).toBe('A frame is charged double only after 30 minutes.');
  });

  it('Table 4 at 34:10 can be charged double: Rs 400, and the owners see it (screen 19)', () => {
    const db = make();
    const result = endGame(db, actor(db), 'g-t4-1', { loserIds: ['zubair'], chargeDouble: true });
    expect(result.amount).toBe(400);
    expect(result.game.result?.chargedDouble).toBe(true);
    expect(db.s.activity[0]).toMatchObject({
      type: 'double-charge',
      title: 'Charged double on Table 4',
      detail: 'Frame ran 34 minutes. Zubair Khan paid Rs 400 instead of Rs 200.',
      amount: 200,
    });
  });

  it('charges the normal price when the worker says not to charge double', () => {
    const db = make();
    expect(endGame(db, actor(db), 'g-t4-1', { loserIds: ['zubair'] }).amount).toBe(200);
  });

  it('a double frame (Table 5, 400) splits between the losing side: Imran 200, Naveed 200', () => {
    const db = make();
    const result = endGame(db, actor(db), 'g-t5-d', { loserIds: ['imran', 'naveed'] });
    expect(result.amount).toBe(400);
    expect(result.game.result?.split).toEqual({ imran: 200, naveed: 200 });
    expect(result.lines.map((l) => [l.playerId, l.charge, l.text])).toEqual([
      ['imran', 200, 'Half of a double, Table 5'],
      ['naveed', 200, 'Half of a double, Table 5'],
    ]);
    expect(db.s.today.doubles).toBe(7);
  });

  it('lets the worker adjust the split, and refuses one that does not add up', () => {
    const db = make();
    const by = actor(db);
    expect(
      refusal(() =>
        endGame(db, by, 'g-t5-d', {
          loserIds: ['imran', 'naveed'],
          split: { imran: 300, naveed: 50 },
        }),
      ).status,
    ).toBe(400);
    const ok = endGame(db, by, 'g-t5-d', {
      loserIds: ['imran', 'naveed'],
      split: { imran: 300, naveed: 100 },
    });
    expect(ok.game.result?.split).toEqual({ imran: 300, naveed: 100 });
  });

  it('refuses a loser who is not in the game, and the wrong end button', () => {
    const db = make();
    const by = actor(db);
    expect(refusal(() => endGame(db, by, 'g-t1-3', { loserIds: ['saad'] })).status).toBe(400);
    expect(refusal(() => endGame(db, by, 'g-t3-c', { loserIds: ['saad'] })).body.message).toBe(
      'End a Century or a room with its own button.',
    );
  });

  it('keeps the price of the table a frame started on when it moves: Table 1 (250) to Table 4 (200)', () => {
    const db = make();
    const by = actor(db);
    endGame(db, by, 'g-t4-1', { loserIds: ['zubair'] });
    const moved = moveGame(db, by, 'g-t1-3', { toTableId: 't4' });
    expect(moved).toMatchObject({ tableId: 't4', price: 250 });
    expect(db.s.sessions.find((s) => s.id === 'sess-t1')?.tableId).toBe('t4');
    expect(endGame(db, by, 'g-t1-3', { loserIds: ['bilal'] }).amount).toBe(250);
  });

  it('refuses a move to a busy table, an out-of-order table or another kind of table', () => {
    const db = make();
    const by = actor(db);
    expect(refusal(() => moveGame(db, by, 'g-t1-3', { toTableId: 't3' })).body.code).toBe(
      'TABLE_BUSY',
    );
    expect(refusal(() => moveGame(db, by, 'g-t1-3', { toTableId: 't7' })).body.code).toBe(
      'TABLE_OUT_OF_ORDER',
    );
    expect(refusal(() => moveGame(db, by, 'g-t1-3', { toTableId: 'r2' })).status).toBe(400);
  });
});

describe('Century and rooms', () => {
  it('Table 3 Century at 42 min 35 s is 42 x 15 = Rs 630, under Saad', () => {
    const db = make();
    clock = at('2026-10-03T21:47:30+05:00'); // started 21:04:55
    const result = endCentury(db, actor(db), 'g-t3-c');
    expect(result).toMatchObject({ amount: 630, minutes: 42 });
    expect(result.lines[0]).toMatchObject({
      playerId: 'saad',
      kind: 'century',
      charge: 630,
      text: 'Century, Table 3, 42 min at Rs 15',
    });
    expect(db.player('saad').centuryMinutes).toBe(980 + 42);
  });

  it('Room 1 at 1 h 40 min is Rs 2,500 (screen 23)', () => {
    const db = make();
    clock = at('2026-10-03T22:09:55+05:00'); // started 20:29:55
    const result = endRoom(db, actor(db), 'g-r1');
    expect(result).toMatchObject({ amount: 2500, minutes: 100 });
    expect(result.lines[0]).toMatchObject({
      playerId: 'ali-hassan',
      kind: 'room',
      charge: 2500,
      text: 'Room 1, 1 h 40 min',
    });
  });

  it('charges the 1 hour minimum for a short room', () => {
    const db = make();
    const by = actor(db);
    const room = startGame(db, by, { tableId: 'r2', type: 'room', underPlayerId: 'saad' });
    clock += 6 * 60_000;
    expect(endRoom(db, by, room.id).amount).toBe(1500);
  });

  it('does not count paused time (D14)', () => {
    const db = make();
    const by = actor(db);
    clock = at('2026-10-03T21:47:30+05:00');
    pauseGame(db, by, 'g-t3-c');
    clock += 10 * 60_000;
    resumeGame(db, by, 'g-t3-c');
    clock += 60_000;
    // 53:35 on the wall clock at 9:58:30 PM, less 10 minutes paused: 43 whole minutes
    expect(endCentury(db, by, 'g-t3-c').minutes).toBe(43);
  });
});

describe('pause all', () => {
  it('pauses every running game together, writes it to Activity, and resumes them', () => {
    const db = make();
    const by = actor(db);
    const { games } = pauseAll(db, by);
    expect(games).toHaveLength(5); // Table 6 was already paused
    expect(board(db).pausedAll).toBe(true);
    expect(db.s.activity[0]).toMatchObject({ type: 'pause-all', by: { name: 'Zain' } });
    clock += 5 * 60_000;
    resumeAll(db, by);
    expect(db.s.games.filter((g) => g.status === 'paused')).toHaveLength(0);
    expect(db.game('g-t1-3').pausedMs).toBe(5 * 60_000);
    expect(board(db).pausedAll).toBe(false);
    expect(db.s.activity[0].detail).toMatch(/5 minutes not charged on 6 tables/);
  });
});

describe('damage charge', () => {
  it('puts the charge on the player’s bill with his name and the note (screen 15)', () => {
    const db = make();
    const line = damageCharge(db, actor(db), 'g-t1-3', {
      playerId: 'ali-raza',
      item: 'Cue',
      amount: 1500,
      note: 'Cue snapped',
    });
    expect(line).toMatchObject({ kind: 'damage', charge: 1500, doneBy: { name: 'Zain' } });
    expect(db.s.activity[0]).toMatchObject({
      type: 'damage',
      title: 'Damage charge for Ali Raza, Table 1',
      amount: 1500,
    });
    expect(waitingBills(db).find((b) => b.playerId === 'ali-raza')?.total).toBe(1500);
  });

  it('needs a note and a whole amount', () => {
    const db = make();
    const by = actor(db);
    expect(
      refusal(() =>
        damageCharge(db, by, 'g-t1-3', { playerId: 'bilal', item: 'Cue', amount: 1500, note: '' }),
      ).body.code,
    ).toBe('NOTE_REQUIRED');
    expect(
      refusal(() =>
        damageCharge(db, by, 'g-t1-3', { playerId: 'bilal', item: 'Cue', amount: 0, note: 'x' }),
      ).status,
    ).toBe(400);
  });
});

describe('players', () => {
  it('finds a player by name or phone, and shows the number masked to the counter', () => {
    const db = make();
    expect(searchPlayers(db, 'kam', true).map((p) => p.name)).toEqual(['Kamran Iqbal']);
    expect(searchPlayers(db, '2276', true).map((p) => p.id)).toEqual(['kamran']);
    expect(searchPlayers(db, 'kamran', true)[0]).toMatchObject({
      phone: '0313 •••• 2276',
      phoneTail: '•••• 2276',
    });
    expect(searchPlayers(db, 'kamran', false)[0].phone).toBe('0313 1452276');
    expect(searchPlayers(db, 'Ali', true).length).toBeGreaterThan(4);
  });

  it('quick-adds a player at once, with the phone optional (D20, Q18)', () => {
    const db = make();
    const player = createPlayer(db, { name: ' Bilal Ahmed ' }, true);
    expect(player).toMatchObject({ id: 'bilal-ahmed', name: 'Bilal Ahmed', balance: 0 });
    expect(createPlayer(db, { name: 'Bilal Ahmed', phone: '0300 1112223' }, true).id).toBe(
      'bilal-ahmed-2',
    );
    expect(refusal(() => createPlayer(db, { name: '  ' }, true)).body.code).toBe('VALIDATION');
    expect(statementOf(db, 'bilal-ahmed', true).lines).toEqual([]);
  });
});

describe('checkout', () => {
  it('Bilal at 10:20 PM: 500 + 750 + 100 = 1,350 (screen 25)', () => {
    const db = make({ scenario: 'checkout' });
    const bill = checkoutBill(db, 'bilal', true);
    expect(bill).toMatchObject({ oldCredit: 500, tonightTotal: 850, total: 1350, advance: 0 });
    expect(bill.tonight.map((l) => l.charge)).toEqual([250, 250, 250, 100]);
    expect(bill.methods.map((m) => m.id)).toEqual(['cash', 'bank', 'easypaisa', 'jazzcash']);
    expect(bill.player.phone).toBe('0300 •••• 4512');
  });

  it('Bilal: discount 50, cash 600 + Easypaisa 400, 300 to credit (screens 26, 27)', () => {
    const db = make({ scenario: 'checkout' });
    const cashBefore = db.s.today.cashReceived;
    const result = checkout(
      db,
      actor(db),
      'bilal',
      {
        playerId: 'bilal',
        parts: [
          { method: 'cash', amount: 600 },
          { method: 'easypaisa', amount: 400 },
        ],
        toCredit: 300,
        discount: {
          amount: 50,
          reason: 'Rounded the bill',
          note: 'Rounded Rs 1,350 down to Rs 1,300',
        },
      },
      true,
    );
    expect(result.settlement).toMatchObject({
      total: 1350,
      due: 1300,
      paid: 1000,
      toCredit: 300,
      newBalance: 300,
    });
    expect(result.player.balance).toBe(300);
    expect(result.lines.map((l) => [l.kind, l.paid, l.doneBy.name])).toEqual([
      ['payment', 600, 'Zain'],
      ['payment', 400, 'Zain'],
      ['discount', 50, 'Zain'],
    ]);
    expect(statementBalance(db.statement('bilal'))).toBe(300);
    expect(checkoutList(db).bills.find((b) => b.playerId === 'bilal')).toBeUndefined();
    expect(db.s.today.cashReceived).toBe(cashBefore + 600);
    expect(db.s.today.online.easypaisa).toBe(4100 + 400);
    expect(db.s.today.discounts).toEqual({ count: 3, total: 200 });
    expect(db.s.activity[0]).toMatchObject({
      type: 'discount',
      title: 'Discount for Bilal Ahmed',
      detail: 'Rounded the bill. “Rounded Rs 1,350 down to Rs 1,300”',
      amount: -50,
    });
    // What stays on credit is new tonight: his old 500 was paid first.
    expect(db.player('bilal').oldestUnpaidAt).toBe('2026-10-03T20:31:00+05:00');
    expect(db.s.today.oldCreditPaid).toBe(1800 + 500);
    expect(db.s.today.newCredit).toBe(2350 + 300);
  });

  it('Saad pays Rs 430 after using his Rs 200 advance (screen 24)', () => {
    const db = make({ scenario: 'checkout' });
    const result = checkout(
      db,
      actor(db),
      'saad',
      { playerId: 'saad', parts: [{ method: 'cash', amount: 430 }], toCredit: 0 },
      true,
    );
    expect(result.settlement).toMatchObject({ total: 430, newBalance: 0 });
    expect(db.player('saad').balance).toBe(0);
  });

  it('turns an extra payment into advance', () => {
    const db = make({ scenario: 'checkout' });
    checkout(
      db,
      actor(db),
      'zubair',
      { playerId: 'zubair', parts: [{ method: 'cash', amount: 700 }], toCredit: 0 },
      true,
    );
    expect(db.player('zubair').balance).toBe(-100);
  });

  it('refuses credit that does not match, an unknown method and a discount with no reason', () => {
    const db = make({ scenario: 'checkout' });
    const by = actor(db);
    const mismatch = refusal(() =>
      checkout(
        db,
        by,
        'bilal',
        { playerId: 'bilal', parts: [{ method: 'cash', amount: 1000 }], toCredit: 100 },
        true,
      ),
    );
    expect([mismatch.status, mismatch.body.code]).toEqual([400, 'BILL_MISMATCH']);
    expect(
      refusal(() =>
        checkout(
          db,
          by,
          'bilal',
          { playerId: 'bilal', parts: [{ method: 'barter', amount: 1000 }], toCredit: 350 },
          true,
        ),
      ).body.code,
    ).toBe('VALIDATION');
    const noReason = refusal(() =>
      checkout(
        db,
        by,
        'bilal',
        { playerId: 'bilal', parts: [], toCredit: 1300, discount: { amount: 50, reason: '' } },
        true,
      ),
    );
    expect(noReason.body.code).toBe('VALIDATION');
    expect(db.player('bilal').balance).toBe(1350); // nothing changed
  });
});

describe('canteen', () => {
  it('hides the buying price from the counter', () => {
    const items = counterCanteenItems(make());
    expect(items).toHaveLength(12);
    expect(JSON.stringify(items)).not.toContain('"buy"');
    expect(items.find((i) => i.id === 'tea')).toMatchObject({ sell: 50, stock: null });
  });

  it('adds a sale to a player’s bill and takes it out of stock (screen 28)', () => {
    const db = make();
    const sale = canteenSale(db, actor(db), {
      playerId: 'usman-t',
      items: [
        { itemId: 'cold-drink', qty: 2 },
        { itemId: 'chips', qty: 1 },
      ],
    });
    expect(sale).toMatchObject({ total: 300, doneBy: { name: 'Zain' } });
    expect(db.s.canteenItems.find((i) => i.id === 'cold-drink')?.stock).toBe(22);
    expect(waitingBills(db).find((b) => b.playerId === 'usman-t')).toMatchObject({ tonight: 300 });
    expect(db.tonightLines('usman-t').map((l) => l.text)).toEqual([
      'Cold drink × 2, canteen',
      'Chips, canteen',
    ]);
  });

  it('warns the owners when an item runs low, and refuses what is sold out', () => {
    const db = make();
    const by = actor(db);
    canteenSale(db, by, {
      playerId: null,
      payNow: 'cash',
      items: [{ itemId: 'cold-drink', qty: 19 }],
    });
    expect(db.s.notifications[0]).toMatchObject({
      kind: 'low-stock',
      title: 'Cold drink running low',
      text: '5 left.',
      read: false,
    });
    // Chips were already low (3 left): selling the rest sells them out.
    canteenSale(db, by, { playerId: null, payNow: 'cash', items: [{ itemId: 'chips', qty: 3 }] });
    expect(
      refusal(() =>
        canteenSale(db, by, {
          playerId: null,
          payNow: 'cash',
          items: [{ itemId: 'chips', qty: 1 }],
        }),
      ).body.message,
    ).toBe('Chips is sold out.');
    expect(
      refusal(() =>
        canteenSale(db, by, {
          playerId: null,
          payNow: 'cash',
          items: [{ itemId: 'cig-pack', qty: 1 }],
        }),
      ).body.code,
    ).toBe('OUT_OF_STOCK');
    expect(
      refusal(() =>
        canteenSale(db, by, {
          playerId: null,
          payNow: 'cash',
          items: [{ itemId: 'energy', qty: 9 }],
        }),
      ).body.message,
    ).toBe('Only 8 Energy drink left.');
  });

  it('a cash sale with no name is paid now and goes in the drawer (Q10)', () => {
    const db = make();
    const before = db.s.today.cashReceived;
    canteenSale(db, actor(db), {
      playerId: null,
      payNow: 'cash',
      items: [{ itemId: 'tea', qty: 2 }],
    });
    expect(db.s.today.cashReceived).toBe(before + 100);
    expect(
      refusal(() =>
        canteenSale(db, actor(db), { playerId: null, items: [{ itemId: 'tea', qty: 1 }] }),
      ).status,
    ).toBe(400);
  });
});

describe('drawer cash and today’s totals', () => {
  it('shows what screen 31 shows: Rs 17,950 in the drawer after Rs 500 of expenses', () => {
    const totals = todayTotals(make());
    expect(totals).toMatchObject({
      cashReceived: 18450,
      drawerExpenses: 500,
      drawerExpected: 17950,
      received: 27050,
      frames: 62,
      centuryMinutes: 214,
      newCredit: 2350,
      oldCreditPaid: 1800,
      online: { bank: 3200, easypaisa: 4100, jazzcash: 1300 },
    });
    expect(totals.lastDrawerExpense).toMatchObject({
      what: 'Dinner for staff',
      amount: 500,
      doneBy: { name: 'Zain' },
    });
  });

  it('an expense from the drawer comes off what the drawer should have, with Zain’s name', () => {
    const db = make();
    const result = drawerExpense(db, actor(db), {
      category: 'food-petrol',
      amount: 500,
      note: 'Dinner for staff',
    });
    expect(result.expectedDrawerCash).toBe(17450);
    expect(result.expense).toMatchObject({
      paidFrom: 'drawer',
      source: 'counter',
      doneBy: { name: 'Zain' },
      sheetId: 's48',
    });
    expect(todayTotals(db).drawerExpected).toBe(17450);
    expect(db.s.activity[0]).toMatchObject({
      type: 'drawer-expense',
      by: { name: 'Zain' },
      amount: -500,
    });
    expect(db.s.expenses[0].id).toBe(result.expense.id);
  });

  it('needs a note, a whole amount, and one of the counter’s own categories', () => {
    const db = make();
    const by = actor(db);
    expect(
      refusal(() => drawerExpense(db, by, { category: 'other', amount: 500, note: ' ' })).body.code,
    ).toBe('NOTE_REQUIRED');
    expect(
      refusal(() => drawerExpense(db, by, { category: 'other', amount: 0, note: 'x' })).status,
    ).toBe(400);
    expect(
      refusal(() => drawerExpense(db, by, { category: 'rent', amount: 500, note: 'x' })).status,
    ).toBe(400);
  });
});

describe('closing the sheet', () => {
  it('previews screen 32: expected 21,750, online money, who is left, what is still running', () => {
    const db = make({ scenario: 'closing' });
    const preview = closePreview(db, actor(db));
    expect(preview.cash).toEqual({ received: 22250, drawerExpenses: 500, expected: 21750 });
    expect(preview.online).toEqual({ bank: 4400, easypaisa: 5350, jazzcash: 1300 });
    expect(preview.leftWithoutCheckout).toEqual([
      { playerId: 'waqas', name: 'Waqas Butt', amount: 450 },
      { playerId: 'shoaib', name: 'Shoaib Malik', amount: 250 },
    ]);
    expect(preview.running).toEqual([
      {
        gameId: 'g-t2-c',
        tableId: 't2',
        tableName: 'Table 2',
        type: 'century',
        underPlayerId: 'ahmed-nawaz',
        minutes: 18,
      },
    ]);
    expect(preview.summary).toMatchObject({
      frames: 81,
      centuryMinutes: 276,
      roomMinutes: 250,
      received: 33300,
      newCredit: 3650,
    });
    expect(preview.summary.discounts).toEqual({ count: 2, total: 150 });
    expect(preview.closingBy.name).toBe('Shabir');
  });

  it('needs a note when the cash is short, then closes: sheet 49 opens, the Century moves (screen 33)', () => {
    const db = make({ scenario: 'closing' });
    const by = actor(db);
    const error = refusal(() => closeSheet(db, by, { counted: 21550 }));
    expect([error.status, error.body.code]).toEqual([400, 'NOTE_REQUIRED']);
    expect(db.s.currentSheetId).toBe('s48');

    const seen: LiveEventName[] = [];
    eventBus.on('*', (name) => seen.push(name));
    const result = closeSheet(db, by, {
      counted: 21550,
      note: 'Gave Rs 200 change from the drawer for a bank payment',
    });
    expect(result.closed).toMatchObject({ id: 's48', number: 48, closedBy: { name: 'Shabir' } });
    expect(result.newSheet).toMatchObject({ id: 's49', number: 49, openedBy: { name: 'Shabir' } });
    expect(result.moved).toEqual([
      {
        gameId: 'g-t2-c',
        tableId: 't2',
        tableName: 'Table 2',
        type: 'century',
        underPlayerId: 'ahmed-nawaz',
      },
    ]);
    expect(result.leftWithoutCheckout.map((l) => [l.name, l.amount])).toEqual([
      ['Waqas Butt', 450],
      ['Shoaib Malik', 250],
    ]);
    expect(result.cash).toMatchObject({ expected: 21750, counted: 21550, difference: -200 });
    expect(seen).toContain('sheet.closed');

    expect(db.sheet('s48')).toMatchObject({
      earned: 35150,
      received: 33300,
      closedBy: { name: 'Shabir' },
    });
    expect(db.game('g-t2-c').sheetId).toBe('s49');
    expect(db.s.today.cashReceived).toBe(0);
    expect(todayTotals(db).sheet.id).toBe('s49');
    expect(waitingBills(db)).toEqual([]);
    expect(db.statement('waqas').at(-1)).toMatchObject({
      kind: 'left-without-checkout',
      doneBy: { name: 'Shabir' },
    });
    expect(statementBalance(db.statement('waqas'))).toBe(db.player('waqas').balance);
    // Owners are told, with the names.
    expect(db.s.activity.slice(0, 2).map((a) => [a.type, a.title, a.amount])).toEqual([
      ['cash-difference', 'Cash short when sheet 48 closed', -200],
      ['left-without-checkout', 'Left without checkout: Waqas Butt, Shoaib Malik', 700],
    ]);
    expect(db.s.notifications.slice(0, 2).map((n) => n.title)).toEqual([
      'Sheet 48 closed by Shabir',
      'Left without checkout',
    ]);
    expect(db.s.notifications[0].text).toBe(
      'Earned Rs 35,150. Cash counted Rs 21,550, Rs 200 short.',
    );
    expect(db.s.notifications[1].text).toBe(
      'Waqas Butt Rs 450 and Shoaib Malik Rs 250 moved to their credit.',
    );
  });

  it('closes with no note when the cash is exact', () => {
    const db = make({ scenario: 'closing' });
    const differences = () => db.s.activity.filter((a) => a.type === 'cash-difference').length;
    const before = differences(); // the seed already holds the 3:40 AM one
    const result = closeSheet(db, actor(db), { counted: 21750 });
    expect(result.cash.difference).toBe(0);
    expect(differences()).toBe(before);
  });
});
