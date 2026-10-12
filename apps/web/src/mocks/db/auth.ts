import type {
  PersonRef,
  PublicWorker,
  SignInRequest,
  UnlockRequest,
  WorkerSession,
} from '@stockers/shared';
import { formatClock, formatSlot, isWithinSlot, slotEndAfter, toClubIso } from '@stockers/shared';
import type { MockDb } from './db';
import { fail } from './errors';
import type { StoredWorker, Tries } from './state';

const MAX_WRONG_PINS = 5;
const LOCK_MS = 5 * 60_000;

/**
 * Ends a worker's sign-in and writes it down. A worker session event is not Activity: Activity is only
 * for what changed money outside a normal game (screen 38). The Workers page shows these (screen 50).
 */
function signOutWorker(
  db: MockDb,
  worker: StoredWorker,
  kind: 'sign-out' | 'auto-sign-out',
  at: string,
): void {
  worker.lastSignIn = { at: worker.signedIn?.at ?? worker.lastSignIn?.at ?? at, until: at };
  delete worker.signedIn;
  db.workerEvent(worker.id, kind, at);
}

/**
 * Signs out every worker whose time is over (D51): games keep running and stay recorded under him.
 * The sign-out is dated when his time ended, not when somebody noticed.
 */
export function sweepWorkers(db: MockDb): void {
  const now = db.now();
  for (const worker of db.s.workers) {
    if (!worker.signedIn) continue;
    if (worker.enabled && isWithinSlot(now, worker.slot)) continue;
    const planned = slotEndAfter(worker.signedIn.at, worker.slot).getTime();
    signOutWorker(db, worker, 'auto-sign-out', toClubIso(Math.min(planned, now)));
    const session = db.s.auth.session;
    if (session?.kind === 'worker' && session.workerId === worker.id) db.s.auth.session = null;
    db.emit('worker.signedOut', { workerId: worker.id });
  }
}

/** `GET /workers/public`: names and times only. Never the PIN. */
export function publicWorkers(db: MockDb): PublicWorker[] {
  sweepWorkers(db);
  const now = db.now();
  return db.s.workers
    .filter((worker) => worker.enabled)
    .map((worker) => ({
      id: worker.id,
      name: worker.name,
      slot: worker.slot,
      canSignInNow: isWithinSlot(now, worker.slot),
    }));
}

function sessionFor(db: MockDb, worker: StoredWorker): WorkerSession {
  return {
    worker: { id: worker.id, name: worker.name, slot: worker.slot },
    until: toClubIso(slotEndAfter(db.now(), worker.slot).getTime()),
  };
}

function triesFor(db: MockDb, workerId: string): Tries {
  return (db.s.auth.pinTries[workerId] ??= { count: 0, lockedUntil: 0 });
}

function refuseWhileLocked(db: MockDb, tries: Tries): void {
  const now = db.now();
  if (tries.lockedUntil > now) {
    const retryAfterSec = Math.ceil((tries.lockedUntil - now) / 1000);
    fail('TOO_MANY_TRIES', 'Wait 5 minutes.', { retryAfterSec });
  }
}

function checkPin(db: MockDb, worker: StoredWorker, pin: string): void {
  const tries = triesFor(db, worker.id);
  if (pin === worker.pin) {
    tries.count = 0;
    return;
  }
  tries.count += 1;
  if (tries.count >= MAX_WRONG_PINS) {
    tries.count = 0;
    tries.lockedUntil = db.now() + LOCK_MS;
    db.workerEvent(worker.id, 'pin-lockout');
    fail('TOO_MANY_TRIES', 'Wait 5 minutes.', { retryAfterSec: LOCK_MS / 1000 });
  }
  fail('WRONG_PIN', 'Wrong PIN. Try again.');
}

/** Signs a worker in. The time of day is checked first, then the PIN. The device clock is never trusted. */
export function workerSignIn(db: MockDb, request: SignInRequest): WorkerSession {
  sweepWorkers(db);
  const worker = db.s.workers.find((w) => w.id === request.workerId && w.enabled);
  if (!worker) fail('NOT_FOUND', 'That worker was not found.');

  const tries = triesFor(db, worker.id);
  refuseWhileLocked(db, tries);
  const now = db.now();
  if (!isWithinSlot(now, worker.slot)) {
    db.workerEvent(worker.id, 'not-your-time');
    fail(
      'NOT_YOUR_TIME',
      `Not your time to sign in. ${worker.name} can sign in from ${formatSlot(worker.slot)}. ` +
        `It is ${formatClock(toClubIso(now))} now. Only an owner can change sign-in times.`,
      { slot: worker.slot, now: db.nowIso() },
    );
  }
  checkPin(db, worker, request.pin);

  // Only one worker is at the counter: whoever was signed in is signed out.
  for (const other of db.s.workers) {
    if (other.id !== worker.id && other.signedIn) signOutWorker(db, other, 'sign-out', db.nowIso());
  }
  worker.signedIn = { at: db.nowIso() };
  worker.lastSignIn = { at: db.nowIso() };
  db.workerEvent(worker.id, 'sign-in');
  db.s.auth.session = { kind: 'worker', workerId: worker.id, at: db.nowIso() };
  db.emit('worker.signedIn', { workerId: worker.id });
  return sessionFor(db, worker);
}

/**
 * The worker behind the request. No worker session is a 401. A worker whose time is over is signed
 * out at once (D51): games keep running and stay recorded under him.
 */
export function requireWorker(db: MockDb): { worker: StoredWorker; by: PersonRef } {
  const hadWorkerSession = db.s.auth.session?.kind === 'worker';
  sweepWorkers(db);
  const session = db.s.auth.session;
  if (session?.kind !== 'worker') {
    if (hadWorkerSession) fail('SESSION_ENDED', 'Your sign-in time is over.');
    fail('UNAUTHENTICATED', 'Please sign in.');
  }
  const worker = db.s.workers.find((w) => w.id === session.workerId);
  if (!worker) {
    db.s.auth.session = null;
    return fail('UNAUTHENTICATED', 'Please sign in.');
  }
  if (!worker.enabled || !isWithinSlot(db.now(), worker.slot)) {
    // A session opened with ?as= that was never a real sign-in: end it the same way.
    signOutWorker(db, worker, 'auto-sign-out', db.nowIso());
    db.s.auth.session = null;
    db.emit('worker.signedOut', { workerId: worker.id });
    fail('SESSION_ENDED', 'Your sign-in time is over.');
  }
  return { worker, by: db.workerPerson(worker) };
}

export function workerMe(db: MockDb): WorkerSession {
  return sessionFor(db, requireWorker(db).worker);
}

/** The lock screen (screen 34): the signed-in worker enters his PIN again. */
export function workerUnlock(db: MockDb, request: UnlockRequest): WorkerSession {
  const { worker } = requireWorker(db);
  refuseWhileLocked(db, triesFor(db, worker.id));
  checkPin(db, worker, request.pin);
  return sessionFor(db, worker);
}

/** "Switch worker" (screen 34): he signs out himself. */
export function workerSignOut(db: MockDb): void {
  const session = db.s.auth.session;
  if (session?.kind !== 'worker') return;
  const worker = db.s.workers.find((w) => w.id === session.workerId);
  if (worker?.signedIn) signOutWorker(db, worker, 'sign-out', db.nowIso());
  db.s.auth.session = null;
  db.emit('worker.signedOut', worker ? { workerId: worker.id } : undefined);
}
