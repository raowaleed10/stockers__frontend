import type {
  CanteenSale,
  CanteenSaleRequest,
  CounterCanteenItem,
  PersonRef,
  UndoableSale,
} from '@stockers/shared';
import { canUndo, formatRs } from '@stockers/shared';
import type { MockDb } from './db';
import { fail } from './errors';
import { receiveMoney, returnMoney } from './checkout';

/** The counter sees names, sell prices and stock. The buying price is for the owners only (Q11). */
export function counterCanteenItems(db: MockDb): CounterCanteenItem[] {
  return db.s.canteenItems.map(({ id, name, category, sell, stock, lowAt }) => ({
    id,
    name,
    category,
    sell,
    stock,
    lowAt,
  }));
}

/** A canteen sale: on a player's bill, or paid now in cash or online with no name (Q10). */
export function canteenSale(db: MockDb, by: PersonRef, request: CanteenSaleRequest): CanteenSale {
  if (!request.items?.length) fail('VALIDATION', 'Add something to sell.');
  const player = request.playerId ? db.player(request.playerId) : null;
  if (request.payNow !== undefined) {
    const method = db.s.paymentMethods.find((m) => m.id === request.payNow && m.enabled);
    if (!method) fail('VALIDATION', 'Choose how it was paid.');
  } else if (!player) {
    fail('VALIDATION', 'A sale with no name is paid now. Choose how.');
  }

  const sold = request.items.map(({ itemId, qty }) => {
    const item = db.s.canteenItems.find((i) => i.id === itemId);
    if (!item) return fail('NOT_FOUND', 'That item was not found.');
    if (!Number.isInteger(qty) || qty < 1) fail('VALIDATION', 'The number must be 1 or more.');
    if (item.stock !== null && qty > item.stock) {
      fail(
        'OUT_OF_STOCK',
        item.stock === 0 ? `${item.name} is sold out.` : `Only ${item.stock} ${item.name} left.`,
      );
    }
    return { item, qty };
  });

  const total = sold.reduce((sum, { item, qty }) => sum + item.sell * qty, 0);
  const cost = sold.reduce((sum, { item, qty }) => sum + item.buy * qty, 0);

  const lineIds: string[] = [];
  for (const { item, qty } of sold) {
    const before = item.stock;
    if (item.stock !== null) item.stock -= qty;
    if (before !== null && item.stock !== null && before > item.lowAt && item.stock <= item.lowAt) {
      db.notify(
        'low-stock',
        `${item.name} running low`,
        item.stock === 0 ? `${item.name} is sold out.` : `${item.stock} left.`,
      );
      db.counterAlert(
        'low-stock',
        `${item.name} running low`,
        item.stock === 0 ? `${item.name} is sold out.` : `${item.stock} left.`,
      );
    }
    if (player) {
      const line = db.postLine(player.id, {
        kind: 'canteen',
        text: `${item.name}${qty > 1 ? ` × ${qty}` : ''}, canteen`,
        charge: item.sell * qty,
        item: { name: item.name, qty },
        by,
        tonight: request.payNow === undefined,
      });
      lineIds.push(line.id);
    }
  }
  if (player && request.payNow !== undefined) {
    const line = db.postLine(player.id, {
      kind: 'payment',
      text: `Payment, ${db.methodName(request.payNow)}`,
      paid: total,
      method: request.payNow,
      by,
    });
    lineIds.push(line.id);
  }
  if (request.payNow !== undefined) receiveMoney(db, request.payNow, total);

  db.s.today.canteenSales += total;
  db.s.today.earned += total;
  db.s.deltas.earned += total;
  db.s.deltas.canteenCost += cost;

  const sale: CanteenSale = {
    id: db.nextId('cs'),
    at: db.nowIso(),
    playerId: player?.id ?? null,
    items: sold.map(({ item, qty }) => ({ itemId: item.id, qty, price: item.sell })),
    total,
    ...(request.payNow !== undefined ? { paidNow: request.payNow } : {}),
    doneBy: by,
  };
  db.s.canteenSales.unshift(sale);
  db.s.canteenUndo[sale.id] = {
    by,
    at: sale.at,
    sheetId: db.s.currentSheetId,
    lineIds,
    cost,
    ...(request.payNow !== undefined
      ? { received: { method: request.payNow, amount: total } }
      : {}),
  };
  db.history(by, `Canteen sale${player ? ` to ${player.name}` : ' for cash'}`, total);
  if (player) db.emit('waiting.changed', { playerId: player.id });
  db.emit('board.changed');
  return sale;
}

