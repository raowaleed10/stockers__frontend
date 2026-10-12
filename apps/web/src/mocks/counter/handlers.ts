import type {
  CancelRequest,
  CanteenSaleRequest,
  ChangeTypeRequest,
  CheckoutRequest,
  CloseSheetRequest,
  DamageRequest,
  DiscardRequest,
  DisputeRequest,
  DrawerExpenseRequest,
  EndGameRequest,
  MoveGameRequest,
  NewPlayerRequest,
  PersonRef,
  ReplacePlayerRequest,
  SignInRequest,
  StartGameRequest,
  StartRoomRequest,
  UnlockRequest,
} from '@stockers/shared';
import { http, type RequestHandler } from 'msw';
import {
  publicWorkers,
  requireWorker,
  workerMe,
  workerSignIn,
  workerSignOut,
  workerUnlock,
} from '../db/auth';
import { counterAlerts, readAllCounterAlerts } from '../db/alerts';
import { board } from '../db/board';
import { canteenSale, counterCanteenItems } from '../db/canteen';
import { checkout, checkoutBill, checkoutList } from '../db/checkout';
import type { MockDb } from '../db/db';
import {
  cancelGame,
  changeGameType,
  damageCharge,
  discardGame,
  disputeGame,
  endCentury,
  endGame,
  endRoom,
  gameView,
  moveGame,
  nextFrame,
  pauseAll,
  pauseGame,
  replacePlayer,
  resumeAll,
  resumeGame,
  startGame,
  startRoom,
  undoGame,
} from '../db/games';
import { createPlayer, searchPlayers, statementOf } from '../db/players';
import { closePreview, closeSheet, drawerExpense, todayTotals } from '../db/sheet';
import { endpoint, type Call } from '../http';

const B = '/api/counter';

/**
 * The counter API (docs/06 §2). Everything except the sign-in page's own calls needs a worker
 * session: without one the answer is 401, and a worker whose time is over is signed out first.
 */
