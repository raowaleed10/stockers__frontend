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

/** `GET /workers/public`: names and times only. Never the PIN. */
export function publicWorkers(db: MockDb): PublicWorker[] {
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
    fail('TOO_MANY_TRIES', 'Wait 5 minutes.', { retryAfterSec: LOCK_MS / 1000 });
  }
  fail('WRONG_PIN', 'Wrong PIN. Try again.');
}

/** Signs a worker in. The time of day is checked first, then the PIN. The device clock is never trusted. */
export function workerSignIn(db: MockDb, request: SignInRequest): WorkerSession {
  const worker = db.s.workers.find((w) => w.id === request.workerId && w.enabled);
  if (!worker) fail('NOT_FOUND', 'That worker was not found.');

  const tries = triesFor(db, worker.id);
  refuseWhileLocked(db, tries);
  const now = db.now();
  if (!isWithinSlot(now, worker.slot)) {
    fail(
      'NOT_YOUR_TIME',
      `Not your time to sign in. ${worker.name} can sign in from ${formatSlot(worker.slot)}. ` +
        `It is ${formatClock(toClubIso(now))} now. Only an owner can change sign-in times.`,
      { slot: worker.slot, now: db.nowIso() },
    );
  }
  checkPin(db, worker, request.pin);

  const session = sessionFor(db, worker);
  for (const other of db.s.workers) delete other.signedIn;
  worker.signedIn = { at: db.nowIso() };
  worker.lastSignIn = { at: db.nowIso(), until: session.until };
  db.s.auth.session = { kind: 'worker', workerId: worker.id, at: db.nowIso() };
  db.emit('worker.signedIn', { workerId: worker.id });
  return session;
}

function endSession(db: MockDb, worker: StoredWorker | undefined): void {
  if (worker) {
    delete worker.signedIn;
    if (worker.lastSignIn) worker.lastSignIn.until = db.nowIso();
  }
  db.s.auth.session = null;
  db.emit('worker.signedOut', worker ? { workerId: worker.id } : undefined);
}

/**
 * The worker behind the request. No worker session is a 401. A worker whose time is over is signed
 * out at once (D51): games keep running and stay recorded under him.
 */
export function requireWorker(db: MockDb): { worker: StoredWorker; by: PersonRef } {
  const session = db.s.auth.session;
  if (session?.kind !== 'worker') fail('UNAUTHENTICATED', 'Please sign in.');
  const worker = db.s.workers.find((w) => w.id === session.workerId);
  if (!worker) {
    db.s.auth.session = null;
    return fail('UNAUTHENTICATED', 'Please sign in.');
  }
  if (!worker.enabled || !isWithinSlot(db.now(), worker.slot)) {
    endSession(db, worker);
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

export function workerSignOut(db: MockDb): void {
  const session = db.s.auth.session;
  if (session?.kind !== 'worker') return;
  endSession(
    db,
    db.s.workers.find((w) => w.id === session.workerId),
  );
}
