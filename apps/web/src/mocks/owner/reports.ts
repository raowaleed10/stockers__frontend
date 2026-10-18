import type {
  BoardResponse,
  Dashboard,
  NeedsLook,
  Reports,
  ReportsQuery,
  Rs,
} from '@stockers/shared';
import { elapsed, isGameOverLimit, sheetProfit, sheetReceived, toClubIso } from '@stockers/shared';
import { ownerNotifications, ownerUnread, readAllOwnerNotifications } from '../db/alerts';
import { board, sheetSummary } from '../db/board';
import type { MockDb } from '../db/db';
import { fail } from '../db/errors';

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/** Games that have run past their own time limit right now (the red card), not Century or rooms. */
function gamesOverLimit(db: MockDb): number {
  return db.s.games.filter(
    (game) =>
      (game.status === 'running' || game.status === 'paused') &&
      isGameOverLimit(game, elapsed(game.startedAt, db.now(), game.pausedMs, game.pausedAt)),
  ).length;
}

/**
 * The dashboard's "Needs a look" (screens 36, 53), as data: the frames charged double and discarded on the open sheet, the
 * discounts so far, and the canteen items that are low or sold out. Each screen writes its own words. A dispute is not here:
 * it waits in Activity, and screen 36 draws none.
 */
function needsLook(db: MockDb): NeedsLook[] {
  const opened = Date.parse(db.currentSheet.openedAt);
  const now = db.now();
  const events = db.s.activity.filter((event) => {
    const at = Date.parse(event.at);
    return at >= opened && at <= now;
  });
  const refOf = (tableId: string | undefined) => {
    const table = tableId ? db.s.tables.find((t) => t.id === tableId) : undefined;
    return table ? { kind: table.kind, number: table.number } : undefined;
  };
  const list: NeedsLook[] = [];

  const doubles = events.filter((event) => event.type === 'double-charge');
  const lastDouble = doubles[0];
  const doubleTable = refOf(lastDouble?.facts?.tableId);
  if (lastDouble && doubleTable) {
    list.push({
      kind: 'double',
      tone: 'red',
      count: doubles.length,
      table: doubleTable,
      minutes: lastDouble.facts?.minutes ?? 0,
    });
  }

  const { count, total } = db.s.today.discounts;
  if (count > 0) list.push({ kind: 'discounts', tone: 'amber', count, total });

  const items = db.s.canteenItems.filter((item) => item.stock !== null);
  const low = items
    .filter((item) => (item.stock ?? 0) > 0 && (item.stock ?? 0) <= item.lowAt)
    .map((item) => ({ name: item.name, left: item.stock ?? 0 }));
  const soldOut = items.filter((item) => item.stock === 0).map((item) => item.plural ?? item.name);
  if (low.length > 0 || soldOut.length > 0) {
    list.push({ kind: 'stock', tone: 'amber', low, soldOut });
  }

  const discards = events.filter((event) => event.type === 'discard');
  const lastDiscard = discards[0];
  const discardTable = refOf(lastDiscard?.facts?.tableId);
  if (lastDiscard && discardTable) {
    list.push({
      kind: 'discard',
      tone: 'grey',
      count: discards.length,
      table: discardTable,
      ...(lastDiscard.facts?.reason ? { reason: lastDiscard.facts.reason } : {}),
    });
  }
  return list;
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
    sheet: sheetSummary(db),
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
      overLimit: gamesOverLimit(db),
      limitMinutes: db.s.settings.rules.doubleAfterMin,
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
    topPlayers: agg.topPlayers30.map(({ playerId, visits, spent }) => ({
      playerId,
      name: db.player(playerId).name,
      visits,
      spent,
    })),
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
    unread: ownerUnread(db),
    needsLook: needsLook(db),
  };
}

// Reports -----------------------------------------------------------------------------------------

const pad2 = (n: number) => String(n).padStart(2, '0');

/** `2026-09` for the month before `2026-10`, and so on across a year. */
function previousMonth(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return month === 1 ? `${year - 1}-12` : `${year}-${pad2(month - 1)}`;
}

/** What the seed knows a month earned: 2026 is in the report, 2025 is mock-only. */
function monthEarned(db: MockDb, key: string): Rs | undefined {
  const { year2026, year2025 } = db.s.aggregates.reports;
  const [year, month] = key.split('-');
  const table = year === '2026' ? year2026 : year === '2025' ? year2025 : undefined;
  return table?.[month];
}

const roundTo = (value: number, factor: number): Rs => Math.round(value * factor);
const scalePair = (pair: [Rs, Rs], shown: number, compared: number): [Rs, Rs] => [
  roundTo(pair[0], shown),
  roundTo(pair[1], compared),
];

/**
 * `GET /reports` (screen 37). The seed holds one detailed comparison, September against August 2026. Any other pair of
 * months, two days or two years is the same report with every figure scaled by what the seed does know each period earned,
 * so every picker works in the demo (the backend gives real numbers). Asking for the pair the seed holds gives it exactly.
 */
