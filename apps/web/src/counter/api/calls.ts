import type {
  AlertList,
  BoardResponse,
  CancelRequest,
  CanteenSale,
  CanteenSaleRequest,
  ChangeTypeRequest,
  CheckoutBill,
  CheckoutList,
  CheckoutRequest,
  CheckoutResult,
  ClosePreview,
  ClubStatus,
  CloseSheetRequest,
  CloseSheetResult,
  CounterCanteenItem,
  DamageRequest,
  DiscardRequest,
  DisputeRequest,
  DrawerExpenseRequest,
  DrawerExpenseResult,
  EndGameRequest,
  EndGameResult,
  Game,
  GamesResult,
  GameView,
  MoveGameRequest,
  NewPlayerRequest,
  PlayerStatement,
  PlayerWithTail,
  PublicWorker,
  ReplacePlayerRequest,
  SignInRequest,
  StartGameRequest,
  StartRoomRequest,
  StatementLine,
  TodayTotals,
  UnlockRequest,
  WorkerSession,
} from '@stockers/shared';
import { createApiClient } from '@/lib/api-client';

/** The counter's API (docs/06 §2). Every call answers with data, or throws an `ApiError`. */
const api = createApiClient('/api/counter');

// Sign-in
export const getPublicWorkers = () => api.get<PublicWorker[]>('/workers/public');
export const getClubStatus = () => api.get<ClubStatus>('/club-status');
export const signIn = (request: SignInRequest) => api.post<WorkerSession>('/auth/sign-in', request);
export const unlock = (request: UnlockRequest) => api.post<WorkerSession>('/auth/unlock', request);
export const signOut = () => api.post<{ ok: true }>('/auth/sign-out');
export const getMe = () => api.get<WorkerSession>('/auth/me');

// The bell
export const getAlerts = () => api.get<AlertList>('/alerts');
export const readAllAlerts = () => api.post<AlertList>('/alerts/read-all');

// Board and games
export const getBoard = (category?: string) => api.get<BoardResponse>('/board', { category });
export const getGame = (id: string) => api.get<GameView>(`/games/${id}`);
export const startGame = (request: StartGameRequest) => api.post<Game>('/games', request);
export const changeGameType = (id: string, request: ChangeTypeRequest) =>
  api.post<Game>(`/games/${id}/change-type`, request);
export const pauseGame = (id: string) => api.post<Game>(`/games/${id}/pause`);
export const resumeGame = (id: string) => api.post<Game>(`/games/${id}/resume`);
export const pauseAll = () => api.post<GamesResult>('/games/pause-all');
export const resumeAll = () => api.post<GamesResult>('/games/resume-all');
export const moveGame = (id: string, request: MoveGameRequest) =>
  api.post<Game>(`/games/${id}/move`, request);
export const replacePlayer = (id: string, request: ReplacePlayerRequest) =>
  api.post<Game>(`/games/${id}/replace`, request);
export const discardGame = (id: string, request: DiscardRequest) =>
  api.post<Game>(`/games/${id}/discard`, request);
export const disputeGame = (id: string, request: DisputeRequest) =>
  api.post<Game>(`/games/${id}/dispute`, request);
export const cancelGame = (id: string, request: CancelRequest) =>
  api.post<Game>(`/games/${id}/cancel`, request);
export const undoGame = (id: string) => api.post<Game>(`/games/${id}/undo`);
export const damageCharge = (id: string, request: DamageRequest) =>
  api.post<StatementLine>(`/games/${id}/damage`, request);
export const endGame = (id: string, request: EndGameRequest) =>
  api.post<EndGameResult>(`/games/${id}/end`, request);
export const nextFrame = (id: string) => api.post<Game>(`/games/${id}/next`);
export const endCentury = (id: string) => api.post<EndGameResult>(`/games/${id}/end-century`);
export const startRoom = (tableId: string, request: StartRoomRequest) =>
  api.post<Game>(`/rooms/${tableId}/start`, request);
export const endRoom = (id: string) => api.post<EndGameResult>(`/games/${id}/end-room`);

// Players
export const searchPlayers = (q?: string) => api.get<PlayerWithTail[]>('/players', { q });
export const createPlayer = (request: NewPlayerRequest) =>
  api.post<PlayerWithTail>('/players', request);
export const getStatement = (id: string) => api.get<PlayerStatement>(`/players/${id}/statement`);

// Checkout
export const getCheckoutList = () => api.get<CheckoutList>('/checkout');
export const getCheckoutBill = (playerId: string) => api.get<CheckoutBill>(`/checkout/${playerId}`);
export const payCheckout = (playerId: string, request: CheckoutRequest) =>
  api.post<CheckoutResult>(`/checkout/${playerId}`, request);

// Canteen, drawer, the day, closing
export const getCanteenItems = () => api.get<CounterCanteenItem[]>('/canteen/items');
export const sellCanteen = (request: CanteenSaleRequest) =>
  api.post<CanteenSale>('/canteen/sales', request);
export const addDrawerExpense = (request: DrawerExpenseRequest) =>
  api.post<DrawerExpenseResult>('/expenses/drawer', request);
export const getToday = () => api.get<TodayTotals>('/today');
export const getClosePreview = () => api.get<ClosePreview>('/sheets/current/close-preview');
export const closeSheet = (request: CloseSheetRequest) =>
  api.post<CloseSheetResult>('/sheets/current/close', request);
