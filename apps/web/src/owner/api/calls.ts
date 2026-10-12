import type {
  ActivityEvent,
  ActivityList,
  ActivityQuery,
  BoardResponse,
  CanteenItem,
  CategoryPatch,
  DecideRequest,
  Dashboard,
  EditEntryRequest,
  ExportFormat,
  Expense,
  ExpenseRequest,
  NewCanteenItemRequest,
  NewTableRequest,
  NewWorkerRequest,
  NotificationList,
  OpeningBalanceRequest,
  OwnerAddressResult,
  OwnerCanteen,
  OwnerExpenses,
  OwnerPlayers,
  OwnerSession,
  OwnerSettings,
  OwnerSignInRequest,
  OwnerWorker,
  PaymentRequest,
  PinRequest,
  PlayerChange,
  PlayerFilter,
  PlayerPatch,
  PlayerStatement,
  PlayerWithTail,
  PriceCard,
  Prices,
  Reports,
  ReportsQuery,
  SettingsPatch,
  SheetDetail,
  SheetFolder,
  SheetRow,
  StatementLinePatch,
  StockRequest,
  Table,
  TablePatch,
  WorkerPatch,
} from '@stockers/shared';
import { createApiClient } from '@/lib/api-client';

/** The owner portal's API (docs/06 §3). Every call answers with data, or throws an `ApiError`. */
const api = createApiClient('/api/owner');

// Sign-in
export const signIn = (request: OwnerSignInRequest) =>
  api.post<OwnerSession>('/auth/sign-in', request);
export const getMe = () => api.get<OwnerSession>('/auth/me');
export const signOut = () => api.post<{ ok: true }>('/auth/sign-out');
export const signOutAll = () => api.post<{ ok: true }>('/auth/sign-out-all');

// Dashboard, reports, activity
export const getDashboard = () => api.get<Dashboard>('/dashboard');
export const getReports = (query: ReportsQuery = {}) => api.get<Reports>('/reports', { ...query });
export const getActivity = (query: ActivityQuery = {}) =>
  api.get<ActivityList>('/activity', { ...query });
export const decideDispute = (id: string, request: DecideRequest) =>
  api.post<ActivityEvent>(`/activity/${id}/decide`, request);

// Sheets
export const getSheetFolders = () => api.get<SheetFolder[]>('/sheets/folders');
export const getSheets = (month: string) => api.get<SheetRow[]>('/sheets', { month });
export const getSheet = (id: string) => api.get<SheetDetail>(`/sheets/${id}`);
export const editSheetEntry = (id: string, entryId: string, request: EditEntryRequest) =>
  api.patch<SheetDetail>(`/sheets/${id}/entries/${entryId}`, request);
/** The PDF or Excel file of a sheet, to save. */
export const exportSheet = (id: string, format: ExportFormat) =>
  api.blob(`/sheets/${id}/export`, { format });

// Players
export const getPlayers = (filter?: PlayerFilter) => api.get<OwnerPlayers>('/players', { filter });
export const getPlayer = (id: string) => api.get<PlayerStatement>(`/players/${id}`);
export const addPayment = (id: string, request: PaymentRequest) =>
  api.post<PlayerChange>(`/players/${id}/payments`, request);
export const setOpeningBalance = (id: string, request: OpeningBalanceRequest) =>
  api.post<PlayerChange>(`/players/${id}/opening-balance`, request);
export const patchPlayer = (id: string, patch: PlayerPatch) =>
  api.patch<PlayerWithTail>(`/players/${id}`, patch);
export const patchStatementLine = (id: string, patch: StatementLinePatch) =>
  api.patch<PlayerChange>(`/statement-lines/${id}`, patch);

// Prices and games
export const getPrices = () => api.get<Prices>('/prices');
export const patchTable = (id: string, patch: TablePatch) =>
  api.patch<Table[]>(`/tables/${id}`, patch);
export const patchCategory = (id: string, patch: CategoryPatch) =>
  api.patch<PriceCard>(`/categories/${id}`, patch);
export const addTable = (request: NewTableRequest) => api.post<Table>('/tables', request);

// Canteen
export const getCanteen = () => api.get<OwnerCanteen>('/canteen');
export const addCanteenItem = (request: NewCanteenItemRequest) =>
  api.post<CanteenItem>('/canteen/items', request);
export const addStock = (request: StockRequest) => api.post<CanteenItem>('/canteen/stock', request);

// Expenses
export const getExpenses = (month?: string) => api.get<OwnerExpenses>('/expenses', { month });
export const addExpense = (request: ExpenseRequest) => api.post<Expense>('/expenses', request);
export const patchExpense = (id: string, patch: Partial<ExpenseRequest>) =>
  api.patch<Expense>(`/expenses/${id}`, patch);
export const deleteExpense = (id: string) => api.delete<Expense>(`/expenses/${id}`);

// Workers
export const getWorkers = () => api.get<OwnerWorker[]>('/workers');
export const addWorker = (request: NewWorkerRequest) => api.post<OwnerWorker>('/workers', request);
export const patchWorker = (id: string, patch: WorkerPatch) =>
  api.patch<OwnerWorker>(`/workers/${id}`, patch);
export const setWorkerPin = (id: string, request: PinRequest) =>
  api.post<OwnerWorker>(`/workers/${id}/pin`, request);

// Settings
export const getSettings = () => api.get<OwnerSettings>('/settings');
export const patchSettings = (patch: SettingsPatch) => api.patch<OwnerSettings>('/settings', patch);
/** Makes a new private address and signs every owner out. */
export const changeOwnerAddress = () => api.post<OwnerAddressResult>('/settings/owner-address');

// Live board, notifications
export const getLive = () => api.get<BoardResponse>('/live');
export const getNotifications = () => api.get<NotificationList>('/notifications');
export const readAllNotifications = () => api.post<NotificationList>('/notifications/read-all');
