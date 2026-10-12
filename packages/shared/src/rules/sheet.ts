// Sheets (docs/07 §7, decisions D27, D32, D34, Q5, Q11).
// One sheet is open at a time. Close sheet opens the next straight away.

import type { Game, Rs } from '../types';

/** Everything received on the sheet: cash plus each online method. */
export function sheetReceived(input: { cash: Rs; online: Record<string, Rs> }): Rs {
  return Object.values(input.online).reduce((sum, amount) => sum + amount, input.cash);
}

/** Earned = received for this sheet + new credit - old credit paid on this sheet. */
export function sheetEarned(input: { received: Rs; newCredit: Rs; oldCreditPaid: Rs }): Rs {
  return input.received + input.newCredit - input.oldCreditPaid;
}

/** Profit (owners only) = earned - expenses - canteen buying cost (Q11). */
export function sheetProfit(input: { earned: Rs; expenses: Rs; canteenCost: Rs }): Rs {
  return input.earned - input.expenses - input.canteenCost;
}

export interface CloseBill {
  playerId: string;
  /** What he has not paid yet tonight. */
  tonight: Rs;
}

export interface ClosePlan {
  /** Games still going: they move to the new sheet (Q5). */
  moveGameIds: string[];
  /** Bills not checked out: they move to credit, marked "Left without checkout" (D27). */
  leftWithoutCheckout: CloseBill[];
  leftTotal: Rs;
}

/** What happens when the sheet closes. Running and paused games move; unpaid bills go to credit. */
export function planClose(input: {
  games: Pick<Game, 'id' | 'status'>[];
  bills: CloseBill[];
}): ClosePlan {
  const leftWithoutCheckout = input.bills.filter((bill) => bill.tonight > 0);
  return {
    moveGameIds: input.games
      .filter((game) => game.status === 'running' || game.status === 'paused')
      .map((game) => game.id),
    leftWithoutCheckout,
    leftTotal: leftWithoutCheckout.reduce((sum, bill) => sum + bill.tonight, 0),
  };
}
