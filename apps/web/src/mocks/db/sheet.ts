import type {
  ClosePreview,
  CloseSheetRequest,
  CloseSheetResult,
  DrawerExpenseRequest,
  DrawerExpenseResult,
  Expense,
  ExpenseCategory,
  PersonRef,
  Sheet,
  TodayTotals,
  UndoableExpense,
} from '@stockers/shared';
import {
  canUndo,
  closeNoteRequired,
  drawerDifference,
  elapsed,
  expectedDrawerCash,
  formatRs,
  MINUTE_MS,
  planClose,
  sheetEarned,
  sheetReceived,
} from '@stockers/shared';
import { sheetSummary, waitingBills } from './board';
import type { MockDb } from './db';
import { fail } from './errors';
import type { TodayState } from './state';

/**
 * What the counter lets a worker take from the drawer (screen 29), and the words the owners see. Every chip of the counter is
 * its own category on the owner side (D65).
 */
const DRAWER_CATEGORIES: Partial<Record<ExpenseCategory, string>> = {
  food: 'food',
  petrol: 'petrol',
  'tea-milk': 'tea and milk',
  cleaning: 'cleaning',
  repairs: 'repairs',
  other: 'other',
};

const expected = (today: TodayState) =>
  expectedDrawerCash({ cashReceived: today.cashReceived, drawerExpenses: today.drawerExpenses });

/** `GET /today` (screen 31). */
export function todayTotals(db: MockDb): TodayTotals {
  const { today } = db.s;
  const waiting = waitingBills(db);
  const last = db.s.expenses.find(
    (e) => e.paidFrom === 'drawer' && e.sheetId === db.s.currentSheetId,
  );
  return {
    sheet: sheetSummary(db),
    cashReceived: today.cashReceived,
    drawerExpenses: today.drawerExpenses,
    drawerExpected: expected(today),
    online: { ...today.online },
    methods: db.s.paymentMethods.filter((method) => method.enabled),
    received: sheetReceived({ cash: today.cashReceived, online: today.online }),
    frames: today.frames,
    doubles: today.doubles,
    centuryMinutes: today.centuryMinutes,
    centuryGames: today.centuryGames,
    newCredit: today.newCredit,
    newCreditPlayers: today.newCreditPlayers,
    oldCreditPaid: today.oldCreditPaid,
    oldCreditPlayers: today.oldCreditPlayers,
    waiting: { count: waiting.length, total: waiting.reduce((sum, bill) => sum + bill.total, 0) },
    ...(last
      ? {
          lastDrawerExpense: {
            what: last.what,
            amount: last.amount,
            at: last.at,
            doneBy: last.doneBy,
          },
        }
      : {}),
  };
}

/** A worker takes cash from the drawer. It comes off the cash the drawer should have (D53). */
export function drawerExpense(
  db: MockDb,
  by: PersonRef,
  request: DrawerExpenseRequest,
): DrawerExpenseResult {
  const label = DRAWER_CATEGORIES[request.category];
  if (!label) fail('VALIDATION', 'Choose what the money was for.');
  if (!Number.isInteger(request.amount) || request.amount <= 0) {
    fail('VALIDATION', 'The amount is a whole number of rupees above 0.');
  }
  const note = request.note?.trim();
  if (!note) fail('NOTE_REQUIRED', 'Write a note.');

  const expense: Expense = {
    id: db.nextId('e'),
    at: db.nowIso(),
    what: note,
    category: request.category,
    amount: request.amount,
    paidFrom: 'drawer',
    source: 'counter',
    doneBy: by,
    sheetId: db.s.currentSheetId,
  };
  db.s.expenses.unshift(expense);
  db.s.drawerUndo.add(expense.id);
  const { today } = db.s;
  today.drawerExpenses += request.amount;
  today.expensesPaidToday += request.amount;
  today.moneyInHand -= request.amount;
  db.s.deltas.expenses += request.amount;

  db.logActivity(by, 'drawer-expense', `Expense from the drawer: ${label}`, {
    detail: `“${note}”. Taken off the cash the drawer should have.`,
    amount: -request.amount,
  });
  db.history(by, `Took ${formatRs(request.amount)} from the drawer: ${note}`, request.amount);
  db.emit('board.changed');
  return { expense, expectedDrawerCash: expected(today) };
}

