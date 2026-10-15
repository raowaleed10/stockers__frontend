import type {
  CanteenSale,
  CanteenSaleRequest,
  CounterCanteenItem,
  PersonRef,
} from '@stockers/shared';
import type { MockDb } from './db';
import { fail } from './errors';
import { receiveMoney } from './checkout';

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
      db.postLine(player.id, {
        kind: 'canteen',
        text: `${item.name}${qty > 1 ? ` × ${qty}` : ''}, canteen`,
        charge: item.sell * qty,
        item: { name: item.name, qty },
        by,
        tonight: request.payNow === undefined,
      });
    }
  }
  if (player && request.payNow !== undefined) {
    db.postLine(player.id, {
      kind: 'payment',
      text: `Payment, ${db.methodName(request.payNow)}`,
      paid: total,
      method: request.payNow,
      by,
    });
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
  db.history(by, `Canteen sale${player ? ` to ${player.name}` : ' for cash'}`, total);
  if (player) db.emit('waiting.changed', { playerId: player.id });
  db.emit('board.changed');
  return sale;
}
