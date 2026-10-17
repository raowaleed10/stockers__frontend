import type {
  CheckoutBill,
  CheckoutList,
  CheckoutRequest,
  CheckoutResult,
  PersonRef,
  StatementLine,
  UndoablePayment,
} from '@stockers/shared';
import { applyDiscount, billBreakdown, canUndo, formatRs, settleCheckout } from '@stockers/shared';
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

  const oldestBefore = player.oldestUnpaidAt;
  const billIndex = db.s.billOrder.indexOf(playerId);
  const received: Record<string, number> = {};
  const posted: StatementLine[] = [];
  for (const part of parts) {
    if (part.amount <= 0) continue;
    received[part.method] = (received[part.method] ?? 0) + part.amount;
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
  db.s.billOrder = db.s.billOrder.filter((id) => id !== playerId);

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

  let discountEventId: string | undefined;
  if (request.discount) {
    const { reason, note } = request.discount;
    discountEventId = db.logActivity(by, 'discount', `Discount for ${player.name}`, {
      detail: note?.trim() ? `${reason}. “${note.trim()}”` : reason,
      amount: -request.discount.amount,
    }).id;
  }
  db.s.checkoutUndo[playerId] = {
    by,
    at: db.nowIso(),
    sheetId: db.s.currentSheetId,
    name: player.name,
    paid: settlement.paid,
    toCredit: settlement.toCredit,
    postedLineIds: posted.map((line) => line.id),
    settledLineIds: lines.map((line) => line.id),
    billIndex,
    oldestUnpaidAt: oldestBefore,
    received,
    newCredit,
    newCreditPlayer: newCredit > 0,
    oldCreditPaid: oldPaid,
    oldCreditPlayer: oldPaid > 0,
    discount: settlement.discount,
    ...(discountEventId ? { discountEventId } : {}),
  };
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

/**
 * Takes a payment back (D63): the worker who took it can undo it for 2 minutes, as long as the sheet is still open. The
 * payment lines and the discount go off the statement, tonight's charges are waiting again, the drawer and the online
 * totals lose the money, and Activity shows "Payment undone" with his name.
 */
export function undoCheckout(db: MockDb, by: PersonRef, playerId: string): UndoablePayment {
  const player = db.player(playerId);
  const record = db.s.checkoutUndo[playerId];
  if (!record) fail('NOT_FOUND', 'There is no payment to undo.');
  if (record.by.id !== by.id) {
    const name = record.by.name.split(' ')[0];
    fail('NOT_ALLOWED', `${name} took this payment, so only ${name} can undo it.`);
  }
  if (record.sheetId !== db.s.currentSheetId || !canUndo(record.at, db.now())) {
    fail('UNDO_EXPIRED', 'It is more than 2 minutes since the payment was taken.');
  }

  for (const lineId of record.postedLineIds) db.removeLine(playerId, lineId);
  const statement = db.statement(playerId);
  for (const lineId of record.settledLineIds) {
    if (statement.some((line) => line.id === lineId)) db.s.unsettled.add(lineId);
  }
  if (record.billIndex >= 0 && !db.s.billOrder.includes(playerId)) {
    db.s.billOrder.splice(Math.min(record.billIndex, db.s.billOrder.length), 0, playerId);
  }
  if (record.oldestUnpaidAt) player.oldestUnpaidAt = record.oldestUnpaidAt;
  else delete player.oldestUnpaidAt;

  const today = db.s.today;
  for (const [method, amount] of Object.entries(record.received)) {
    if (method === 'cash') today.cashReceived -= amount;
    else today.online[method] = (today.online[method] ?? 0) - amount;
    today.moneyInHand -= amount;
  }
  today.newCredit -= record.newCredit;
  if (record.newCreditPlayer) today.newCreditPlayers -= 1;
  today.oldCreditPaid -= record.oldCreditPaid;
  if (record.oldCreditPlayer) today.oldCreditPlayers -= 1;
  if (record.discount > 0) {
    today.discounts.count -= 1;
    today.discounts.total -= record.discount;
    today.earned += record.discount;
    db.s.deltas.earned += record.discount;
  }
  if (record.discountEventId) {
    db.s.activity = db.s.activity.filter((event) => event.id !== record.discountEventId);
  }
  delete db.s.checkoutUndo[playerId];

  const credit =
    record.toCredit > 0
      ? ` ${formatRs(record.toCredit)} that went to credit is taken back too.`
      : '';
  db.logActivity(by, 'undo', `Payment undone for ${player.name}`, {
    detail: `${formatRs(record.paid)} taken back from the drawer and the online totals.${credit} The bill is waiting again.`,
    amount: record.paid,
  });
  db.history(by, `Undid the payment of ${player.name}`, record.paid);
  db.emit('waiting.changed', { playerId });
  db.emit('board.changed');
  return {
    playerId,
    name: player.name,
    paid: record.paid,
    toCredit: record.toCredit,
    at: record.at,
  };
}

/** `GET /undoable` (payments): the payment this worker took less than 2 minutes ago, the latest first. */
export function undoablePayment(db: MockDb, by: PersonRef): UndoablePayment | null {
  const [playerId, record] =
    Object.entries(db.s.checkoutUndo)
      .filter(
        ([, r]) =>
          r.by.id === by.id && r.sheetId === db.s.currentSheetId && canUndo(r.at, db.now()),
      )
      .sort(([, a], [, b]) => Date.parse(b.at) - Date.parse(a.at))[0] ?? [];
  if (!playerId || !record) return null;
  return {
    playerId,
    name: record.name,
    paid: record.paid,
    toCredit: record.toCredit,
    at: record.at,
  };
}
