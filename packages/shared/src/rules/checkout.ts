// Money at checkout (docs/07 §3, decisions D23, D25, D26, Q6).
// A player's balance is signed: more than 0 he owes the club, less than 0 the club holds his advance.

import type { Rs } from '../types';

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

export interface Payment {
  method: string;
  amount: Rs;
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
