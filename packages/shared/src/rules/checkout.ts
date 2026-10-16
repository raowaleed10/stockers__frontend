// Money at checkout (docs/07 §3, decisions D23, D25, D26, Q6).
// A player's balance is signed: more than 0 he owes the club, less than 0 the club holds his advance.

import type { BillPart, Rs, StatementLine, WaitingBill } from '../types';

/**
 * What tonight's lines are made of: frames lost, games lost, halves of a double, Centuries, rooms, damage
 * charges, and canteen items with their quantity (summed for each item). Lines that are not a charge
 * (payments, discounts, old credit) are not part of the bill's words. The order is fixed, so the same bill
 * always reads the same: "2 frames lost, 2 teas".
 */
export function billParts(lines: readonly StatementLine[]): BillPart[] {
  const counts = new Map<Exclude<BillPart['kind'], 'canteen'>, number>();
  const amounts = new Map<BillPart['kind'], number>();
  const doubled = new Map<BillPart['kind'], number>();
  const roomText = new Map<BillPart['kind'], string>();
  const items = new Map<string, number>();
  const itemAmounts = new Map<string, number>();
  for (const line of lines) {
    switch (line.kind) {
      case 'frame':
      case 'game':
      case 'double':
      case 'century':
      case 'room':
      case 'damage':
        counts.set(line.kind, (counts.get(line.kind) ?? 0) + 1);
        amounts.set(line.kind, (amounts.get(line.kind) ?? 0) + (line.charge ?? 0));
        if (line.doubled) doubled.set(line.kind, (doubled.get(line.kind) ?? 0) + 1);
        if (line.kind === 'room' && !roomText.has('room')) roomText.set('room', line.text);
        break;
      case 'canteen': {
        // A line from before items were stored has no name: it is still one sale.
        const name = line.item?.name ?? '';
        items.set(name, (items.get(name) ?? 0) + (line.item?.qty ?? 1));
        itemAmounts.set(name, (itemAmounts.get(name) ?? 0) + (line.charge ?? 0));
        break;
      }
      default:
        break;
    }
  }
  const parts: BillPart[] = [];
  for (const kind of ['frame', 'game', 'double', 'century', 'room'] as const) {
    const count = counts.get(kind);
    if (count) {
      parts.push({
        kind,
        count,
        amount: amounts.get(kind) ?? 0,
        ...(doubled.get(kind) ? { doubled: doubled.get(kind) } : {}),
        // Only when the whole bill's rooms are one, so the text names it.
        ...(kind === 'room' && count === 1 ? { text: roomText.get('room') } : {}),
      });
    }
  }
  for (const [item, count] of items) {
    parts.push({
      kind: 'canteen',
      count,
      amount: itemAmounts.get(item) ?? 0,
      ...(item ? { item } : {}),
    });
  }
  const damage = counts.get('damage');
  if (damage) parts.push({ kind: 'damage', count: damage, amount: amounts.get('damage') ?? 0 });
  return parts;
}

/** "Not paid yet today" on the live board: the sum of what each waiting player owes from tonight. */
export function waitingTotal(waiting: readonly Pick<WaitingBill, 'tonight'>[]): Rs {
  return waiting.reduce((sum, bill) => sum + bill.tonight, 0);
}

export interface Bill {
  /** Credit he owes from before tonight. */
  oldCredit: Rs;
  /** Advance the club holds for him, used against the bill. */
  advance: Rs;
  /** Tonight's charges. */
  tonight: Rs;
  /** Old credit + tonight's charges - advance held. */
  total: Rs;
}

/** The bill from his balance before tonight and tonight's charges. Saad: -200 and 630 give 430. */
export function billBreakdown(balanceBefore: Rs, tonight: Rs): Bill {
  const oldCredit = Math.max(0, balanceBefore);
  const advance = Math.max(0, -balanceBefore);
  return { oldCredit, advance, tonight, total: oldCredit + tonight - advance };
}

export interface Discount {
  amount: Rs;
  reason: string;
  note?: string;
}

/** The new total after a discount. It needs a reason and cannot be more than the bill (Q6). */
export function applyDiscount(total: Rs, discount: Discount | undefined): Rs {
  if (discount === undefined) return total;
  if (!Number.isInteger(discount.amount) || discount.amount <= 0) {
    throw new RangeError('A discount is a whole number of rupees above 0');
  }
  if (discount.reason.trim() === '') throw new RangeError('A discount needs a reason');
  if (discount.amount > Math.max(0, total)) {
    throw new RangeError('A discount cannot be more than the bill');
  }
  return total - discount.amount;
}

/** Whether a discount is allowed on this bill: whole rupees above 0, and not more than the bill (Q6). */
export function isValidDiscount(total: Rs, amount: Rs): boolean {
  return Number.isInteger(amount) && amount > 0 && amount <= Math.max(0, total);
}

export interface Payment {
  method: string;
  amount: Rs;
}

/**
 * What the part payment page (screen 26) shows while the worker types: what is paid now, what stays as credit, and the
 * extra kept as advance when he gives more than is due (D26). `due` is the bill after any discount. The same numbers
 * `settleCheckout` checks when the payment is saved.
 */
export function paymentPreview(
  due: Rs,
  parts: readonly Payment[],
): { paid: Rs; toCredit: Rs; advance: Rs } {
  const paid = parts.reduce((sum, part) => sum + part.amount, 0);
  const shortfall = due - paid;
  return { paid, toCredit: Math.max(0, shortfall), advance: Math.max(0, -shortfall) };
}

export interface Settlement {
  total: Rs;
  discount: Rs;
  /** What is left to pay after the discount. */
  due: Rs;
  paid: Rs;
  /** The part of the bill put on credit. */
  toCredit: Rs;
  /** The extra he paid, held for him as advance. */
  advance: Rs;
  /** His balance after this checkout: more than 0 credit, less than 0 advance. */
  newBalance: Rs;
}

/**
 * Checks a checkout and gives its result. The parts in several methods plus credit make the bill.
 * Paying more than the bill makes the extra advance (D26). Bilal: 1,350, discount 50, cash 600 and
 * Easypaisa 400, so 300 goes to credit.
 */
export function settleCheckout(input: {
  total: Rs;
  parts: Payment[];
  toCredit: Rs;
  discount?: Discount;
}): Settlement {
  const due = applyDiscount(input.total, input.discount);
  input.parts.forEach((part) => {
    if (!Number.isInteger(part.amount) || part.amount < 0) {
      throw new RangeError('A payment is a whole number of rupees');
    }
  });
  if (!Number.isInteger(input.toCredit) || input.toCredit < 0) {
    throw new RangeError('Credit is a whole number of rupees');
  }
  const paid = input.parts.reduce((sum, part) => sum + part.amount, 0);
  const shortfall = due - paid;

  const expectedCredit = Math.max(0, shortfall);
  if (input.toCredit !== expectedCredit) {
    throw new RangeError(
      `Paid ${paid} of ${due}: ${expectedCredit} must go to credit, not ${input.toCredit}`,
    );
  }
  return {
    total: input.total,
    discount: input.total - due,
    due,
    paid,
    toCredit: input.toCredit,
    advance: Math.max(0, -shortfall),
    newBalance: shortfall,
  };
}