function runningGames(db: MockDb) {
  return db.s.games
    .filter((g) => g.status === 'running' || g.status === 'paused')
    .map((game) => {
      const table = db.table(game.tableId);
      return {
        gameId: game.id,
        tableId: table.id,
        tableName: table.name,
        type: game.type,
        ...(game.underPlayerId ? { underPlayerId: game.underPlayerId } : {}),
        minutes: Math.floor(
          elapsed(game.startedAt, db.now(), game.pausedMs, game.pausedAt) / MINUTE_MS,
        ),
      };
    });
}

/** `GET /sheets/current/close-preview` (screen 32). */
export function closePreview(db: MockDb, by: PersonRef): ClosePreview {
  const { today } = db.s;
  const left = waitingBills(db)
    .filter((bill) => bill.tonight > 0)
    .map((bill) => ({ playerId: bill.playerId, name: bill.name, amount: bill.tonight }));
  return {
    sheet: sheetSummary(db),
    closingAt: db.nowIso(),
    closingBy: by,
    cash: {
      received: today.cashReceived,
      drawerExpenses: today.drawerExpenses,
      expected: expected(today),
    },
    online: { ...today.online },
    methods: db.s.paymentMethods.filter((method) => method.enabled),
    leftWithoutCheckout: left,
    running: runningGames(db),
    summary: {
      frames: today.frames,
      centuryMinutes: today.centuryMinutes,
      roomMinutes: today.roomMinutes,
      received: sheetReceived({ cash: today.cashReceived, online: today.online }),
      newCredit: today.newCredit,
      discounts: { ...today.discounts },
    },
  };
}

const zeroToday = (moneyInHand: number): TodayState => ({
  earned: 0,
  frames: 0,
  doubles: 0,
  centuryMinutes: 0,
  centuryGames: 0,
  rooms: 0,
  roomMinutes: 0,
  cashReceived: 0,
  online: {},
  newCredit: 0,
  newCreditPlayers: 0,
  oldCreditPaid: 0,
  oldCreditPlayers: 0,
  expensesPaidToday: 0,
  moneyInHand,
  drawerExpenses: 0,
  discounts: { count: 0, total: 0 },
  canteenSales: 0,
});

/**
 * Closes the open sheet and opens the next straight away (D32). Games still going move to the new
 * sheet (Q5); bills not checked out move to credit as "Left without checkout" (D27). With `silent`
 * the activity and notifications are not written, because the seed already holds them.
 */
