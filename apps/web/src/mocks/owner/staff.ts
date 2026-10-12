import type {
  Expense,
  ExpenseRequest,
  NewWorkerRequest,
  OwnerAddressResult,
  OwnerExpenses,
  OwnerSettings,
  OwnerWorker,
  PersonRef,
  PinRequest,
  SettingsPatch,
  Worker,
  WorkerPatch,
} from '@stockers/shared';
import { formatRs, formatSlot, slotEndAfter, toClubIso } from '@stockers/shared';
import { sweepWorkers } from '../db/auth';
import type { MockDb } from '../db/db';
import { fail } from '../db/errors';
import type { StoredWorker } from '../db/state';

// Expenses (screen 49) ---------------------------------------------------------------------------

const monthOf = (iso: string) => iso.slice(0, 7);

/** `GET /expenses?month=`: that month's expenses, newest first, with the month total. */
export function listExpenses(db: MockDb, month: string | undefined): OwnerExpenses {
  const key = month ?? monthOf(db.nowIso());
  const now = db.now();
  const items = db.s.expenses
    .filter((e) => monthOf(e.at) === key && Date.parse(e.at) <= now)
    .sort((a, b) => b.at.localeCompare(a.at));
  return {
    month: key,
    total: items.reduce((sum, e) => sum + e.amount, 0),
    drawerTotal: items.filter((e) => e.paidFrom === 'drawer').reduce((sum, e) => sum + e.amount, 0),
    items,
  };
}

function checkExpense(request: Partial<ExpenseRequest>): void {
  if (request.what !== undefined && !request.what.trim())
    fail('VALIDATION', 'Write what it was for.');
  if (request.amount !== undefined && (!Number.isInteger(request.amount) || request.amount <= 0)) {
    fail('VALIDATION', 'The amount is a whole number of rupees above 0.');
  }
  if (
    request.category === 'staff' &&
    request.staffName !== undefined &&
    !request.staffName.trim()
  ) {
    fail('VALIDATION', 'Write the name of the staff member.');
  }
}

/** The month's and the sheet's totals move with an expense (and back when it is changed or removed). */
function moveExpenseTotals(db: MockDb, expense: Expense, sign: 1 | -1): void {
  db.s.deltas.expenses += sign * expense.amount;
  if (expense.sheetId === db.s.currentSheetId) {
    db.s.today.expensesPaidToday += sign * expense.amount;
    if (expense.paidFrom === 'drawer') db.s.today.drawerExpenses += sign * expense.amount;
    else db.s.today.moneyInHand -= sign * expense.amount;
  }
}

export function addExpense(db: MockDb, by: PersonRef, request: ExpenseRequest): Expense {
  checkExpense(request);
  if (!request.what || !request.category || !request.amount) {
    fail('VALIDATION', 'Write what it was for, choose a group and type the amount.');
  }
  const expense: Expense = {
    id: db.nextId('e'),
    at: request.at ?? db.nowIso(),
    what: request.what.trim(),
    category: request.category,
    amount: request.amount,
    paidFrom: request.paidFrom ?? 'owner',
    ...(request.staffName?.trim() ? { staffName: request.staffName.trim() } : {}),
    source: 'owner',
    doneBy: by,
    ...(request.paidFrom === 'drawer' ? { sheetId: db.s.currentSheetId } : {}),
  };
  db.s.expenses.unshift(expense);
  moveExpenseTotals(db, expense, 1);
  return expense;
}