export function reports(db: MockDb, query: ReportsQuery): Reports {
  const base = db.s.aggregates.reports;
  const period = query.period ?? 'month';

  // The periods each picker offers, newest first, and how much each earned.
  let periods: string[];
  let earnedOf: (key: string) => Rs | undefined;
  let defaultShow: string;
  let defaultCompare: (show: string) => string;
  if (period === 'year') {
    periods = ['2026', '2025'];
    earnedOf = (key) => {
      const table = key === '2026' ? base.year2026 : key === '2025' ? base.year2025 : undefined;
      return table ? sum(Object.values(table)) : undefined;
    };
    defaultShow = '2026';
    defaultCompare = (show) => String(Number(show) - 1);
  } else if (period === 'day') {
    const sheets = [...db.s.sheets].sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt));
    const dayOf = (iso: string) => toClubIso(Date.parse(iso)).slice(0, 10);
    periods = sheets.map((sheet) => dayOf(sheet.openedAt));
    earnedOf = (key) => {
      const sheet = sheets.find((s) => dayOf(s.openedAt) === key);
      if (!sheet) return undefined;
      return sheet.id === db.s.currentSheetId ? db.s.today.earned : sheet.earned;
    };
    defaultShow = periods[0] ?? '';
    defaultCompare = (show) => periods[periods.indexOf(show) + 1] ?? periods[0] ?? show;
  } else {
    // `Object.keys` puts the number-like keys ("10") before the others ("01"), so the months are sorted first.
    const months = (year: string, table: Record<string, number>) =>
      Object.keys(table)
        .sort()
        .map((m) => `${year}-${m}`)
        .reverse();
    periods = [...months('2026', base.year2026), ...months('2025', base.year2025)];
    earnedOf = (key) => monthEarned(db, key);
    defaultShow = base.month;
    defaultCompare = (show) => previousMonth(show);
  }

  const show = query.month ?? defaultShow;
  const compare = query.compare ?? defaultCompare(show);
  const shownEarned = earnedOf(show);
  const comparedEarned = earnedOf(compare);
  if (shownEarned === undefined || comparedEarned === undefined) {
    fail('NOT_FOUND', 'There is no report for that period.');
  }

  const f = shownEarned / base.earned[0];
  const g = comparedEarned / base.earned[1];
  const earned: [Rs, Rs] = [shownEarned, comparedEarned];
  const expenses = scalePair(base.expenses, f, g);
  const canteenCost = scalePair(base.canteenCost, f, g);
  const profit: [Rs, Rs] = [
    earned[0] - expenses[0] - canteenCost[0],
    earned[1] - expenses[1] - canteenCost[1],
  ];
  const mapPairs = (pairs: Record<string, [Rs, Rs]>) =>
    Object.fromEntries(Object.entries(pairs).map(([k, pair]) => [k, scalePair(pair, f, g)]));

  // The running totals: a month day by day, a year month by month, nothing for a single day.
  let race: Reports['race'] = { shown: [], compared: [] };
  if (period === 'month') {
    const exact = (key: string, series: Rs[], total: Rs) =>
      series.length > 0 && key !== ''
        ? series.map((value) => roundTo(value, total / series.at(-1)!))
        : [];
    race = {
      shown: exact(show, base.race.shown, shownEarned),
      compared: exact(compare, base.race.compared, comparedEarned),
    };
  } else if (period === 'year') {
    const running = (table: Record<string, Rs>) => {
      let total = 0;
      return Object.keys(table)
        .sort()
        .map((m) => (total += table[m]));
    };
    race = {
      shown: running(show === '2026' ? base.year2026 : base.year2025),
      compared: running(compare === '2026' ? base.year2026 : base.year2025),
    };
  }

  const isBase = period === 'month' && show === base.month;
  const yearKey = show.slice(0, 4);
  return {
    period,
    month: show,
    compare,
    earned,
    expenses,
    canteenCost,
    profit,
    creditPendingAtEnd: roundTo(base.creditPendingAtEnd, f),
    byGame: mapPairs(base.byGame),
    byTable: Object.entries(base.byTable)
      .map(([id, value]) => {
        const table = db.table(id);
        return { table: { kind: table.kind, number: table.number }, earned: roundTo(value, f) };
      })
      .sort((a, b) => b.earned - a.earned),
    byMethod: Object.entries(mapPairs(base.byMethod)).map(([id, amounts]) => ({
      id,
      name: db.methodName(id),
      amounts,
    })),
    year: { ...(yearKey === '2025' ? base.year2025 : base.year2026) },
    periods,
    race,
    closedTables: isBase
      ? base.closedTables.map((item) => {
          const table = db.table(item.tableId);
          return {
            table: { kind: table.kind, number: table.number },
            days: item.days,
            ...(item.note ? { note: item.note } : {}),
          };
        })
      : [],
  };
}

/** A stand-in for the PDF and Excel of a report (D36); the backend makes the real files. */
export function exportReportFile(db: MockDb, query: ReportsQuery, format: 'pdf' | 'xlsx') {
  const report = reports(db, query);
  return {
    content: `Report ${report.period} ${report.month} against ${report.compare} (${format}). This is a stand-in file from the mock server.\n`,
    type: 'text/plain; charset=utf-8',
    name: `report-${report.month}.${format}.txt`,
  };
}

/** The owners' read-only live board: every table, no tabs. */
export function live(db: MockDb): BoardResponse {
  return board(db, 'all');
}

export const notifications = ownerNotifications;
export const readAllNotifications = readAllOwnerNotifications;
