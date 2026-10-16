import type {
  BoardCategory,
  PersonRef,
  Table,
  ClubStatus,
  BoardResponse,
  BoardTable,
  PlayerName,
  SheetSummary,
  WaitingBill,
} from '@stockers/shared';
import { billBreakdown, billParts, phoneTail, toClubIso } from '@stockers/shared';
import { counterUnread } from './alerts';
import type { MockDb } from './db';
import { fail } from './errors';

const HOUR_MS = 60 * 60_000;

export function sheetSummary(db: MockDb): SheetSummary {
  const { id, number, openedAt, openedBy } = db.currentSheet;
  return { id, number, openedAt, openedBy };
}

/** Players who still have to pay for tonight, in the order the seed lists them; new bills follow. */
export function waitingBills(db: MockDb): WaitingBill[] {
  const bills: WaitingBill[] = [];
  for (const player of db.s.players) {
    const lines = db.tonightLines(player.id);
    if (lines.length === 0) continue;
    const tonight = lines.reduce((sum, line) => sum + (line.charge ?? 0), 0);
    const bill = billBreakdown(player.balance - tonight, tonight);
    bills.push({
      playerId: player.id,
      name: player.name,
      ...(player.phone ? { phoneTail: phoneTail(player.phone) } : {}),
      parts: billParts(lines),
      tonight,
      oldCredit: bill.oldCredit,
      advance: bill.advance,
      total: bill.total,
    });
  }
  // The seed lists them in the order the screens show; new bills follow.
  const order = db.s.billOrder;
  return bills.sort((a, b) => {
    const ia = order.indexOf(a.playerId);
    const ib = order.indexOf(b.playerId);
    return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
  });
}

/** The last backup: on the hour, or when a sheet was closed since. */
export function backedUpAt(db: MockDb): string {
  const hourIso = toClubIso(Math.floor(db.now() / HOUR_MS) * HOUR_MS);
  return db.s.lastBackupAt && db.s.lastBackupAt > hourIso ? db.s.lastBackupAt : hourIso;
}

function categoryCounts(db: MockDb): BoardCategory[] {
  return [...db.s.categories]
    .sort((a, b) => a.order - b.order)
    .map((category) => {
      const tables = db.s.tables.filter((t) => t.categoryId === category.id);
      return {
        ...category,
        total: tables.length,
        inUse: tables.filter((t) => db.activeGameOn(t.id)).length,
      };
    });
}

/** The tables of the Snooker and rooms tab (screen 3): snooker tables and rooms together. */
const inSnookerTab = (categoryId: string) => categoryId === 'snooker' || categoryId === 'room';

/** `GET /club-status`: the sign-in page's line about the sheet and the tables. Needs no session. */
export function clubStatus(db: MockDb): ClubStatus {
  const tables = db.s.tables.filter((t) => inSnookerTab(t.categoryId));
  return {
    sheetNumber: db.currentSheet.number,
    openedAt: db.currentSheet.openedAt,
    inUse: tables.filter((t) => db.activeGameOn(t.id)).length,
    total: tables.length,
  };
}

/**
 * `GET /board?category=`. The `snooker` tab (the default, like `/` on the counter) holds snooker tables
 * and rooms (screen 3); every other id is its own tab; `all` is the whole club, for the owners'
 * read-only live view.
 */
export function board(db: MockDb, requested?: string): BoardResponse {
  const category = requested ?? 'snooker';
  const categories = categoryCounts(db);
  if (category !== 'all' && !categories.some((c) => c.id === category)) {
    fail('NOT_FOUND', 'That game type was not found.');
  }
  const inTab = (categoryId: string) =>
    category === 'all' ||
    categoryId === category ||
    (category === 'snooker' && inSnookerTab(categoryId));

  const tables: BoardTable[] = db.s.tables
    .filter((t) => inTab(t.categoryId))
    .map((table) => {
      const game = db.activeGameOn(table.id);
      const session = game?.sessionId
        ? db.s.sessions.find((s) => s.id === game.sessionId)
        : undefined;
      return { ...table, ...(game ? { game } : {}), ...(session ? { session } : {}) };
    });

  const players: Record<string, PlayerName> = {};
  const name = (id: string | undefined) => {
    const player = id ? db.s.players.find((p) => p.id === id) : undefined;
    if (player) players[player.id] = { id: player.id, name: player.name };
  };
  for (const { game } of tables) {
    game?.playerIds?.forEach(name);
    game?.sides?.flat().forEach(name);
    name(game?.underPlayerId);
  }

  return {
    sheet: sheetSummary(db),
    categories,
    tables,
    players,
    waiting: waitingBills(db),
    unread: counterUnread(db),
    backedUpAt: backedUpAt(db),
    pausedAll: db.s.pauseAll !== null,
  };
}

/**
 * `POST /tables/:id/out-of-order` (screen 7's "Mark out of order"): a worker puts a free table out of order with a note.
 * Putting it back is the owners' (`PATCH /tables/:id` with `outOfOrder: null`). The counter's bell gets an alert.
 */
export function markOutOfOrder(db: MockDb, by: PersonRef, tableId: string, note: string): Table {
  const table = db.table(tableId);
  const text = note?.trim();
  if (!text) fail('NOTE_REQUIRED', 'Write why it is out of order.');
  if (table.outOfOrder) fail('TABLE_OUT_OF_ORDER', `${table.name} is already out of order.`);
  if (db.activeGameOn(table.id))
    fail('TABLE_BUSY', `${table.name} has a game running. End it first.`);
  table.outOfOrder = { note: text, by, at: db.nowIso() };
  db.counterAlert(
    'out-of-order',
    `${table.name} marked out of order by ${by.name.split(' ')[0]}`,
    text,
  );
  db.history(by, `Marked ${table.name} out of order: ${text}`);
  db.emit('board.changed', { tableId: table.id });
  return table;
}