export function closeSheet(
  db: MockDb,
  by: PersonRef,
  request: CloseSheetRequest,
  options: { silent?: boolean } = {},
): CloseSheetResult {
  const preview = closePreview(db, by);
  if (!Number.isInteger(request.counted) || request.counted < 0) {
    fail('VALIDATION', 'Count the cash in the drawer.');
  }
  const difference = drawerDifference(request.counted, preview.cash.expected);
  const note = request.note?.trim();
  if (closeNoteRequired(difference) && !note) {
    fail('NOTE_REQUIRED', 'Write a note about the difference. The owners will see it.');
  }

  const bills = waitingBills(db).map((bill) => ({
    playerId: bill.playerId,
    tonight: bill.tonight,
  }));
  const plan = planClose({ games: db.s.games, bills });
  const closed: Sheet = db.currentSheet;
  const { today } = db.s;

  // Close the old sheet with the numbers it ended on.
  const received = sheetReceived({ cash: today.cashReceived, online: today.online });
  const earned = sheetEarned({
    received,
    newCredit: today.newCredit,
    oldCreditPaid: today.oldCreditPaid,
  });
  Object.assign(closed, {
    closedAt: db.nowIso(),
    closedBy: by,
    earned,
    received,
    newCredit: today.newCredit,
    oldCreditPaid: today.oldCreditPaid,
    discounts: { ...today.discounts },
    cash: {
      received: today.cashReceived,
      drawerExpenses: today.drawerExpenses,
      expected: preview.cash.expected,
      counted: request.counted,
      difference,
      ...(note ? { note } : {}),
    },
    online: { ...today.online },
    frames: today.frames,
    centuryMinutes: today.centuryMinutes,
    roomMinutes: today.roomMinutes,
  } satisfies Partial<Sheet>);
  db.s.sheetExtras[closed.id] ??= { canteen: { sales: today.canteenSales, items: 0, profit: 0 } };
  db.s.deltas.sheetsEarned += earned;

  // Bills not checked out move to credit and stay on the statement (D27).
  const left = plan.leftWithoutCheckout.map((bill) => {
    const player = db.player(bill.playerId);
    db.postLine(player.id, {
      kind: 'left-without-checkout',
      text: 'Left without checkout, moved to credit',
      by,
      sheetId: closed.id,
    });
    db.tonightLines(player.id).forEach((line) => db.s.unsettled.delete(line.id));
    db.s.billOrder = db.s.billOrder.filter((id) => id !== player.id);
    return { playerId: player.id, name: player.name, amount: bill.tonight };
  });

  // The next sheet opens at once, and the games still going move to it.
  const next: Sheet = {
    id: `s${closed.number + 1}`,
    number: closed.number + 1,
    openedAt: db.nowIso(),
    openedBy: by,
    earned: 0,
    received: 0,
    newCredit: 0,
    oldCreditPaid: 0,
    discounts: { count: 0, total: 0 },
    cash: { received: 0, drawerExpenses: 0, expected: 0 },
    online: {},
    frames: 0,
    centuryMinutes: 0,
    roomMinutes: 0,
  };
  db.s.sheets.push(next);
  db.s.currentSheetId = next.id;
  const moved = plan.moveGameIds.map((id) => {
    const game = db.game(id);
    game.sheetId = next.id;
    const table = db.table(game.tableId);
    return {
      gameId: game.id,
      tableId: table.id,
      tableName: table.name,
      type: game.type,
      ...(game.underPlayerId ? { underPlayerId: game.underPlayerId } : {}),
    };
  });
  db.s.today = zeroToday(today.moneyInHand);
  db.s.lastBackupAt = db.nowIso();

  db.history(
    by,
    `Closed sheet ${closed.number}: counted ${formatRs(request.counted)}`,
    request.counted,
    closed.id,
  );
  db.history(by, `Opened sheet ${next.number}`, undefined, next.id);

  if (!options.silent) {
    if (left.length > 0) {
      db.logActivity(
        by,
        'left-without-checkout',
        `Left without checkout: ${left.map((l) => l.name).join(', ')}`,
        {
          detail: 'Moved to their credit at sheet close',
          amount: plan.leftTotal,
          sheetId: closed.id,
        },
      );
      db.notify(
        'left-without-checkout',
        'Left without checkout',
        `${left.map((l) => `${l.name} ${formatRs(l.amount)}`).join(' and ')} moved to their credit.`,
        plan.leftTotal,
      );
    }
    if (difference !== 0) {
      db.logActivity(
        by,
        'cash-difference',
        `Cash ${difference < 0 ? 'short' : 'extra'} when sheet ${closed.number} closed`,
        { detail: `Note: “${note}”`, amount: difference, sheetId: closed.id },
      );
    }
    const cashText =
      difference === 0
        ? `Cash counted ${formatRs(request.counted)}.`
        : `Cash counted ${formatRs(request.counted)}, ${formatRs(Math.abs(difference))} ${difference < 0 ? 'short' : 'extra'}.`;
    db.notify(
      'sheet-closed',
      `Sheet ${closed.number} closed by ${by.name}`,
      `Earned ${formatRs(earned)}. ${cashText}`,
      earned,
    );
  }

  db.emit('sheet.closed', { sheetId: closed.id });
  db.emit('board.changed');
  const result: CloseSheetResult = {
    closed: {
      id: closed.id,
      number: closed.number,
      openedAt: closed.openedAt,
      openedBy: closed.openedBy,
      closedAt: closed.closedAt ?? db.nowIso(),
      closedBy: by,
    },
    newSheet: {
      id: next.id,
      number: next.number,
      openedAt: next.openedAt,
      openedBy: next.openedBy,
    },
    moved,
    leftWithoutCheckout: left,
    cash: {
      expected: preview.cash.expected,
      counted: request.counted,
      difference,
      ...(note ? { note } : {}),
    },
    backedUpAt: db.nowIso(),
  };
  db.s.lastClose = result;
  return result;
}

