// Credit and players (docs/07 §4, decisions D25, D27).
// There is no credit limit, no warning and no block. Credit older than 15 days is only shown in amber.

import type { ISO, Rs, StatementLine } from '../types';
import { clubDayNumber, type Moment } from './club-time';

export const OLD_CREDIT_DAYS = 15;

/** How many calendar days (club time) since the oldest unpaid charge. 15 Sep to 3 Oct is 18. */
export function creditAgeDays(oldestUnpaidAt: ISO, now: Moment): number {
  return Math.max(0, clubDayNumber(now) - clubDayNumber(oldestUnpaidAt));
}

/** Credit is old when the oldest unpaid charge is more than 15 days old (D25). */
export function isOldCredit(
  oldestUnpaidAt: ISO | null | undefined,
  now: Moment,
  days = OLD_CREDIT_DAYS,
): boolean {
  return !!oldestUnpaidAt && creditAgeDays(oldestUnpaidAt, now) > days;
}

export type BalanceKind = 'owes' | 'advance' | 'clear';

export function balanceKind(balance: Rs): BalanceKind {
  return balance > 0 ? 'owes' : balance < 0 ? 'advance' : 'clear';
}

type Amounts = Pick<StatementLine, 'charge' | 'paid'>;

/** A player's balance is the sum of his statement lines: charges minus payments. */
export function statementBalance(lines: Amounts[]): Rs {
  return lines.reduce((sum, line) => sum + (line.charge ?? 0) - (line.paid ?? 0), 0);
}

/** The running balance after each line, in the order given. */
export function runningBalances(lines: Amounts[]): Rs[] {
  let balance = 0;
  return lines.map((line) => (balance += (line.charge ?? 0) - (line.paid ?? 0)));
}
