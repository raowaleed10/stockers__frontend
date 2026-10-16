import type {
  CanteenItem,
  Category,
  CategoryPatch,
  NewCanteenItemRequest,
  NewTableRequest,
  OwnerCanteen,
  PersonRef,
  PriceCard,
  Prices,
  StockRequest,
  Table,
  TablePatch,
} from '@stockers/shared';
import { formatRs, isValidMaxMinutes } from '@stockers/shared';
import { releaseTable } from '../db/board';
import type { MockDb } from '../db/db';
import { fail } from '../db/errors';

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function checkPrice(price: number | null | undefined): void {
  if (price !== null && price !== undefined && (!Number.isInteger(price) || price < 0)) {
    fail('VALIDATION', 'The price is a whole number of rupees.');
  }
}

/** The maximum time of a game is a whole number of minutes from 5 to 180 (D56). */
function checkMaxMinutes(value: number | undefined): void {
  if (value !== undefined && !isValidMaxMinutes(value)) {
    fail('VALIDATION', 'The maximum time is a whole number of minutes from 5 to 180.');
  }
}

// Prices and games (screens 45 to 47) --------------------------------------------------------------

/** `GET /prices`: a price card for each game, with its tables. */
export function prices(db: MockDb): Prices {
  const categories: PriceCard[] = [...db.s.categories]
    .sort((a, b) => a.order - b.order)
    .map((category) => ({
      ...category,
      tables: db.s.tables.filter((t) => t.categoryId === category.id),
    }));
  return { categories };
}

function priceChanged(
  db: MockDb,
  by: PersonRef,
  tables: Table[],
  before: (number | null)[],
  price: number | null,
) {
  const names = tables.map((t) => t.name).join(', ');
  const was = new Set(before.map((value) => (value === null ? 'no price' : formatRs(value))));
  const now = price === null ? 'no price' : formatRs(price);
  db.logActivity(by, 'price-change', `Price changed: ${names}`, {
    detail: `${[...was].join(' and ')} to ${now}. Games already started keep the old price.`,
    sheetId: null,
  });
  db.emit('price.changed', { tableIds: tables.map((t) => t.id) });
  db.emit('board.changed');
}

function maxMinutesChanged(
  db: MockDb,
  by: PersonRef,
  tables: Table[],
  before: (number | undefined)[],
  maxMinutes: number,
) {
  const names = tables.map((t) => t.name).join(', ');
  const was = new Set(before.map((value) => (value === undefined ? 'no limit' : `${value} min`)));
  db.logActivity(by, 'price-change', `Maximum time changed: ${names}`, {
    detail: `${[...was].join(' and ')} to ${maxMinutes} min. Games already started keep their limit.`,
    sheetId: null,
  });
  db.emit('price.changed', { tableIds: tables.map((t) => t.id) });
  db.emit('board.changed');
}

/**
 * Sets the price of a table, and of other tables in the same category if asked, or puts a table out
 * of order or back (D5). A game already started keeps the price it started with.
 */
export function patchTable(db: MockDb, by: PersonRef, id: string, patch: TablePatch): Table[] {
  const table = db.table(id);
  const changed: Table[] = [table];

  // The price and the maximum time are set together on the same tables (screen 46, with "also these tables").
  if (patch.price !== undefined || patch.maxMinutes !== undefined) {
    checkPrice(patch.price);
    checkMaxMinutes(patch.maxMinutes);
    const targets = [table, ...(patch.alsoTableIds ?? []).map((other) => db.table(other))];
    if (targets.some((t) => t.categoryId !== table.categoryId)) {
      fail('VALIDATION', 'Only tables of the same game can share a price.');
    }
    const unique = [...new Map(targets.map((t) => [t.id, t])).values()];
    if (patch.maxMinutes !== undefined && unique.some((t) => t.kind === 'room')) {
      fail('VALIDATION', 'A room is charged by the hour and has no maximum time.');
    }
    changed.splice(0, changed.length, ...unique);
    if (patch.price !== undefined) {
      const before = unique.map((t) => t.price);
      unique.forEach((t) => {
        t.price = patch.price ?? null;
      });
      priceChanged(db, by, unique, before, patch.price ?? null);
    }
    if (patch.maxMinutes !== undefined) {
      const before = unique.map((t) => t.maxMinutes);
      const limit = patch.maxMinutes;
      unique.forEach((t) => {
        t.maxMinutes = limit;
      });
      maxMinutesChanged(db, by, unique, before, limit);
    }
  }

  if (patch.outOfOrder !== undefined) {
    if (patch.outOfOrder === null) {
      if (table.outOfOrder) releaseTable(db, by, table);
    } else {
      if (!patch.outOfOrder.note?.trim()) fail('NOTE_REQUIRED', 'Write why it is out of order.');
      if (db.activeGameOn(table.id))
        fail('TABLE_BUSY', `${table.name} has a game running. End it first.`);
      table.outOfOrder = { note: patch.outOfOrder.note.trim(), by, at: db.nowIso() };
      db.counterAlert(
        'out-of-order',
        `${table.name} marked out of order by ${by.name.split(' ')[0]}`,
        table.outOfOrder.note,
      );
      db.logActivity(by, 'out-of-order', `${table.name} marked out of order`, {
        detail: `“${table.outOfOrder.note}”`,
      });
    }
    db.emit('board.changed', { tableId: table.id });
  }
  return changed;
}

