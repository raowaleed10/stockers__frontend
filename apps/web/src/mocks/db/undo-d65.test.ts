import { beforeEach, describe, expect, it } from 'vitest';
import { eventBus } from '@/lib/events';
import { requireWorker } from './auth';
import { waitingBills } from './board';
import { canteenSale, undoCanteenSale } from './canteen';
import type { MockDb } from './db';
import { MockApiError } from './errors';
import { correctEnd, endCentury, endGame, endRoom, startGame, startRoom, undoEnd } from './games';
import { createDb, type CreateDbOptions } from './load';
import { seed } from './seed';
import { drawerExpense, todayTotals, undoDrawerExpense } from './sheet';
import { undoableActions } from './undoable';

/**
 * The answers of 17 Oct 2026 (D65): Undo after a double, a game, a Century or a room; Undo after a canteen sale and after
 * cash from the drawer; every counter expense chip is its own category; the price of a room's hour.
 */
const at = (iso: string) => Date.parse(iso);
const NIGHT = at('2026-10-03T21:42:00+05:00');

let clock = NIGHT;
const make = (options: Partial<CreateDbOptions> = {}): MockDb => {
  clock = NIGHT;
  return createDb(seed, { app: 'counter', now: () => clock, ...options });
};
const actor = (db: MockDb) => requireWorker(db).by;
const shabir = { id: 'shabir', name: 'Shabir', role: 'worker' as const };

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

describe('Undo after a double, a game, a Century or a room (D65)', () => {
  it('a double frame is offered with the names of the side that was charged, and Undo opens the correction', () => {
    const db = make();
    clock = at('2026-10-03T21:47:00+05:00');
    const by = actor(db);
    endGame(db, by, 'g-t5-d', { loserIds: ['imran', 'naveed'] });
    expect(undoableActions(db, by).charge).toMatchObject({
      gameId: 'g-t5-d',
      type: 'double',
      names: ['Imran Shah', 'Naveed Akhtar'],
      amount: 400,
    });
    expect(undoableActions(db, shabir).charge).toBeNull();
    clock += 30_000;
    const game = undoEnd(db, by, 'g-t5-d');
    expect(game.correction).toBeDefined();
    // Nothing has changed yet; the other side can be charged instead.
    expect(db.tonightLines('imran').some((l) => l.kind === 'double')).toBe(true);
    correctEnd(db, by, 'g-t5-d', { loserIds: ['kamran', 'faisal'] });
    expect(db.tonightLines('imran').some((l) => l.kind === 'double')).toBe(false);
    expect(db.tonightLines('kamran').some((l) => l.kind === 'double')).toBe(true);
  });

  it('a Century that was ended comes back running where it stopped, with the charge, minutes and totals taken back', () => {
    const db = make();
    const by = actor(db);
    clock = at('2026-10-03T21:47:30+05:00'); // 42 min 35 s
    const before = {
      saad: { ...db.player('saad') },
      today: { ...db.s.today },
      earned: db.s.deltas.earned,
      lines: db.statement('saad').length,
    };
    endCentury(db, by, 'g-t3-c');
    expect(undoableActions(db, by).charge).toMatchObject({
      gameId: 'g-t3-c',
      type: 'century',
      names: ['Saad Hussain'],
      amount: 630,
    });
    clock += 40_000;
    const game = undoEnd(db, by, 'g-t3-c');
    expect(game.status).toBe('running');
    expect(game.endedAt).toBeUndefined();
    expect(game.result).toBeUndefined();
    expect(db.activeGameOn('t3')?.id).toBe('g-t3-c');
    expect(db.player('saad')).toMatchObject({
      centuryMinutes: before.saad.centuryMinutes,
      spent: before.saad.spent,
      balance: before.saad.balance,
    });
    expect(db.statement('saad')).toHaveLength(before.lines);
    expect(db.s.today).toMatchObject({
      centuryMinutes: before.today.centuryMinutes,
      centuryGames: before.today.centuryGames,
      earned: before.today.earned,
    });
    expect(db.s.deltas.earned).toBe(before.earned);
    // The 40 seconds it was ended do not count: it is still 42 minutes, and ending it again charges Rs 630.
    expect(endCentury(db, by, 'g-t3-c')).toMatchObject({ amount: 630, minutes: 42 });
    expect(db.s.activity.find((a) => a.title === 'Century undone on Table 3')).toMatchObject({
      type: 'undo',
      by: { name: 'Zain' },
    });
  });

  it('a room that was ended comes back running, with its minutes and totals taken back', () => {
    const db = make();
    const by = actor(db);
    clock = at('2026-10-03T22:09:55+05:00'); // 1 h 40 min
    const { rooms, roomMinutes } = db.s.today;
    endRoom(db, by, 'g-r1');
    expect(undoableActions(db, by).charge).toMatchObject({ type: 'room', amount: 2500 });
    clock += 25_000;
    undoEnd(db, by, 'g-r1');
    expect(db.activeGameOn('r1')?.id).toBe('g-r1');
    expect(db.s.today.rooms).toBe(rooms);
    expect(db.s.today.roomMinutes).toBe(roomMinutes);
    expect(db.tonightLines('ali-hassan').some((l) => l.kind === 'room')).toBe(false);
    expect(endRoom(db, by, 'g-r1')).toMatchObject({ amount: 2500, minutes: 100 });
  });

  it('refuses another worker, a table that is in use again, and anything after 2 minutes', () => {
    const db = make();
    const by = actor(db);
    clock = at('2026-10-03T21:47:30+05:00');
    endCentury(db, by, 'g-t3-c');
    expect(refusal(() => undoEnd(db, shabir, 'g-t3-c')).body.code).toBe('NOT_ALLOWED');
    startGame(db, by, { tableId: 't3', type: 'single', playerIds: ['saad', 'imran'] });
    expect(refusal(() => undoEnd(db, by, 'g-t3-c')).body.code).toBe('TABLE_BUSY');

    const late = make();
    clock = at('2026-10-03T21:47:30+05:00');
    endCentury(late, actor(late), 'g-t3-c');
    clock += 2 * 60_000 + 1000;
    expect(undoableActions(late, actor(late)).charge).toBeNull();
    expect(refusal(() => undoEnd(late, actor(late), 'g-t3-c')).body.code).toBe('UNDO_EXPIRED');
  });
});

