import type { PersonRef, UndoableActions } from '@stockers/shared';
import { undoableSale } from './canteen';
import { undoablePayment } from './checkout';
import type { MockDb } from './db';
import { undoableCharge } from './games';
import { undoableExpense } from './sheet';

/**
 * `GET /undoable`: what the signed-in worker can still take back, 2 minutes at most (a charged game, a payment, a canteen
 * sale, cash from the drawer).
 */
export function undoableActions(db: MockDb, by: PersonRef): UndoableActions {
  return {
    charge: undoableCharge(db, by),
    payment: undoablePayment(db, by),
    sale: undoableSale(db, by),
    expense: undoableExpense(db, by),
  };
}