/** The price card of a whole game: every table of the category gets the price (screen 45). */
export function patchCategory(
  db: MockDb,
  by: PersonRef,
  id: string,
  patch: CategoryPatch,
): PriceCard {
  const category =
    db.s.categories.find((c) => c.id === id) ?? fail('NOT_FOUND', 'That game was not found.');
  checkPrice(patch.price);
  checkPrice(patch.centuryRate);
  checkMaxMinutes(patch.maxMinutes);
  const tables = db.s.tables.filter((t) => t.categoryId === id);
  if (patch.maxMinutes !== undefined) {
    if (category.kind === 'room')
      fail('VALIDATION', 'A room is charged by the hour and has no maximum time.');
    const before = tables.map((t) => t.maxMinutes);
    const limit = patch.maxMinutes;
    tables.forEach((t) => {
      t.maxMinutes = limit;
    });
    maxMinutesChanged(db, by, tables, before, limit);
  }
  if (patch.centuryRate !== undefined) {
    if (!category.centuryAllowed) fail('VALIDATION', 'Century is not played on this game.');
    category.centuryRate = patch.centuryRate;
    db.emit('price.changed', { categoryId: id });
  }
  if (patch.price !== undefined) {
    const before = tables.map((t) => t.price);
    tables.forEach((t) => {
      t.price = patch.price ?? null;
    });
    priceChanged(db, by, tables, before, patch.price ?? null);
  }
  return { ...category, tables };
}

/** Next name and number in a category: "Table 7" gives "Table 8", "R2" gives "R3". */
function nextOf(last: Table): { id: string; name: string; number: string } {
  const bump = (text: string) => text.replace(/(\d+)$/, (digits) => String(Number(digits) + 1));
  return { id: bump(last.id), name: bump(last.name), number: bump(last.number) };
}

/** Adds a table to a game, or makes a new game with its first table (D4). */
export function addTable(db: MockDb, request: NewTableRequest): Table {
  checkPrice(request.price);
  checkMaxMinutes(request.maxMinutes);
  let category: Category | undefined;
  if (request.categoryId) {
    category = db.s.categories.find((c) => c.id === request.categoryId);
    if (!category) fail('NOT_FOUND', 'That game was not found.');
  } else {
    const name = request.categoryName?.trim();
    if (!name) fail('VALIDATION', 'Pick a game or type the name of a new one.');
    if (!request.kind) fail('VALIDATION', 'Choose what kind of game it is.');
    const id = slug(name);
    if (db.s.categories.some((c) => c.id === id))
      fail('VALIDATION', 'There is a game with that name already.');
    category = {
      id,
      name,
      kind: request.kind,
      pricing: request.kind === 'room' ? 'hour' : request.kind === 'snooker' ? 'frame' : 'game',
      centuryAllowed: request.kind === 'snooker',
      order: Math.max(0, ...db.s.categories.map((c) => c.order)) + 1,
    };
    db.s.categories.push(category);
  }

  const siblings = db.s.tables.filter((t) => t.categoryId === category.id);
  const last = siblings.at(-1);
  const names = last
    ? nextOf(last)
    : { id: `${category.id}1`, name: `${category.name} 1`, number: '1' };
  const table: Table = {
    id: names.id,
    categoryId: category.id,
    kind: category.kind,
    number: names.number,
    name: names.name,
    price: request.price,
    // A game charged per game starts with a maximum time: the one asked for, or the setting of screen 51.
    ...(category.kind === 'room'
      ? {}
      : { maxMinutes: request.maxMinutes ?? db.s.settings.rules.doubleAfterMin }),
  };
  db.s.tables.push(table);
  db.emit('price.changed', { tableIds: [table.id] });
  db.emit('board.changed');
  return table;
}

// Canteen (screen 48) ----------------------------------------------------------------------------

export function ownerCanteen(db: MockDb): OwnerCanteen {
  const now = db.now();
  return {
    items: db.s.canteenItems,
    sales: db.s.canteenSales.filter((sale) => Date.parse(sale.at) <= now),
  };
}

export function addCanteenItem(db: MockDb, request: NewCanteenItemRequest): CanteenItem {
  const name = request.name?.trim();
  if (!name) fail('VALIDATION', 'Type the name of the item.');
  if (!['drinks', 'food', 'cigarettes'].includes(request.category))
    fail('VALIDATION', 'Choose a group.');
  for (const value of [request.sell, request.buy, request.lowAt]) {
    if (!Number.isInteger(value) || value < 0)
      fail('VALIDATION', 'Prices and stock are whole numbers.');
  }
  if (request.stock !== null && (!Number.isInteger(request.stock) || request.stock < 0)) {
    fail('VALIDATION', 'Stock is a whole number, or empty for made fresh.');
  }
  let id = slug(name);
  for (let n = 2; db.s.canteenItems.some((i) => i.id === id); n += 1) id = `${slug(name)}-${n}`;
  const item: CanteenItem = {
    id,
    name,
    category: request.category,
    sell: request.sell,
    buy: request.buy,
    ...(request.buyIsEstimate ? { buyIsEstimate: true } : {}),
    stock: request.stock,
    lowAt: request.lowAt,
  };
  db.s.canteenItems.push(item);
  return item;
}

export function addStock(db: MockDb, request: StockRequest): CanteenItem {
  const item =
    db.s.canteenItems.find((i) => i.id === request.itemId) ??
    fail('NOT_FOUND', 'That item was not found.');
  if (item.stock === null) fail('VALIDATION', `${item.name} is made fresh, so it has no stock.`);
  if (!Number.isInteger(request.add) || request.add === 0)
    fail('VALIDATION', 'Type how many were added.');
  if (item.stock + request.add < 0)
    fail('VALIDATION', `There are only ${item.stock} ${item.name}.`);
  item.stock += request.add;
  return item;
}