describe('Undo after a canteen sale and after cash from the drawer (D65)', () => {
  it('a sale on a bill: the items are back in stock, the lines and totals go back, and Activity says so', () => {
    const db = make();
    const by = actor(db);
    const before = {
      stock: db.s.canteenItems.find((i) => i.id === 'cold-drink')?.stock,
      sales: db.s.today.canteenSales,
      earned: db.s.today.earned,
      deltas: { ...db.s.deltas },
      lines: db.statement('usman-t').length,
    };
    const sale = canteenSale(db, by, {
      playerId: 'usman-t',
      items: [
        { itemId: 'cold-drink', qty: 2 },
        { itemId: 'chips', qty: 1 },
      ],
    });
    expect(undoableActions(db, by).sale).toEqual({
      saleId: sale.id,
      at: db.nowIso(),
      total: 300,
      playerName: 'Usman Tariq',
    });
    expect(undoableActions(db, shabir).sale).toBeNull();
    clock += 30_000;
    undoCanteenSale(db, by, sale.id);
    expect(db.s.canteenItems.find((i) => i.id === 'cold-drink')?.stock).toBe(before.stock);
    expect(db.statement('usman-t')).toHaveLength(before.lines);
    expect(waitingBills(db).find((b) => b.playerId === 'usman-t')).toBeUndefined();
    expect(db.s.today.canteenSales).toBe(before.sales);
    expect(db.s.today.earned).toBe(before.earned);
    expect(db.s.deltas).toEqual(before.deltas);
    expect(db.s.canteenSales.some((s) => s.id === sale.id)).toBe(false);
    expect(undoableActions(db, by).sale).toBeNull();
    expect(db.s.activity[0]).toMatchObject({
      type: 'undo',
      title: 'Canteen sale undone',
      by: { name: 'Zain' },
      amount: 300,
    });
  });

  it('a cash sale: the money leaves the drawer or the online totals', () => {
    const db = make();
    const by = actor(db);
    const cash = db.s.today.cashReceived;
    const online = { ...db.s.today.online };
    const sale = canteenSale(db, by, {
      playerId: null,
      payNow: 'cash',
      items: [{ itemId: 'tea', qty: 2 }],
    });
    const wallet = canteenSale(db, by, {
      playerId: null,
      payNow: 'easypaisa',
      items: [{ itemId: 'tea', qty: 1 }],
    });
    expect(undoableActions(db, by).sale).toMatchObject({
      saleId: wallet.id,
      playerName: null,
      method: 'easypaisa',
    });
    undoCanteenSale(db, by, wallet.id);
    undoCanteenSale(db, by, sale.id);
    expect(db.s.today.cashReceived).toBe(cash);
    expect(db.s.today.online).toEqual(online);
  });

  it('only the worker who sold it, for 2 minutes, and not twice', () => {
    const db = make();
    const by = actor(db);
    const sale = canteenSale(db, by, {
      playerId: null,
      payNow: 'cash',
      items: [{ itemId: 'tea', qty: 1 }],
    });
    expect(refusal(() => undoCanteenSale(db, shabir, sale.id)).body.code).toBe('NOT_ALLOWED');
    clock += 2 * 60_000 + 1000;
    expect(undoableActions(db, by).sale).toBeNull();
    expect(refusal(() => undoCanteenSale(db, by, sale.id)).body.code).toBe('UNDO_EXPIRED');

    const again = make();
    const fresh = canteenSale(again, actor(again), {
      playerId: null,
      payNow: 'cash',
      items: [{ itemId: 'tea', qty: 1 }],
    });
    undoCanteenSale(again, actor(again), fresh.id);
    expect(refusal(() => undoCanteenSale(again, actor(again), fresh.id)).body.code).toBe(
      'NOT_FOUND',
    );
  });

  it('cash from the drawer: the expected cash is back, the expense is gone, and Activity keeps both lines', () => {
    const db = make();
    const by = actor(db);
    const expectedBefore = todayTotals(db).drawerExpected;
    const { expense } = drawerExpense(db, by, {
      category: 'food',
      amount: 500,
      note: 'Dinner for staff',
    });
    expect(todayTotals(db).drawerExpected).toBe(expectedBefore - 500);
    expect(undoableActions(db, by).expense).toEqual({
      expenseId: expense.id,
      at: db.nowIso(),
      amount: 500,
      what: 'Dinner for staff',
    });
    expect(undoableActions(db, shabir).expense).toBeNull();
    undoDrawerExpense(db, by, expense.id);
    expect(todayTotals(db).drawerExpected).toBe(expectedBefore);
    expect(db.s.expenses.some((e) => e.id === expense.id)).toBe(false);
    expect(db.s.activity[0]).toMatchObject({
      type: 'undo',
      title: 'Expense from the drawer undone',
      by: { name: 'Zain' },
    });
    expect(db.s.activity.some((a) => a.type === 'drawer-expense')).toBe(true);
    expect(refusal(() => undoDrawerExpense(db, by, expense.id)).body.code).toBe('NOT_FOUND');
  });

  it('cash from the drawer cannot be undone by another worker, for an owner’s expense, or after 2 minutes', () => {
    const db = make();
    const by = actor(db);
    const { expense } = drawerExpense(db, by, { category: 'other', amount: 100, note: 'Tape' });
    expect(refusal(() => undoDrawerExpense(db, shabir, expense.id)).body.code).toBe('NOT_ALLOWED');
    const owners = db.s.expenses.find((e) => e.source === 'owner');
    expect(refusal(() => undoDrawerExpense(db, by, owners?.id ?? '')).body.code).toBe(
      'NOT_ALLOWED',
    );
    clock += 2 * 60_000 + 1000;
    expect(undoableActions(db, by).expense).toBeNull();
    expect(refusal(() => undoDrawerExpense(db, by, expense.id)).body.code).toBe('UNDO_EXPIRED');
  });

  it('every counter chip is its own category; the old merged one is refused', () => {
    const db = make();
    const by = actor(db);
    for (const category of [
      'food',
      'petrol',
      'tea-milk',
      'cleaning',
      'repairs',
      'other',
    ] as const) {
      drawerExpense(db, by, { category, amount: 100, note: category });
      expect(db.s.expenses[0]).toMatchObject({
        category,
        paidFrom: 'drawer',
        doneBy: { name: 'Zain' },
      });
    }
    for (const category of ['food-petrol', 'staff', 'bills', 'rent']) {
      const error = refusal(() =>
        drawerExpense(db, by, { category: category as never, amount: 100, note: 'x' }),
      );
      expect(error.body.code, category).toBe('VALIDATION');
    }
  });
});

describe('the price of a room’s hour (D65)', () => {
  it('is a whole number of rupees from Rs 100 to Rs 10,000', () => {
    for (const hourly of [100, 1500, 10_000]) {
      const db = make();
      expect(startRoom(db, actor(db), 'r2', { underPlayerId: 'saad', hourly }).price).toBe(hourly);
    }
    for (const hourly of [0, 99, 10_001, -1500, 1500.5, Number.NaN]) {
      const db = make();
      const error = refusal(() =>
        startRoom(db, actor(db), 'r2', { underPlayerId: 'saad', hourly }),
      );
      expect(error.body.code, String(hourly)).toBe('VALIDATION');
      expect(db.activeGameOn('r2')).toBeUndefined();
    }
  });
});
