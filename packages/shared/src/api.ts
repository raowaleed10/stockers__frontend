// What the API sends and receives (docs/06 §2 and §3). The mock server and, later, the real backend
// both follow these shapes, so the screens never change. Shapes follow `mock/seed.json`; a later step
// that needs more adds it here, in this one file.

import type { Slot } from './rules/slots';
import type { Settlement } from './rules/checkout';
import type {
  ActivityEvent,
  AppNotification,
  CanteenItem,
  CanteenSale,
  Category,
  CheckoutRequest,
  Expense,
  ExpenseCategory,
  Game,
  GameType,
  ISO,
  Owner,
  PaymentMethod,
  PersonRef,
  Player,
  Rs,
  Session,
  Settings,
  Sheet,
  StatementLine,
  Table,
  WaitingBill,
  Worker,
} from './types';

// ---------------------------------------------------------------------------------------------
// Errors. Every error is `{code, message}`. The message is plain words to show next to the control.
// ---------------------------------------------------------------------------------------------

export type ApiErrorCode =
  | 'UNAUTHENTICATED' // 401: no session
  | 'SESSION_ENDED' // 401: the signed-in worker's time is over
  | 'NOT_YOUR_TIME' // 403: outside the worker's sign-in time; details {slot, now}
  | 'WRONG_PIN' // 401
  | 'WRONG_PASSWORD' // 401
  | 'TOO_MANY_TRIES' // 429; details {retryAfterSec}
  | 'NOT_FOUND' // 404 (also what an owner endpoint answers to a counter session)
  | 'VALIDATION' // 400: something in the request is wrong
  | 'PRICE_NOT_SET' // 409: the table has no price yet
  | 'TABLE_BUSY' // 409
  | 'TABLE_OUT_OF_ORDER' // 409
  | 'UNDO_EXPIRED' // 409: more than 2 minutes
  | 'CHANGE_TYPE_EXPIRED' // 409: more than 5 minutes
  | 'GAME_NOT_RUNNING' // 409
  | 'BILL_MISMATCH' // 400: the parts and credit do not make the bill
  | 'NOTE_REQUIRED' // 400
  | 'OUT_OF_STOCK'; // 409

export interface NotYourTimeDetails {
  slot: Slot;
  now: ISO;
}
export interface TooManyTriesDetails {
  retryAfterSec: number;
}

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}

// ---------------------------------------------------------------------------------------------
// Small shared pieces
// ---------------------------------------------------------------------------------------------

export interface PlayerName {
  id: string;
  name: string;
}

export interface SheetSummary {
  id: string;
  number: number;
  openedAt: ISO;
  openedBy: PersonRef;
}

export interface PlayerWithTail extends Player {
  phoneTail?: string;
}

/** A player and his statement, oldest line first. */
export interface PlayerStatement {
  player: PlayerWithTail;
  lines: StatementLine[];
}

export interface BoardTable extends Table {
  /** The game running, paused or in dispute on this table. */
  game?: Game;
  /** The frames played so far when the same players keep playing (D10). */
  session?: Session;
}

/** One game with its table, the frames played so far, and the names of its players (`GET /games/:id`). */
export interface GameView {
  game: Game;
  table: Table;
  session?: Session;
  players: Record<string, PlayerName>;
}

/** An alert on the counter's bell. Counter alerts are separate from the owners' notifications. */
export interface CounterAlert {
  id: string;
  at: ISO;
  kind: 'out-of-order' | 'game-cancelled' | 'low-stock';
  title: string;
  text: string;
  read: boolean;
}
export interface AlertList {
  alerts: CounterAlert[];
  unread: number;
}

export interface BoardCategory extends Category {
  inUse: number;
  total: number;
}

export interface BoardResponse {
  sheet: SheetSummary;
  categories: BoardCategory[];
  /** `?category=snooker` gives snooker tables and rooms (one tab); the other ids give their own. */
  tables: BoardTable[];
  /** Everyone named on a table, so a tile can show names. */
  players: Record<string, PlayerName>;
  waiting: WaitingBill[];
  /** Unread counter alerts (the bell). */
  unread: number;
  backedUpAt: ISO;
  pausedAll: boolean;
}

