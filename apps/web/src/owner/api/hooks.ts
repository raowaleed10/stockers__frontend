import type { ActivityQuery, PlayerFilter, ReportsQuery } from '@stockers/shared';
import { useQuery } from '@tanstack/react-query';
import { useAction } from '@/lib/use-action';
import * as calls from './calls';
import { ownerKeys as keys } from './keys';

// Reads. Live events refresh them (see live.tsx).

/** Who is signed in. A 401 means nobody is. */
export const useMe = () => useQuery({ queryKey: keys.me, queryFn: calls.getMe, retry: false });
export const useDashboard = () =>
  useQuery({ queryKey: keys.dashboard, queryFn: calls.getDashboard });
export const useReports = (query: ReportsQuery = {}) =>
  useQuery({ queryKey: keys.reports(query), queryFn: () => calls.getReports(query) });
export const useActivity = (filters: ActivityQuery = {}) =>
  useQuery({ queryKey: keys.activity(filters), queryFn: () => calls.getActivity(filters) });
export const useSheetFolders = () =>
  useQuery({ queryKey: keys.sheetFolders, queryFn: calls.getSheetFolders });
export const useSheets = (month: string) =>
  useQuery({ queryKey: keys.sheets(month), queryFn: () => calls.getSheets(month) });
export const useSheet = (id: string) =>
  useQuery({ queryKey: keys.sheet(id), queryFn: () => calls.getSheet(id) });
export const usePlayers = (filter?: PlayerFilter) =>
  useQuery({ queryKey: keys.players(filter), queryFn: () => calls.getPlayers(filter) });
export const usePlayer = (id: string) =>
  useQuery({ queryKey: keys.player(id), queryFn: () => calls.getPlayer(id) });
export const usePrices = () => useQuery({ queryKey: keys.prices, queryFn: calls.getPrices });
export const useCanteen = () => useQuery({ queryKey: keys.canteen, queryFn: calls.getCanteen });
export const useExpenses = (month?: string) =>
  useQuery({ queryKey: keys.expenses(month), queryFn: () => calls.getExpenses(month) });
export const useWorkers = () => useQuery({ queryKey: keys.workers, queryFn: calls.getWorkers });
export const useSettings = () => useQuery({ queryKey: keys.settings, queryFn: calls.getSettings });
export const useNotifications = () =>
  useQuery({ queryKey: keys.notifications, queryFn: calls.getNotifications });
export const useLive = () => useQuery({ queryKey: keys.live, queryFn: calls.getLive });

// Writes. Some have no live event of their own, so they name what to refresh.

const SHEET_KEYS = [
  ['sheet'],
  ['sheets'],
  ['sheetFolders'],
  ['dashboard'],
  ['activity'],
  ['notifications'],
];
const PLAYER_KEYS = [['player'], ['players'], ['dashboard'], ['activity'], ['notifications']];

// Signing in or out changes what every screen may see, so all of it is read again (an empty key matches all).
const EVERYTHING = [[]];
export const useSignIn = () => useAction(calls.signIn, EVERYTHING);
export const useSignOut = () => useAction(calls.signOut, EVERYTHING);
export const useSignOutAll = () => useAction(calls.signOutAll, EVERYTHING);

export const useDecideDispute = () =>
  useAction(
    (v: { id: string; request: Parameters<typeof calls.decideDispute>[1] }) =>
      calls.decideDispute(v.id, v.request),
    [['activity'], ['players'], ['player'], ['dashboard']],
  );
export const useEditSheetEntry = () =>
  useAction(
    (v: { id: string; entryId: string; request: Parameters<typeof calls.editSheetEntry>[2] }) =>
      calls.editSheetEntry(v.id, v.entryId, v.request),
    SHEET_KEYS,
  );

export const useAddPayment = () =>
  useAction(
    (v: { id: string; request: Parameters<typeof calls.addPayment>[1] }) =>
      calls.addPayment(v.id, v.request),
    PLAYER_KEYS,
  );
export const useSetOpeningBalance = () =>
  useAction(
    (v: { id: string; request: Parameters<typeof calls.setOpeningBalance>[1] }) =>
      calls.setOpeningBalance(v.id, v.request),
    PLAYER_KEYS,
  );
export const usePatchPlayer = () =>
  useAction(
    (v: { id: string; patch: Parameters<typeof calls.patchPlayer>[1] }) =>
      calls.patchPlayer(v.id, v.patch),
    PLAYER_KEYS,
  );
export const usePatchStatementLine = () =>
  useAction(
    (v: { id: string; patch: Parameters<typeof calls.patchStatementLine>[1] }) =>
      calls.patchStatementLine(v.id, v.patch),
    PLAYER_KEYS,
  );

export const usePatchTable = () =>
  useAction(
    (v: { id: string; patch: Parameters<typeof calls.patchTable>[1] }) =>
      calls.patchTable(v.id, v.patch),
    [['prices'], ['live'], ['activity']],
  );
export const usePatchCategory = () =>
  useAction(
    (v: { id: string; patch: Parameters<typeof calls.patchCategory>[1] }) =>
      calls.patchCategory(v.id, v.patch),
    [['prices'], ['live'], ['activity']],
  );
export const useAddTable = () => useAction(calls.addTable, [['prices'], ['live']]);

export const useAddCanteenItem = () => useAction(calls.addCanteenItem, [['canteen']]);
export const useAddStock = () => useAction(calls.addStock, [['canteen']]);

const EXPENSE_KEYS = [['expenses'], ['dashboard'], ['activity']];
export const useAddExpense = () => useAction(calls.addExpense, EXPENSE_KEYS);
export const usePatchExpense = () =>
  useAction(
    (v: { id: string; patch: Parameters<typeof calls.patchExpense>[1] }) =>
      calls.patchExpense(v.id, v.patch),
    EXPENSE_KEYS,
  );
export const useDeleteExpense = () => useAction(calls.deleteExpense, EXPENSE_KEYS);

export const useAddWorker = () => useAction(calls.addWorker, [['workers'], ['activity']]);
export const usePatchWorker = () =>
  useAction(
    (v: { id: string; patch: Parameters<typeof calls.patchWorker>[1] }) =>
      calls.patchWorker(v.id, v.patch),
    [['workers'], ['activity']],
  );
export const useSetWorkerPin = () =>
  useAction(
    (v: { id: string; request: Parameters<typeof calls.setWorkerPin>[1] }) =>
      calls.setWorkerPin(v.id, v.request),
    [['workers'], ['activity']],
  );

export const usePatchSettings = () => useAction(calls.patchSettings, [['settings'], ['activity']]);
export const useChangeOwnerAddress = () => useAction(calls.changeOwnerAddress, EVERYTHING);
export const useReadAllNotifications = () =>
  useAction(calls.readAllNotifications, [['notifications'], ['dashboard']]);
