import type {
  Owner,
  OwnerSession,
  OwnerSignInRequest,
  PersonRef,
  PublicOwner,
} from '@stockers/shared';
import type { MockDb } from '../db/db';
import { fail } from '../db/errors';

const MAX_WRONG_PASSWORDS = 5;
const LOCK_MS = 15 * 60_000; // "wait 15 minutes" (screen 35)

/**
 * The owner behind the request. No session is a 401. A counter (worker) session gets a plain 404, as
 * if the owner API did not exist (docs/08 §1).
 */
export function requireOwner(db: MockDb): { owner: Owner; by: PersonRef } {
  const session = db.s.auth.session;
  if (!session) fail('UNAUTHENTICATED', 'Please sign in.');
  if (session.kind !== 'owner') fail('NOT_FOUND', 'Not found.');
  const owner = db.s.owners.find((o) => o.id === session.ownerId);
  if (!owner) {
    db.s.auth.session = null;
    return fail('UNAUTHENTICATED', 'Please sign in.');
  }
  return { owner, by: db.ownerPerson(owner) };
}

/** Sign-in works with any password in development; an empty one counts as wrong. */
export function ownerSignIn(db: MockDb, request: OwnerSignInRequest): OwnerSession {
  const owner = db.s.owners.find((o) => o.id === request.ownerId);
  if (!owner) fail('NOT_FOUND', 'Choose Aqil or Adil.');
  const tries = db.s.auth.ownerTries;
  const now = db.now();
  if (tries.lockedUntil > now) {
    fail('TOO_MANY_TRIES', 'Too many tries. Wait 15 minutes.', {
      retryAfterSec: Math.ceil((tries.lockedUntil - now) / 1000),
    });
  }
  if (!request.password) {
    tries.count += 1;
    if (tries.count >= MAX_WRONG_PASSWORDS) {
      tries.count = 0;
      tries.lockedUntil = now + LOCK_MS;
      fail('TOO_MANY_TRIES', 'Too many tries. Wait 15 minutes.', { retryAfterSec: LOCK_MS / 1000 });
    }
    fail('WRONG_PASSWORD', 'Wrong password. Try again.');
  }
  tries.count = 0;
  owner.lastSeen = db.nowIso();
  db.s.auth.session = { kind: 'owner', ownerId: owner.id, at: db.nowIso() };
  return { owner };
}

/** The names the sign-in page offers (docs/06 §3). No session needed, and nothing but the names. */
export function publicOwners(db: MockDb): PublicOwner[] {
  return db.s.owners.map(({ id, name }) => ({ id, name }));
}

export function ownerMe(db: MockDb): OwnerSession {
  return { owner: requireOwner(db).owner };
}

export function ownerSignOut(db: MockDb): void {
  if (db.s.auth.session?.kind === 'owner') db.s.auth.session = null;
}
