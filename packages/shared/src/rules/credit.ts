// Credit and players (docs/07 §4, decisions D25, D27).
// There is no credit limit, no warning and no block. Credit older than 15 days is only shown in amber.

import type { ISO, Rs, StatementLine } from '../types';
import { clubDayNumber, toClubIso, type Moment } from './club-time';

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

/** The periods a statement can be cut to on the counter (screen 30). */
export type StatementPeriod = 'zero' | 'month' | 'all';

/**
 * The lines of a statement for one period, oldest first, as the counter shows them (screen 30):
 *  - `all` is every line;
 *  - `month` is the lines of the current calendar month (club time);
 *  - `zero` is "since last zero": the lines after the last time his balance was nothing. When the balance is nothing right
 *    now, the stretch that ended there is shown, so a player who has paid up still shows what he paid for.
 */
export function statementSince<T extends Pick<StatementLine, 'at' | 'balance'>>(
  lines: readonly T[],
  period: StatementPeriod,
  now: Moment,
): T[] {
  if (period === 'all') return [...lines];
  if (period === 'month') {
    const month = toClubIso(now).slice(0, 7);
    return lines.filter((line) => line.at.slice(0, 7) === month);
  }
  const zeroAt = (before: number) => {
    for (let i = before; i >= 0; i -= 1) if (lines[i]?.balance === 0) return i;
    return -1;
  };
  const last = zeroAt(lines.length - 1);
  if (last < lines.length - 1) return lines.slice(last + 1);
  // Paid up: back to the zero before it.
  return lines.slice(zeroAt(last - 1) + 1);
}