export function patchExpense(
  db: MockDb,
  by: PersonRef,
  id: string,
  patch: Partial<ExpenseRequest>,
): Expense {
  const expense =
    db.s.expenses.find((e) => e.id === id) ?? fail('NOT_FOUND', 'That expense was not found.');
  checkExpense(patch);
  const before = { ...expense };
  moveExpenseTotals(db, expense, -1);
  if (patch.what !== undefined) expense.what = patch.what.trim();
  if (patch.category !== undefined) expense.category = patch.category;
  if (patch.amount !== undefined) expense.amount = patch.amount;
  if (patch.paidFrom !== undefined) expense.paidFrom = patch.paidFrom;
  if (patch.at !== undefined) expense.at = patch.at;
  if (patch.staffName !== undefined) {
    if (patch.staffName.trim()) expense.staffName = patch.staffName.trim();
    else delete expense.staffName;
  }
  moveExpenseTotals(db, expense, 1);
  db.logActivity(by, 'edit', `Edited expense: ${before.what}`, {
    detail: `${formatRs(before.amount)} to ${formatRs(expense.amount)}`,
    amount: before.amount - expense.amount,
    sheetId: expense.sheetId ?? null,
  });
  return expense;
}

export function deleteExpense(db: MockDb, by: PersonRef, id: string): Expense {
  const expense =
    db.s.expenses.find((e) => e.id === id) ?? fail('NOT_FOUND', 'That expense was not found.');
  db.s.expenses = db.s.expenses.filter((e) => e.id !== id);
  moveExpenseTotals(db, expense, -1);
  db.logActivity(by, 'edit', `Removed expense: ${expense.what}`, {
    detail: `${formatRs(expense.amount)} added by ${expense.doneBy.name}`,
    amount: expense.amount,
    sheetId: expense.sheetId ?? null,
  });
  return expense;
}

// Workers (screen 50) ----------------------------------------------------------------------------

/** The worker as the owners see him: the PIN is never sent back. */
function publicWorker(stored: StoredWorker): Worker {
  const worker: Worker & { pin?: string } = { ...stored };
  delete worker.pin;
  return worker;
}

/**
 * A worker as the owners see him (screen 50): his times, whether he is signed in and when he will be
 * signed out automatically, and what happened at sign-in (kept apart from Activity).
 */
function ownerWorker(db: MockDb, stored: StoredWorker): OwnerWorker {
  return {
    ...publicWorker(stored),
    ...(stored.signedIn
      ? { signsOutAt: toClubIso(slotEndAfter(stored.signedIn.at, stored.slot).getTime()) }
      : {}),
    sessionEvents: db.s.workerEvents.filter((e) => e.workerId === stored.id).reverse(),
  };
}

export function listWorkers(db: MockDb): OwnerWorker[] {
  sweepWorkers(db);
  return db.s.workers.map((worker) => ownerWorker(db, worker));
}

function checkPin(pin: string | undefined): string {
  if (!pin || !/^\d{4}$/.test(pin)) fail('VALIDATION', 'A PIN is 4 digits.');
  return pin;
}

function checkSlot(slot: { start: string; end: string } | undefined) {
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!slot || !time.test(slot.start) || !time.test(slot.end) || slot.start === slot.end) {
    fail('VALIDATION', 'Choose a start and an end time.');
  }
  return slot;
}

export function addWorker(db: MockDb, by: PersonRef, request: NewWorkerRequest): OwnerWorker {
  const name = request.name?.trim();
  if (!name) fail('VALIDATION', 'Type the worker’s name.');
  const pin = checkPin(request.pin);
  const slot = checkSlot(request.slot);
  let id =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'worker';
  for (let n = 2; db.s.workers.some((w) => w.id === id); n += 1) id = `${id}-${n}`;
  const worker: StoredWorker = { id, name, slot, enabled: true, pinSet: true, pin };
  db.s.workers.push(worker);
  db.logActivity(by, 'worker-change', `Worker added: ${name}`, {
    detail: `Sign-in time ${formatSlot(slot)}`,
    sheetId: null,
  });
  db.emit('settings.changed');
  return ownerWorker(db, worker);
}

