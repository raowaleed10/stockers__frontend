import type {
  CheckoutBill,
  CheckoutList,
  CheckoutRequest,
  CheckoutResult,
  PersonRef,
  StatementLine,
} from '@stockers/shared';
import { applyDiscount, billBreakdown, formatRs, settleCheckout } from '@stockers/shared';
import { waitingBills } from './board';
import type { MockDb } from './db';
import { fail, rule } from './errors';
import { presentPlayer } from './players';

const sum = (lines: StatementLine[]) =>
  lines.reduce((total, line) => total + (line.charge ?? 0), 0);

/** `GET /checkout`: everyone who still has to pay for tonight. */
export function checkoutList(db: MockDb): CheckoutList {
  const bills = waitingBills(db);
  return { bills, total: bills.reduce((total, bill) => total + bill.total, 0) };
}

/** `GET /checkout/:playerId`: old credit, tonight's lines, and the total to pay (screen 25). */
export function checkoutBill(db: MockDb, playerId: string, mask: boolean): CheckoutBill {
  const player = db.player(playerId);
  const tonight = db.tonightLines(playerId);
  const tonightTotal = sum(tonight);
  const bill = billBreakdown(player.balance - tonightTotal, tonightTotal);
  return {
    player: presentPlayer(player, mask),
    tonight,
    oldCredit: bill.oldCredit,
    advance: bill.advance,
    tonightTotal,
    total: bill.total,
    methods: db.s.paymentMethods.filter((m) => m.enabled),
  };
}

/** Money received at the counter goes in the drawer (cash) or in the online totals (D24). */
export function receiveMoney(db: MockDb, method: string, amount: number): void {
  if (amount <= 0) return;
  const today = db.s.today;
  if (method === 'cash') today.cashReceived += amount;
  else today.online[method] = (today.online[method] ?? 0) + amount;
  today.moneyInHand += amount;
}

/** Pays a bill: the parts in several methods, the rest to credit, an optional discount (D23, Q6). */
export function checkout(
  db: MockDb,
  by: PersonRef,
  playerId: string,
  request: CheckoutRequest,
  mask: boolean,
): CheckoutResult {
  const player = db.player(playerId);
  const lines = db.tonightLines(playerId);
  const tonight = sum(lines);
  const bill = billBreakdown(player.balance - tonight, tonight);

  const parts = request.parts ?? [];
  for (const part of parts) {
    const method = db.s.paymentMethods.find((m) => m.id === part.method && m.enabled);
    if (!method) fail('VALIDATION', 'Choose how it was paid.');
  }
  rule(() => applyDiscount(bill.total, request.discount));
  const settlement = rule(
    () =>
      settleCheckout({
        total: bill.total,
        parts,
        toCredit: request.toCredit ?? 0,
        discount: request.discount,
      }),
    'BILL_MISMATCH',
  );

  const posted: StatementLine[] = [];
  for (const part of parts) {
    if (part.amount <= 0) continue;
    posted.push(
      db.postLine(playerId, {
        kind: 'payment',
        text: `Payment, ${db.methodName(part.method)}`,
        paid: part.amount,
        method: part.method,
        by,
      }),
    );
    receiveMoney(db, part.method, part.amount);
  }
  if (request.discount) {
    posted.push(
      db.postLine(playerId, {
        kind: 'discount',
        text: `Discount, ${request.discount.reason}`,
        paid: request.discount.amount,
        by,
      }),
    );
  }
  lines.forEach((line) => db.s.unsettled.delete(line.id));
  delete db.s.billSummaries[playerId];

  // Payments clear the oldest money first (old credit), so what stays on credit is new tonight.
  const tonightNet = Math.max(0, tonight - settlement.discount);
  const newCredit = Math.min(settlement.toCredit, tonightNet);
  const oldRemaining = Math.max(0, settlement.toCredit - newCredit);
  const oldPaid = Math.max(0, bill.oldCredit - oldRemaining);
  const today = db.s.today;
  today.newCredit += newCredit;
  if (newCredit > 0) today.newCreditPlayers += 1;
  today.oldCreditPaid += oldPaid;
  if (oldPaid > 0) today.oldCreditPlayers += 1;
  if (settlement.discount > 0) {
    today.discounts.count += 1;
    today.discounts.total += settlement.discount;
    today.earned -= settlement.discount;
    db.s.deltas.earned -= settlement.discount;
  }
  if (player.balance > 0 && oldRemaining === 0) player.oldestUnpaidAt = lines[0]?.at ?? db.nowIso();

  if (request.discount) {
    const { reason, note } = request.discount;
    db.logActivity(by, 'discount', `Discount for ${player.name}`, {
      detail: note?.trim() ? `${reason}. “${note.trim()}”` : reason,
      amount: -request.discount.amount,
    });
  }
  const credit = settlement.toCredit > 0 ? `, ${formatRs(settlement.toCredit)} to credit` : '';
  db.history(
    by,
    `Checkout, ${player.name}: ${formatRs(settlement.paid)} paid${credit}`,
    settlement.paid,
  );
  db.emit('waiting.changed', { playerId });
  db.emit('board.changed');
  return { settlement, player: presentPlayer(player, mask), lines: posted };
}
