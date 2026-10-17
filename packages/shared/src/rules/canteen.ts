// The canteen (docs/07, decisions D31, Q10). A sale is the items in the basket at their selling price; stock goes down with
// each one, and the counter says when an item is low or sold out.

import type { Rs } from '../types';

export interface BasketLine {
  /** What one costs the player. */
  sell: Rs;
  qty: number;
}

/** The total of a basket: two cold drinks at Rs 120 and one chips at Rs 60 are Rs 300 (screen 28). */
export function basketTotal(lines: readonly BasketLine[]): Rs {
  return lines.reduce((sum, line) => sum + line.sell * line.qty, 0);
}

/** `fresh` is made on the spot and has no stock; `low` is at or under the owners' low-stock number; `soldOut` is none left. */
export type StockState = 'fresh' | 'ok' | 'low' | 'soldOut';

export function stockState(item: { stock: number | null; lowAt: number }): StockState {
  if (item.stock === null) return 'fresh';
  if (item.stock <= 0) return 'soldOut';
  return item.stock <= item.lowAt ? 'low' : 'ok';
}

/** One more can go in the basket while there is stock for it (an item made fresh has no limit). */
export function canAddOne(item: { stock: number | null }, inBasket: number): boolean {
  return item.stock === null || inBasket < item.stock;
}
