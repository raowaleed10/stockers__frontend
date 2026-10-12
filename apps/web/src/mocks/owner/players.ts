import type {
  OpeningBalanceRequest,
  OwnerPlayers,
  PaymentRequest,
  PersonRef,
  PlayerChange,
  PlayerFilter,
  PlayerPatch,
  StatementLine,
  StatementLinePatch,
} from '@stockers/shared';
import { formatRs, isOldCredit, runningBalances } from '@stockers/shared';
import { receiveMoney } from '../db/checkout';
import type { MockDb } from '../db/db';
import { fail } from '../db/errors';
import { presentPlayer, searchPlayers } from '../db/players';

const owes = (balance: number) => balance > 0;

/** `GET /players?filter=` (screen 43): everyone, or only those who owe, hold an advance, or owe old credit. */
export function ownerPlayers(db: MockDb, filter: PlayerFilter | undefined): OwnerPlayers {
  const now = db.now();
  const all = searchPlayers(db, undefined, false);
  const matches: Record<
    PlayerFilter,
    (p: { balance: number; oldestUnpaidAt?: string }) => boolean
  > = {
    all: () => true,
    owe: (p) => owes(p.balance),
    advance: (p) => p.balance < 0,
    old: (p) => owes(p.balance) && isOldCredit(p.oldestUnpaidAt, now),
  };
  const chosen = filter && filter in matches ? filter : 'all';
  const { credit } = db.s.aggregates;
  return {
    players: all.filter(matches[chosen]),
    counts: {
      all: all.length,
      owe: all.filter(matches.owe).length,
      advance: all.filter(matches.advance).length,
      old: all.filter(matches.old).length,
    },
    totals: {
      credit: credit.total + db.s.deltas.creditOwed,
      olderThan15Days: credit.olderThan15Days.total,
      advanceHeld: credit.advanceHeld + db.s.deltas.advanceHeld,
    },
  };
}

/** An owner records a payment on a player's page, for example old credit paid in. */
export function recordPayment(
  db: MockDb,
  by: PersonRef,
  playerId: string,
  request: PaymentRequest,
): PlayerChange {
  const player = db.player(playerId);
  if (!db.s.paymentMethods.some((m) => m.id === request.method && m.enabled)) {
    fail('VALIDATION', 'Choose how it was paid.');
  }
  if (!Number.isInteger(request.amount) || request.amount <= 0) {
    fail('VALIDATION', 'The amount is a whole number of rupees above 0.');
  }
  const owedBefore = Math.max(
    0,
    player.balance - db.tonightLines(playerId).reduce((s, l) => s + (l.charge ?? 0), 0),
  );
  const line = db.postLine(playerId, {
    kind: 'payment',
    text: request.note?.trim()
      ? `Payment, ${db.methodName(request.method)}. ${request.note.trim()}`
      : `Payment, ${db.methodName(request.method)}`,
    paid: request.amount,
    method: request.method,
    by,
  });
  receiveMoney(db, request.method, request.amount);
  const oldPaid = Math.min(request.amount, owedBefore);
  if (oldPaid > 0) {
    db.s.today.oldCreditPaid += oldPaid;
    db.s.today.oldCreditPlayers += 1;
  }
  db.history(by, `Payment from ${player.name}: ${formatRs(request.amount)}`, request.amount);
  db.emit('waiting.changed', { playerId });
  return { player: presentPlayer(player, false), line };
}

/** Old credit from the register, or an advance, entered as an opening balance (D28). */
export function setOpeningBalance(
  db: MockDb,
  by: PersonRef,
  playerId: string,
  request: OpeningBalanceRequest,
): PlayerChange {
  const player = db.player(playerId);
  if (!Number.isInteger(request.amount) || request.amount === 0) {
    fail(
      'VALIDATION',
      'Type the amount from the register (more than 0 owed, less than 0 advance).',
    );
  }
  const line = db.postLine(playerId, {
    kind: request.amount > 0 ? 'opening' : 'advance',
    text:
      request.note?.trim() ||
      (request.amount > 0 ? 'Opening balance from the register' : 'Advance paid'),
    ...(request.amount > 0 ? { charge: request.amount } : { paid: -request.amount }),
    by,
  });
  db.history(by, `Opening balance for ${player.name}: ${formatRs(request.amount)}`, request.amount);
  db.emit('waiting.changed', { playerId });
  return { player: presentPlayer(player, false), line };
}

export function patchPlayer(db: MockDb, playerId: string, patch: PlayerPatch) {
  const player = db.player(playerId);
  if (patch.name !== undefined) {
    if (!patch.name.trim()) fail('VALIDATION', 'Type the player’s name.');
    player.name = patch.name.trim();
  }
  if (patch.phone !== undefined) {
    const phone = patch.phone.trim();
    if (phone && phone.replace(/\D/g, '').length < 10)
      fail('VALIDATION', 'That phone number looks too short.');
    if (phone) player.phone = phone;
    else delete player.phone;
  }
  if (patch.nick !== undefined) {
    if (patch.nick.trim()) player.nick = patch.nick.trim();
    else delete player.nick;
  }
  if (patch.note !== undefined) {
    if (patch.note.trim()) player.note = patch.note.trim();
    else delete player.note;
  }
  db.emit('waiting.changed', { playerId });
  return presentPlayer(player, false);
}

function findLine(db: MockDb, lineId: string): StatementLine {
  for (const lines of Object.values(db.s.statements)) {
    const line = lines.find((l) => l.id === lineId);
    if (line) return line;
  }
  return fail('NOT_FOUND', 'That statement line was not found.');
}

/**
 * An owner corrects a line of a statement. The balance of every line after it is worked out again,
 * and the edit is recorded with who, why, and the old and new value (D30).
 */
export function patchStatementLine(
  db: MockDb,
  by: PersonRef,
  lineId: string,
  patch: StatementLinePatch,
): PlayerChange {
  const line = findLine(db, lineId);
  const reason = patch.reason?.trim();
  if (!reason) fail('NOTE_REQUIRED', 'Write why you are changing it.');
  for (const value of [patch.charge, patch.paid]) {
    if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
      fail('VALIDATION', 'Type a whole number, 0 or more.');
    }
  }
  const player = db.player(line.playerId);
  const was = (line.charge ?? 0) - (line.paid ?? 0);
  const oldText = line.text;

  if (patch.charge !== undefined) line.charge = patch.charge;
  if (patch.paid !== undefined) line.paid = patch.paid;
  if (patch.text?.trim()) line.text = patch.text.trim();
  const lines = db.statement(line.playerId);
  runningBalances(lines).forEach((balance, i) => {
    lines[i].balance = balance;
  });
  db.setBalance(player, lines.at(-1)?.balance ?? 0, db.nowIso());

  const now = (line.charge ?? 0) - (line.paid ?? 0);
  db.logActivity(by, 'edit', `Edited ${player.name}’s statement: ${oldText}`, {
    detail: `${formatRs(was)} to ${formatRs(now)}. “${reason}”`,
    amount: now - was,
    sheetId: line.sheetId ?? null,
  });
  db.notify(
    'edited',
    `${by.name.split(' ')[0]} edited ${player.name}’s statement`,
    `${oldText}: ${formatRs(was)} to ${formatRs(now)}.`,
    now - was,
  );
  db.emit('waiting.changed', { playerId: player.id });
  return { player: presentPlayer(player, false), line };
}