/**
 * Takes a canteen sale back (D65): the worker who made it can undo it for 2 minutes while the sheet is open. The items
 * are back in stock, the lines come off the player's bill, a cash sale's money leaves the drawer or the online totals, and
 * Activity shows "Canteen sale undone" with his name.
 */
export function undoCanteenSale(db: MockDb, by: PersonRef, saleId: string): UndoableSale {
  const sale = db.s.canteenSales.find((s) => s.id === saleId);
  const record = db.s.canteenUndo[saleId];
  if (!sale || !record) fail('NOT_FOUND', 'There is no sale to undo.');
  if (record.by.id !== by.id) {
    const name = record.by.name.split(' ')[0];
    fail('NOT_ALLOWED', `${name} made this sale, so only ${name} can undo it.`);
  }
  if (record.sheetId !== db.s.currentSheetId || !canUndo(record.at, db.now())) {
    fail('UNDO_EXPIRED', 'It is more than 2 minutes since the sale was made.');
  }

  for (const { itemId, qty } of sale.items) {
    const item = db.s.canteenItems.find((i) => i.id === itemId);
    if (item && item.stock !== null) item.stock += qty;
  }
  const player = sale.playerId ? db.player(sale.playerId) : null;
  if (player) for (const lineId of record.lineIds) db.removeLine(player.id, lineId);
  if (record.received) returnMoney(db, record.received.method, record.received.amount);
  const { today } = db.s;
  today.canteenSales -= sale.total;
  today.earned -= sale.total;
  db.s.deltas.earned -= sale.total;
  db.s.deltas.canteenCost -= record.cost;
  db.s.canteenSales = db.s.canteenSales.filter((s) => s.id !== saleId);
  delete db.s.canteenUndo[saleId];

  db.logActivity(by, 'undo', 'Canteen sale undone', {
    detail: player
      ? `${formatRs(sale.total)} taken off ${player.name}’s bill. The items are back in stock.`
      : `${formatRs(sale.total)} taken back from the ${record.received?.method === 'cash' ? 'drawer' : 'online totals'}. The items are back in stock.`,
    amount: sale.total,
  });
  db.history(by, `Undid a canteen sale${player ? ` to ${player.name}` : ''}`, sale.total);
  if (player) db.emit('waiting.changed', { playerId: player.id });
  db.emit('board.changed');
  return undoableSaleOf(db, sale, record.at);
}

function undoableSaleOf(db: MockDb, sale: CanteenSale, at: string): UndoableSale {
  return {
    saleId: sale.id,
    at,
    total: sale.total,
    playerName: sale.playerId ? db.player(sale.playerId).name : null,
    ...(sale.paidNow ? { method: sale.paidNow } : {}),
  };
}

/** `GET /undoable` (sales): the canteen sale this worker made less than 2 minutes ago, the latest first. */
export function undoableSale(db: MockDb, by: PersonRef): UndoableSale | null {
  const [saleId, record] =
    Object.entries(db.s.canteenUndo)
      .reverse() // two sales in the same second: the later one first
      .filter(
        ([, r]) =>
          r.by.id === by.id && r.sheetId === db.s.currentSheetId && canUndo(r.at, db.now()),
      )
      .sort(([, a], [, b]) => Date.parse(b.at) - Date.parse(a.at))[0] ?? [];
  const sale = saleId ? db.s.canteenSales.find((s) => s.id === saleId) : undefined;
  if (!sale || !record) return null;
  return undoableSaleOf(db, sale, record.at);
}