// ---------------------------------------------------------------------------------------------
// Counter API (/api/counter/*)
// ---------------------------------------------------------------------------------------------

export interface PublicWorker {
  id: string;
  name: string;
  slot: Slot;
  canSignInNow: boolean;
}

export interface SignInRequest {
  workerId: string;
  pin: string;
}
export interface UnlockRequest {
  pin: string;
}
export interface WorkerSession {
  worker: Pick<Worker, 'id' | 'name' | 'slot'>;
  /** The moment the worker's sign-in time ends. */
  until: ISO;
}

export interface StartGameRequest {
  tableId: string;
  type: GameType;
  playerIds?: [string, string];
  sides?: [string[], string[]];
  underPlayerId?: string;
  /** Century rate or room hourly price, when the worker changed it. */
  price?: Rs;
}
export type ChangeTypeRequest = Omit<StartGameRequest, 'tableId'>;

export interface MoveGameRequest {
  toTableId: string;
}
export interface ReplacePlayerRequest {
  outId: string;
  inId: string;
}
export interface DiscardRequest {
  reason: string;
  note?: string;
}
export interface DisputeRequest {
  note: string;
}
export interface CancelRequest {
  reason: string;
}
export interface DamageRequest {
  playerId: string;
  item: string;
  amount: Rs;
  note: string;
}
export interface EndGameRequest {
  loserIds: string[];
  split?: Record<string, Rs>;
  /** Over 30 minutes: charge double (Q2). */
  chargeDouble?: boolean;
}
export interface EndGameResult {
  game: Game;
  amount: Rs;
  minutes?: number;
  lines: StatementLine[];
}
export interface GamesResult {
  games: Game[];
}
export interface StartRoomRequest {
  underPlayerId: string;
  hourly: Rs;
}

export interface NewPlayerRequest {
  name: string;
  phone?: string;
}

export interface CheckoutList {
  bills: WaitingBill[];
  total: Rs;
}
export interface CheckoutBill {
  player: PlayerWithTail;
  /** Tonight's lines on the open sheet. */
  tonight: StatementLine[];
  oldCredit: Rs;
  advance: Rs;
  tonightTotal: Rs;
  total: Rs;
  methods: PaymentMethod[];
}
export interface CheckoutResult {
  settlement: Settlement;
  player: PlayerWithTail;
  lines: StatementLine[];
}
export type { CheckoutRequest };

export type CounterCanteenItem = Pick<
  CanteenItem,
  'id' | 'name' | 'category' | 'sell' | 'stock' | 'lowAt'
>;
export interface CanteenSaleRequest {
  /** `null` is a cash sale with no name (Q10). */
  playerId: string | null;
  items: { itemId: string; qty: number }[];
  /** The method the money is taken in now. Required when there is no player. */
  payNow?: string;
}

export interface DrawerExpenseRequest {
  category: ExpenseCategory;
  amount: Rs;
  note: string;
}
export interface DrawerExpenseResult {
  expense: Expense;
  /** What the drawer should now hold. */
  expectedDrawerCash: Rs;
}

export interface TodayTotals {
  sheet: SheetSummary;
  cashReceived: Rs;
  drawerExpenses: Rs;
  drawerExpected: Rs;
  online: Record<string, Rs>;
  received: Rs;
  frames: number;
  doubles: number;
  centuryMinutes: number;
  centuryGames: number;
  newCredit: Rs;
  newCreditPlayers: number;
  oldCreditPaid: Rs;
  oldCreditPlayers: number;
  waiting: { count: number; total: Rs };
  lastDrawerExpense?: { what: string; amount: Rs; at: ISO; doneBy: PersonRef };
}

