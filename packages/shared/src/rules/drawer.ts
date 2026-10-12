// Drawer cash (docs/07 §5, decision D53).
//
//   expected drawer cash = cash received on this sheet - expenses taken from the drawer
//   difference at close  = counted - expected   (negative = short, positive = extra)

import type { Rs } from '../types';

export function expectedDrawerCash(input: { cashReceived: Rs; drawerExpenses: Rs }): Rs {
  return input.cashReceived - input.drawerExpenses;
}

/** The drawer figure after an expense is added: 12,300 and 500 give 11,800. */
export function drawerAfterExpense(expected: Rs, amount: Rs): Rs {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new RangeError('An expense is a whole number of rupees above 0');
  }
  return expected - amount;
}

/** Counted minus expected. 21,550 counted against 21,750 expected is -200, short Rs 200. */
export function drawerDifference(counted: Rs, expected: Rs): Rs {
  return counted - expected;
}

/** A note is required at close whenever the cash is short or extra. */
export function closeNoteRequired(difference: Rs): boolean {
  return difference !== 0;
}
