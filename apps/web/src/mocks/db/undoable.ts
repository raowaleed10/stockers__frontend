import type { PersonRef, UndoableActions } from '@stockers/shared';
import { undoablePayment } from './checkout';
import type { MockDb } from './db';
import { undoableCharge } from './games';

/** `GET /undoable`: what the signed-in worker can still take back (a charged frame, a payment), 2 minutes at most. */
export function undoableActions(db: MockDb, by: PersonRef): UndoableActions {
  return { charge: undoableCharge(db, by), payment: undoablePayment(db, by) };
}