export function buildCounterHandlers(getDb: () => MockDb): RequestHandler[] {
  /** An endpoint that runs as the signed-in worker. */
  const asWorker = <T = Record<string, unknown>>(
    run: (db: MockDb, by: PersonRef, call: Call<T>) => unknown,
  ) =>
    endpoint<T>((call) => {
      const db = getDb();
      return run(db, requireWorker(db).by, call);
    });

  return [
    http.get(
      `${B}/health`,
      endpoint(() => ({ ok: true })),
    ),

    // Sign-in page
    http.get(
      `${B}/workers/public`,
      endpoint(() => publicWorkers(getDb())),
    ),
    http.post(
      `${B}/auth/sign-in`,
      endpoint<SignInRequest>(({ body }) => workerSignIn(getDb(), body)),
    ),
    http.post(
      `${B}/auth/unlock`,
      endpoint<UnlockRequest>(({ body }) => workerUnlock(getDb(), body)),
    ),
    http.post(
      `${B}/auth/sign-out`,
      endpoint(() => workerSignOut(getDb())),
    ),
    http.get(
      `${B}/auth/me`,
      endpoint(() => workerMe(getDb())),
    ),

    // Board
    http.get(
      `${B}/board`,
      asWorker((db, _by, { query }) => board(db, query.get('category') ?? undefined)),
    ),

    // The bell
    http.get(
      `${B}/alerts`,
      asWorker((db) => counterAlerts(db)),
    ),
    http.post(
      `${B}/alerts/read-all`,
      asWorker((db) => readAllCounterAlerts(db)),
    ),

    // Games
    http.get(
      `${B}/games/:id`,
      asWorker((db, _by, c) => gameView(db, c.param('id'))),
    ),
    http.post(
      `${B}/games`,
      asWorker<StartGameRequest>((db, by, { body }) => startGame(db, by, body)),
    ),
    http.post(
      `${B}/games/pause-all`,
      asWorker((db, by) => pauseAll(db, by)),
    ),
    http.post(
      `${B}/games/resume-all`,
      asWorker((db, by) => resumeAll(db, by)),
    ),
    http.post(
      `${B}/games/:id/change-type`,
      asWorker<ChangeTypeRequest>((db, by, c) => changeGameType(db, by, c.param('id'), c.body)),
    ),
    http.post(
      `${B}/games/:id/pause`,
      asWorker((db, by, c) => pauseGame(db, by, c.param('id'))),
    ),
    http.post(
      `${B}/games/:id/resume`,
      asWorker((db, by, c) => resumeGame(db, by, c.param('id'))),
    ),
    http.post(
      `${B}/games/:id/move`,
      asWorker<MoveGameRequest>((db, by, c) => moveGame(db, by, c.param('id'), c.body)),
    ),
    http.post(
      `${B}/games/:id/replace`,
      asWorker<ReplacePlayerRequest>((db, by, c) => replacePlayer(db, by, c.param('id'), c.body)),
    ),
    http.post(
      `${B}/games/:id/discard`,
      asWorker<DiscardRequest>((db, by, c) => discardGame(db, by, c.param('id'), c.body)),
    ),
    http.post(
      `${B}/games/:id/dispute`,
      asWorker<DisputeRequest>((db, by, c) => disputeGame(db, by, c.param('id'), c.body)),
    ),
    http.post(
      `${B}/games/:id/cancel`,
      asWorker<CancelRequest>((db, by, c) => cancelGame(db, by, c.param('id'), c.body)),
    ),
    http.post(
      `${B}/games/:id/undo`,
      asWorker((db, by, c) => undoGame(db, by, c.param('id'))),
    ),
    http.post(
      `${B}/games/:id/damage`,
      asWorker<DamageRequest>((db, by, c) => damageCharge(db, by, c.param('id'), c.body)),
    ),
    http.post(
      `${B}/games/:id/end`,
      asWorker<EndGameRequest>((db, by, c) => endGame(db, by, c.param('id'), c.body)),
    ),
    http.post(
      `${B}/games/:id/next`,
      asWorker((db, by, c) => nextFrame(db, by, c.param('id'))),
    ),
    http.post(
      `${B}/games/:id/end-century`,
      asWorker((db, by, c) => endCentury(db, by, c.param('id'))),
    ),
    http.post(
      `${B}/games/:id/end-room`,
      asWorker((db, by, c) => endRoom(db, by, c.param('id'))),
    ),
    http.post(
      `${B}/rooms/:tableId/start`,
      asWorker<StartRoomRequest>((db, by, c) => startRoom(db, by, c.param('tableId'), c.body)),
    ),

    // Players
    http.get(
      `${B}/players`,
      asWorker((db, _by, { query }) => searchPlayers(db, query.get('q') ?? undefined, true)),
    ),
    http.post(
      `${B}/players`,
      asWorker<NewPlayerRequest>((db, _by, { body }) => createPlayer(db, body, true)),
    ),
    http.get(
      `${B}/players/:id/statement`,
      asWorker((db, _by, c) => statementOf(db, c.param('id'), true)),
    ),

    // Checkout
    http.get(
      `${B}/checkout`,
      asWorker((db) => checkoutList(db)),
    ),
    http.get(
      `${B}/checkout/:playerId`,
      asWorker((db, _by, c) => checkoutBill(db, c.param('playerId'), true)),
    ),
    http.post(
      `${B}/checkout/:playerId`,
      asWorker<CheckoutRequest>((db, by, c) => checkout(db, by, c.param('playerId'), c.body, true)),
    ),

    // Canteen, drawer, the day, closing
    http.get(
      `${B}/canteen/items`,
      asWorker((db) => counterCanteenItems(db)),
    ),
    http.post(
      `${B}/canteen/sales`,
      asWorker<CanteenSaleRequest>((db, by, { body }) => canteenSale(db, by, body)),
    ),
    http.post(
      `${B}/expenses/drawer`,
      asWorker<DrawerExpenseRequest>((db, by, { body }) => drawerExpense(db, by, body)),
    ),
    http.get(
      `${B}/today`,
      asWorker((db) => todayTotals(db)),
    ),
    http.get(
      `${B}/sheets/current/close-preview`,
      asWorker((db, by) => closePreview(db, by)),
    ),
    http.post(
      `${B}/sheets/current/close`,
      asWorker<CloseSheetRequest>((db, by, { body }) => closeSheet(db, by, body)),
    ),
  ];
}
