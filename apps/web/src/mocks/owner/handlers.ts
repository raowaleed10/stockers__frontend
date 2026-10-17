import type {
  CategoryPatch,
  DecideRequest,
  EditEntryRequest,
  ExpenseRequest,
  ExportFormat,
  NewCanteenItemRequest,
  NewTableRequest,
  NewWorkerRequest,
  OpeningBalanceRequest,
  OwnerSignInRequest,
  PaymentRequest,
  PersonRef,
  PinRequest,
  PlayerFilter,
  PlayerPatch,
  SettingsPatch,
  StatementLinePatch,
  StockRequest,
  TablePatch,
  WorkerPatch,
} from '@stockers/shared';
import { http, type RequestHandler } from 'msw';
import type { MockDb } from '../db/db';
import { fail } from '../db/errors';
import { statementOf } from '../db/players';
import { endpoint, fileEndpoint, type Call } from '../http';
import { activityList, decideDispute } from './activity';
import { ownerMe, ownerSignIn, ownerSignOut, publicOwners, requireOwner } from './auth';
import {
  addCanteenItem,
  addStock,
  addTable,
  ownerCanteen,
  patchCategory,
  patchTable,
  prices,
} from './catalog';
import {
  ownerPlayers,
  patchPlayer,
  patchStatementLine,
  recordPayment,
  setOpeningBalance,
} from './players';
import { dashboard, live, notifications, readAllNotifications, reports } from './reports';
import { editEntry, exportSheet, sheetDetail, sheetFolders, sheetsOfMonth } from './sheets';
import {
  addExpense,
  addWorker,
  changeOwnerAddress,
  deleteExpense,
  getSettings,
  listExpenses,
  listWorkers,
  patchExpense,
  patchSettings,
  patchWorker,
  setWorkerPin,
  signOutAll,
} from './staff';

const B = '/api/owner';

/**
 * The owner API (docs/06 §3). Everything except sign-in needs an owner session. Without one the
 * answer is 401; a counter (worker) session gets 404, as if this API did not exist.
 */