export interface ClosePreview {
  sheet: SheetSummary;
  /** Now, and who is closing. */
  closingAt: ISO;
  closingBy: PersonRef;
  cash: { received: Rs; drawerExpenses: Rs; expected: Rs };
  online: Record<string, Rs>;
  leftWithoutCheckout: { playerId: string; name: string; amount: Rs }[];
  running: {
    gameId: string;
    tableId: string;
    tableName: string;
    type: GameType;
    underPlayerId?: string;
    minutes: number;
  }[];
  summary: {
    frames: number;
    centuryMinutes: number;
    roomMinutes: number;
    received: Rs;
    newCredit: Rs;
    discounts: { count: number; total: Rs };
  };
}
export interface CloseSheetRequest {
  counted: Rs;
  note?: string;
}
export interface CloseSheetResult {
  closed: SheetSummary & { closedAt: ISO; closedBy: PersonRef };
  newSheet: SheetSummary;
  moved: {
    gameId: string;
    tableId: string;
    tableName: string;
    type: GameType;
    underPlayerId?: string;
  }[];
  leftWithoutCheckout: { playerId: string; name: string; amount: Rs }[];
  cash: { expected: Rs; counted: Rs; difference: Rs; note?: string };
  backedUpAt: ISO;
}

// ---------------------------------------------------------------------------------------------
// Owner API (/api/owner/*)
// ---------------------------------------------------------------------------------------------

export interface OwnerSignInRequest {
  ownerId: Owner['id'];
  password: string;
  keepSignedIn?: boolean;
}
export interface OwnerSession {
  owner: Owner;
}

export interface Dashboard {
  at: ISO;
  today: {
    earned: Rs;
    frames: number;
    centuryMinutes: number;
    rooms: number;
    received: Rs;
    cashReceived: Rs;
    online: Rs;
    onlineByMethod: Record<string, Rs>;
    newCredit: Rs;
    oldCreditPaid: Rs;
    expensesPaidToday: Rs;
    moneyInHand: Rs;
    tablesInUse: number;
    tablesTotal: number;
    over30: number;
    drawerExpenses: Rs;
    drawerExpected: Rs;
  };
  month: {
    key: string;
    days: number;
    earned: Rs;
    expenses: Rs;
    canteenCost: Rs;
    profit: Rs;
    vsLastMonthPct: number;
    byGame: Record<string, Rs>;
  };
  credit: {
    total: Rs;
    players: number;
    olderThan15Days: { total: Rs; players: number };
    advanceHeld: Rs;
  };
  earnedPerDay: {
    from: string;
    values: Rs[];
    best: { date: string; earned: Rs };
    todayOpen: boolean;
  };
  busyHours: Record<string, number>;
  topPlayers: { playerId: string; name: string; spent: Rs }[];
  topDebtors: { playerId: string; name: string; balance: Rs; oldestUnpaidAt?: ISO }[];
  unread: number;
}

export type ReportPeriod = 'day' | 'month' | 'year';
export interface ReportsQuery {
  period?: ReportPeriod;
  month?: string;
  compare?: string;
}
/** Each pair is [this period, the one compared with]. */
export interface Reports {
  period: ReportPeriod;
  month: string;
  compare: string;
  earned: [Rs, Rs];
  expenses: [Rs, Rs];
  canteenCost: [Rs, Rs];
  profit: [Rs, Rs];
  creditPendingAtEnd: Rs;
  byGame: Record<string, [Rs, Rs]>;
  byTable: Record<string, Rs>;
  byMethod: Record<string, [Rs, Rs]>;
  year: Record<string, Rs>;
}

export interface ActivityQuery {
  type?: ActivityEvent['type'];
  by?: string;
  from?: ISO;
  to?: ISO;
}
export interface ActivityList {
  events: ActivityEvent[];
  /** How many of each type, for the filter chips. */
  counts: Record<string, number>;
  needsDecision: number;
}
export interface DecideRequest {
  /** Screen 38: "Faisal pays", "Naveed pays", "Half each", "Nobody pays". */
  payer: 'first' | 'second' | 'half' | 'nobody';
}

export interface SheetFolder {
  month: string;
  days: number;
  sheets: number;
  earned: Rs;
}
export interface SheetHistoryLine {
  id: string;
  at: ISO;
  by: PersonRef;
  text: string;
  amount?: Rs;
}
export interface SheetEntry {
  id: string;
  label: string;
  value: number;
  unit: 'rs' | 'minutes' | 'count';
}
/** A sheet in a month's list. */
export interface SheetRow extends Sheet {
  open: boolean;
}
export interface SheetDetail extends SheetRow {
  entries: SheetEntry[];
  history: SheetHistoryLine[];
  byTable?: Record<string, Rs>;
  canteen?: { sales: Rs; items: number; profit: Rs };
}
export interface EditEntryRequest {
  value: number;
  reason: string;
}
export type ExportFormat = 'pdf' | 'xlsx';

