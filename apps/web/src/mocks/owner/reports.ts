import type {
  BoardResponse,
  Dashboard,
  NotificationList,
  Reports,
  ReportsQuery,
} from '@stockers/shared';
import { isOver30, elapsed, sheetProfit, sheetReceived, toClubIso } from '@stockers/shared';
import { board, unreadCount } from '../db/board';
import type { MockDb } from '../db/db';

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/** Frames that have run past 30 minutes right now (the red card), not Century or rooms. */
function framesOver30(db: MockDb): number {
  return db.s.games.filter(
    (game) =>
      (game.status === 'running' || game.status === 'paused') &&
      (game.type === 'single' || game.type === 'double') &&
      isOver30(elapsed(game.startedAt, db.now(), game.pausedMs, game.pausedAt)),
  ).length;
}

/**
 * `GET /dashboard` (screens 36, 53). The big numbers are the seed's `aggregates`, moved by what has
 * been written in this session; tables in use and red cards are counted live.
 */
export function dashboard(db: MockDb): Dashboard {
  const { aggregates: agg, today, deltas } = db.s;
  const priced = db.s.tables.filter((t) => t.price !== null);
  const month = agg.october;
  const earned = month.earned + deltas.earned;
  const expenses = month.expenses + deltas.expenses;
  const canteenCost = month.canteenCost + deltas.canteenCost;
  const onlineTotal = sum(Object.values(today.online));

  return {
    at: db.nowIso(),
    today: {
      earned: today.earned,
      frames: today.frames,
      centuryMinutes: today.centuryMinutes,
      rooms: today.rooms,
      received: sheetReceived({ cash: today.cashReceived, online: today.online }),
      cashReceived: today.cashReceived,
      online: onlineTotal,
      onlineByMethod: { ...today.online },
      newCredit: today.newCredit,
      oldCreditPaid: today.oldCreditPaid,
      expensesPaidToday: today.expensesPaidToday,
      moneyInHand: today.moneyInHand,
      tablesInUse: priced.filter((t) => db.activeGameOn(t.id)).length,
      tablesTotal: priced.length,
      over30: framesOver30(db),
      drawerExpenses: today.drawerExpenses,
      drawerExpected: today.cashReceived - today.drawerExpenses,
    },
    month: {
      key: toClubIso(db.now()).slice(0, 7),
      days: month.days,
      earned,
      expenses,
      canteenCost,
      profit: sheetProfit({ earned, expenses, canteenCost }),
      vsLastMonthPct: month.vsSeptemberFirst3DaysPct,
      byGame: { ...month.byGame },
    },
    credit: {
      total: agg.credit.total + deltas.creditOwed,
      players: agg.credit.players,
      olderThan15Days: { ...agg.credit.olderThan15Days },
      advanceHeld: agg.credit.advanceHeld + deltas.advanceHeld,
    },
    earnedPerDay: { ...agg.earnedPerDayLast30, values: [...agg.earnedPerDayLast30.values] },
    busyHours: { ...agg.busyHours },
    topPlayers: [...db.s.players]
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5)
      .map((p) => ({ playerId: p.id, name: p.name, spent: p.spent })),
    topDebtors: db.s.players
      .filter((p) => p.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5)
      .map((p) => ({
        playerId: p.id,
        name: p.name,
        balance: p.balance,
        ...(p.oldestUnpaidAt ? { oldestUnpaidAt: p.oldestUnpaidAt } : {}),
      })),
    unread: unreadCount(db),
  };
}

/**
 * `GET /reports` (screen 37). The seed holds one comparison, September against August 2026, and it
 * is what every request gets; the answer says which months it is for.
 */
export function reports(db: MockDb, query: ReportsQuery): Reports {
  const r = db.s.aggregates.reports;
  return {
    period: query.period ?? 'month',
    month: r.month,
    compare: r.compare,
    earned: r.earned,
    expenses: r.expenses,
    canteenCost: r.canteenCost,
    profit: r.profit,
    creditPendingAtEnd: r.creditPendingAtEnd,
    byGame: r.byGame,
    byTable: r.byTable,
    byMethod: r.byMethod,
    year: r.year2026,
  };
}

/** The owners' read-only live board: every table, no tabs. */
export function live(db: MockDb): BoardResponse {
  return board(db, 'all');
}

export function notifications(db: MockDb): NotificationList {
  const now = db.now();
  return {
    notifications: db.s.notifications.filter((n) => Date.parse(n.at) <= now),
    unread: unreadCount(db),
  };
}

export function readAllNotifications(db: MockDb): NotificationList {
  db.s.notifications.forEach((n) => {
    n.read = true;
  });
  return notifications(db);
}