export function patchWorker(
  db: MockDb,
  by: PersonRef,
  id: string,
  patch: WorkerPatch,
): OwnerWorker {
  const worker =
    db.s.workers.find((w) => w.id === id) ?? fail('NOT_FOUND', 'That worker was not found.');
  if (patch.slot !== undefined) {
    const slot = checkSlot(patch.slot);
    db.logActivity(by, 'worker-change', `Sign-in time changed for ${worker.name}`, {
      detail: `${formatSlot(worker.slot)}, changed to ${formatSlot(slot)}`,
      sheetId: null,
    });
    worker.slot = slot;
  }
  if (patch.enabled !== undefined && patch.enabled !== worker.enabled) {
    worker.enabled = patch.enabled;
    db.logActivity(
      by,
      'worker-change',
      `Sign-in turned ${patch.enabled ? 'on' : 'off'} for ${worker.name}`,
      {
        sheetId: null,
      },
    );
  }
  db.emit('settings.changed');
  return ownerWorker(db, worker);
}

/** Sets a new PIN. The PIN is never written to Activity or sent back. */
export function setWorkerPin(
  db: MockDb,
  by: PersonRef,
  id: string,
  request: PinRequest,
): OwnerWorker {
  const worker =
    db.s.workers.find((w) => w.id === id) ?? fail('NOT_FOUND', 'That worker was not found.');
  worker.pin = checkPin(request.pin);
  worker.pinSet = true;
  delete db.s.auth.pinTries[worker.id];
  db.logActivity(by, 'worker-change', `PIN changed for ${worker.name}`, { sheetId: null });
  return ownerWorker(db, worker);
}

// Settings (screen 51) ---------------------------------------------------------------------------

export function getSettings(db: MockDb): OwnerSettings {
  return db.s.settings;
}

export function patchSettings(db: MockDb, by: PersonRef, patch: SettingsPatch): OwnerSettings {
  const { settings } = db.s;
  const changed: string[] = [];

  if (patch.paymentMethods) {
    const ids = patch.paymentMethods.map((m) => m.id);
    if (new Set(ids).size !== ids.length)
      fail('VALIDATION', 'Each payment method needs its own name.');
    if (patch.paymentMethods.some((m) => !m.name.trim()))
      fail('VALIDATION', 'Type the name of the method.');
    const cash = patch.paymentMethods.find((m) => m.id === 'cash');
    if (!cash?.enabled) fail('VALIDATION', 'Cash is always on.');
    settings.paymentMethods = patch.paymentMethods;
    db.s.paymentMethods = patch.paymentMethods;
    changed.push('payment methods');
  }
  if (patch.alerts) {
    settings.alerts = { ...settings.alerts, ...patch.alerts };
    changed.push('alerts');
  }
  if (patch.email) {
    for (const value of Object.values(patch.email)) {
      if (value && !/^\S+@\S+\.\S+$/.test(value))
        fail('VALIDATION', 'That email address does not look right.');
    }
    settings.email = { ...settings.email, ...patch.email };
    changed.push('email addresses');
  }
  if (patch.language) {
    settings.language = { ...settings.language, ...patch.language };
    changed.push('language');
  }
  if (patch.club) {
    if (patch.club.name !== undefined && !patch.club.name.trim())
      fail('VALIDATION', 'Type the name of the club.');
    settings.club = { ...settings.club, ...patch.club };
    changed.push('club details');
  }
  if (changed.length > 0) {
    db.logActivity(by, 'settings-change', `Settings changed: ${changed.join(', ')}`, {
      sheetId: null,
    });
    db.emit('settings.changed');
  }
  return settings;
}

const SLUG_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789';

/** A new private address. Every owner is signed out and must use the new one (D49). */
export function changeOwnerAddress(db: MockDb, by: PersonRef): OwnerAddressResult {
  let slug = 'owner-';
  for (let i = 0; i < 6; i += 1) slug += SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)];
  const domain = db.s.settings.club.domain ?? 'stockers.pk';
  // The address itself is shown once and never written anywhere else.
  db.logActivity(by, 'settings-change', 'Private address changed', {
    detail: 'Every owner was signed out.',
    sheetId: null,
  });
  db.s.auth.session = null;
  db.emit('settings.changed');
  return { address: `${domain}/${slug}/` };
}

export function signOutAll(db: MockDb): void {
  db.s.auth.session = null;
}