export function buildOwnerHandlers(getDb: () => MockDb): RequestHandler[] {
  /** An endpoint that runs as the signed-in owner. */
  const asOwner = <T = Record<string, unknown>>(
    run: (db: MockDb, by: PersonRef, call: Call<T>) => unknown,
  ) =>
    endpoint<T>((call) => {
      const db = getDb();
      return run(db, requireOwner(db).by, call);
    });

  return [
    http.get(
      `${B}/health`,
      endpoint(() => ({ ok: true })),
    ),

    // Sign-in
    http.post(
      `${B}/auth/sign-in`,
      endpoint<OwnerSignInRequest>(({ body }) => ownerSignIn(getDb(), body)),
    ),
    http.get(
      `${B}/auth/owners`,
      endpoint(() => publicOwners(getDb())),
    ),
    http.get(
      `${B}/auth/me`,
      endpoint(() => ownerMe(getDb())),
    ),
    http.post(
      `${B}/auth/sign-out`,
      endpoint(() => ownerSignOut(getDb())),
    ),
    http.post(
      `${B}/auth/sign-out-all`,
      asOwner((db) => signOutAll(db)),
    ),

    // Dashboard, reports, activity
    http.get(
      `${B}/dashboard`,
      asOwner((db) => dashboard(db)),
    ),
    http.get(
      `${B}/reports`,
      asOwner((db, _by, { query }) =>
        reports(db, {
          period: (query.get('period') as 'day' | 'month' | 'year' | null) ?? undefined,
          month: query.get('month') ?? undefined,
          compare: query.get('compare') ?? undefined,
        }),
      ),
    ),
    http.get(
      `${B}/activity`,
      asOwner((db, _by, { query }) =>
        activityList(db, {
          type: (query.get('type') as never) ?? undefined,
          by: query.get('by') ?? undefined,
          from: query.get('from') ?? undefined,
          to: query.get('to') ?? undefined,
        }),
      ),
    ),
    http.post(
      `${B}/activity/:id/decide`,
      asOwner<DecideRequest>((db, by, c) => decideDispute(db, by, c.param('id'), c.body)),
    ),

    // Sheets
    http.get(
      `${B}/sheets/folders`,
      asOwner((db) => sheetFolders(db)),
    ),
    http.get(
      `${B}/sheets`,
      asOwner((db, _by, { query }) => {
        const month = query.get('month');
        if (!month) return fail('VALIDATION', 'Choose a month.');
        return sheetsOfMonth(db, month);
      }),
    ),
    http.get(
      `${B}/sheets/:id`,
      asOwner((db, _by, c) => sheetDetail(db, c.param('id'))),
    ),
    http.patch(
      `${B}/sheets/:id/entries/:entryId`,
      asOwner<EditEntryRequest>((db, by, c) =>
        editEntry(db, by, c.param('id'), c.param('entryId'), c.body),
      ),
    ),
    http.get(
      `${B}/sheets/:id/export`,
      fileEndpoint((c) => {
        const db = getDb();
        requireOwner(db);
        const format = c.query.get('format') ?? 'pdf';
        if (format !== 'pdf' && format !== 'xlsx') return fail('VALIDATION', 'Choose pdf or xlsx.');
        return exportSheet(db, c.param('id'), format as ExportFormat);
      }),
    ),

    // Players
    http.get(
      `${B}/players`,
      asOwner((db, _by, { query }) =>
        ownerPlayers(db, (query.get('filter') as PlayerFilter | null) ?? undefined),
      ),
    ),
    http.get(
      `${B}/players/:id`,
      asOwner((db, _by, c) => statementOf(db, c.param('id'), false)),
    ),
    http.post(
      `${B}/players/:id/payments`,
      asOwner<PaymentRequest>((db, by, c) => recordPayment(db, by, c.param('id'), c.body)),
    ),
    http.post(
      `${B}/players/:id/opening-balance`,
      asOwner<OpeningBalanceRequest>((db, by, c) =>
        setOpeningBalance(db, by, c.param('id'), c.body),
      ),
    ),
    http.patch(
      `${B}/players/:id`,
      asOwner<PlayerPatch>((db, _by, c) => patchPlayer(db, c.param('id'), c.body)),
    ),
    http.patch(
      `${B}/statement-lines/:id`,
      asOwner<StatementLinePatch>((db, by, c) => patchStatementLine(db, by, c.param('id'), c.body)),
    ),

    // Prices and games
    http.get(
      `${B}/prices`,
      asOwner((db) => prices(db)),
    ),
    http.patch(
      `${B}/tables/:id`,
      asOwner<TablePatch>((db, by, c) => patchTable(db, by, c.param('id'), c.body)),
    ),
    http.patch(
      `${B}/categories/:id`,
      asOwner<CategoryPatch>((db, by, c) => patchCategory(db, by, c.param('id'), c.body)),
    ),
    http.post(
      `${B}/tables`,
      asOwner<NewTableRequest>((db, _by, { body }) => addTable(db, body)),
    ),

    // Canteen
    http.get(
      `${B}/canteen`,
      asOwner((db) => ownerCanteen(db)),
    ),
    http.post(
      `${B}/canteen/items`,
      asOwner<NewCanteenItemRequest>((db, _by, { body }) => addCanteenItem(db, body)),
    ),
    http.post(
      `${B}/canteen/stock`,
      asOwner<StockRequest>((db, _by, { body }) => addStock(db, body)),
    ),

    // Expenses
    http.get(
      `${B}/expenses`,
      asOwner((db, _by, { query }) => listExpenses(db, query.get('month') ?? undefined)),
    ),
    http.post(
      `${B}/expenses`,
      asOwner<ExpenseRequest>((db, by, { body }) => addExpense(db, by, body)),
    ),
    http.patch(
      `${B}/expenses/:id`,
      asOwner<Partial<ExpenseRequest>>((db, by, c) => patchExpense(db, by, c.param('id'), c.body)),
    ),
    http.delete(
      `${B}/expenses/:id`,
      asOwner((db, by, c) => deleteExpense(db, by, c.param('id'))),
    ),

    // Workers
    http.get(
      `${B}/workers`,
      asOwner((db) => listWorkers(db)),
    ),
    http.post(
      `${B}/workers`,
      asOwner<NewWorkerRequest>((db, by, { body }) => addWorker(db, by, body)),
    ),
    http.patch(
      `${B}/workers/:id`,
      asOwner<WorkerPatch>((db, by, c) => patchWorker(db, by, c.param('id'), c.body)),
    ),
    http.post(
      `${B}/workers/:id/pin`,
      asOwner<PinRequest>((db, by, c) => setWorkerPin(db, by, c.param('id'), c.body)),
    ),

    // Settings
    http.get(
      `${B}/settings`,
      asOwner((db) => getSettings(db)),
    ),
    http.patch(
      `${B}/settings`,
      asOwner<SettingsPatch>((db, by, { body }) => patchSettings(db, by, body)),
    ),
    http.post(
      `${B}/settings/owner-address`,
      asOwner((db, by) => changeOwnerAddress(db, by)),
    ),

    // Live board, notifications
    http.get(
      `${B}/live`,
      asOwner((db) => live(db)),
    ),
    http.get(
      `${B}/notifications`,
      asOwner((db) => notifications(db)),
    ),
    http.post(
      `${B}/notifications/read-all`,
      asOwner((db) => readAllNotifications(db)),
    ),
  ];
}