export type PlayerFilter = 'all' | 'owe' | 'advance' | 'old';
export interface OwnerPlayers {
  players: PlayerWithTail[];
  counts: Record<PlayerFilter, number>;
  totals: { credit: Rs; olderThan15Days: Rs; advanceHeld: Rs };
}
export interface PaymentRequest {
  method: string;
  amount: Rs;
  note?: string;
}
export interface OpeningBalanceRequest {
  /** More than 0 he owes the club; less than 0 the club holds an advance. */
  amount: Rs;
  note?: string;
}
export interface PlayerPatch {
  name?: string;
  phone?: string;
  nick?: string;
  note?: string;
}
export interface StatementLinePatch {
  charge?: Rs;
  paid?: Rs;
  text?: string;
  reason: string;
}
export interface PlayerChange {
  player: PlayerWithTail;
  line?: StatementLine;
}

export interface PriceCard extends Category {
  tables: Table[];
}
export interface Prices {
  categories: PriceCard[];
}
export interface TablePatch {
  price?: Rs | null;
  /** Give other tables of the same category the same price. */
  alsoTableIds?: string[];
  /** `null` puts the table back in order. */
  outOfOrder?: { note: string } | null;
}
export interface CategoryPatch {
  price?: Rs | null;
  centuryRate?: Rs;
}
export interface NewTableRequest {
  /** An existing category gives the new table the next number; a new name makes a category. */
  categoryId?: string;
  categoryName?: string;
  kind?: Table['kind'];
  price: Rs | null;
}

export interface OwnerCanteen {
  items: CanteenItem[];
  sales: CanteenSale[];
}
export interface NewCanteenItemRequest {
  name: string;
  category: CanteenItem['category'];
  sell: Rs;
  buy: Rs;
  buyIsEstimate?: boolean;
  stock: number | null;
  lowAt: number;
}
export interface StockRequest {
  itemId: string;
  /** Added to the stock; use a negative number to take stock off. */
  add: number;
}

export interface OwnerExpenses {
  month: string;
  total: Rs;
  drawerTotal: Rs;
  items: Expense[];
}
export interface ExpenseRequest {
  at?: ISO;
  what: string;
  category: ExpenseCategory;
  amount: Rs;
  paidFrom: Expense['paidFrom'];
  staffName?: string;
}

/**
 * What happened at the counter's sign-in (screen 50). These are kept apart from Activity, which is only
 * for what changed money outside a normal game.
 */
export type WorkerSessionEventKind =
  | 'sign-in'
  | 'sign-out'
  | 'auto-sign-out' // his sign-in time ended
  | 'not-your-time' // he tried to sign in outside his time
  | 'pin-lockout'; // five wrong PINs
export interface WorkerSessionEvent {
  id: string;
  at: ISO;
  workerId: string;
  kind: WorkerSessionEventKind;
}
/** A worker as the owners see him: his times, who is signed in now, and what happened at sign-in. */
export interface OwnerWorker extends Worker {
  /** While he is signed in: when he will be signed out automatically ("Automatically at 11:00 PM"). */
  signsOutAt?: ISO;
  /** Newest first. */
  sessionEvents: WorkerSessionEvent[];
}

export interface NewWorkerRequest {
  name: string;
  slot: Slot;
  pin: string;
}
export interface WorkerPatch {
  slot?: Slot;
  enabled?: boolean;
}
export interface PinRequest {
  pin: string;
}

export interface OwnerSettings extends Settings {
  backups: { last?: ISO; thisComputer: boolean; usb: boolean; keep: number };
}
export interface SettingsPatch {
  paymentMethods?: PaymentMethod[];
  alerts?: Settings['alerts'];
  email?: Settings['email'];
  language?: Settings['language'];
  club?: Partial<Settings['club']>;
}
export interface OwnerAddressResult {
  /** The new private address, shown once. Every owner is signed out. */
  address: string;
}

export interface NotificationList {
  notifications: AppNotification[];
  unread: number;
}
