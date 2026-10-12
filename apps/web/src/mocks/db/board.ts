import type {
  BoardCategory,
  BoardResponse,
  BoardTable,
  PlayerName,
  SheetSummary,
  StatementLine,
  WaitingBill,
} from '@stockers/shared';
import { billBreakdown, phoneTail, toClubIso } from '@stockers/shared';
import type { MockDb } from './db';
import { fail } from './errors';

const HOUR_MS = 60 * 60_000;

export function sheetSummary(db: MockDb): SheetSummary {
  const { id, number, openedAt, openedBy } = db.currentSheet;
  return { id, number, openedAt, openedBy };
}

/** A few plain words for what is on a bill, when the seed did not write them. */
function summarize(lines: StatementLine[]): string {
  const count = (...kinds: StatementLine['kind'][]) =>
    lines.filter((l) => kinds.includes(l.kind)).length;
  const frames = count('frame', 'game');
  const doubles = count('double');
  const canteen = count('canteen');
  const parts = [
    frames > 0 ? `${frames} ${frames === 1 ? 'frame' : 'frames'} lost` : '',
    doubles > 0 ? (doubles === 1 ? 'half of a double' : `${doubles} halves of a double`) : '',
    count('century') > 0 ? 'Century' : '',
    count('room') > 0 ? 'Room' : '',
    canteen > 0 ? `${canteen} canteen ${canteen === 1 ? 'item' : 'items'}` : '',
    count('damage') > 0 ? 'damage charge' : '',
  ].filter(Boolean);
  const text = parts.join(', ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Players who still have to pay for tonight, oldest bill first. */
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
      summary: db.s.billSummaries[player.id] ?? summarize(lines),
      tonight,
      oldCredit: bill.oldCredit,
      advance: bill.advance,
      total: bill.total,
    });
  }
  // The seed lists them in the order the screens show; new bills follow.
  const order = Object.keys(db.s.billSummaries);
  return bills.sort((a, b) => {
    const ia = order.indexOf(a.playerId);
    const ib = order.indexOf(b.playerId);
    return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
  });
}

/** Notifications not read yet that already happened on the demo clock (the bell badge). */
export function unreadCount(db: MockDb): number {
  const now = db.now();
  return db.s.notifications.filter((n) => !n.read && Date.parse(n.at) <= now).length;
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
    (category === 'snooker' && categoryId === 'room');

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
    unread: unreadCount(db),
    backedUpAt: backedUpAt(db),
    pausedAll: db.s.pauseAll !== null,
  };
}