/** `GET /sheets/last-close` (screen 33): what the last close did. Nothing has been closed yet on a fresh night. */
export function lastClose(db: MockDb): CloseSheetResult {
  return db.s.lastClose ?? fail('NOT_FOUND', 'No sheet has been closed yet.');
}

/**
 * Takes cash from the drawer back (D65): the worker who took it can undo it for 2 minutes while the sheet is open. The drawer
 * should hold the amount again, and Activity keeps the first line and adds "Expense from the drawer undone" with his name.
 */
export function undoDrawerExpense(db: MockDb, by: PersonRef, id: string): UndoableExpense {
  const expense = db.s.expenses.find((e) => e.id === id);
  if (!expense) fail('NOT_FOUND', 'There is no expense to undo.');
  if (expense.source !== 'counter' || expense.paidFrom !== 'drawer') {
    fail('NOT_ALLOWED', 'Only cash taken from the drawer at the counter can be undone here.');
  }
  if (expense.doneBy.id !== by.id) {
    const name = expense.doneBy.name.split(' ')[0];
    fail('NOT_ALLOWED', `${name} took this cash, so only ${name} can undo it.`);
  }
  if (expense.sheetId !== db.s.currentSheetId || !canUndo(expense.at, db.now())) {
    fail('UNDO_EXPIRED', 'It is more than 2 minutes since the cash was taken.');
  }
  db.s.expenses = db.s.expenses.filter((e) => e.id !== id);
  db.s.drawerUndo.delete(id);
  const { today } = db.s;
  today.drawerExpenses -= expense.amount;
  today.expensesPaidToday -= expense.amount;
  today.moneyInHand += expense.amount;
  db.s.deltas.expenses -= expense.amount;
  db.logActivity(by, 'undo', 'Expense from the drawer undone', {
    detail: `“${expense.what}”. ${formatRs(expense.amount)} is back in the cash the drawer should have.`,
    amount: expense.amount,
  });
  db.history(
    by,
    `Put ${formatRs(expense.amount)} back in the drawer: ${expense.what}`,
    expense.amount,
  );
  db.emit('board.changed');
  return { expenseId: expense.id, at: expense.at, amount: expense.amount, what: expense.what };
}

/** `GET /undoable` (expenses): the cash this worker took from the drawer less than 2 minutes ago, the latest first. */
export function undoableExpense(db: MockDb, by: PersonRef): UndoableExpense | null {
  const expense = db.s.expenses
    .filter(
      (e) =>
        db.s.drawerUndo.has(e.id) &&
        e.doneBy.id === by.id &&
        e.sheetId === db.s.currentSheetId &&
        canUndo(e.at, db.now()),
    )
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0];
  return expense
    ? { expenseId: expense.id, at: expense.at, amount: expense.amount, what: expense.what }
    : null;
}
