import type {
  ActivityEvent,
  AppNotification,
  CanteenItem,
  CounterAlert,
  CanteenSale,
  Category,
  Expense,
  Game,
  ISO,
  Owner,
  OwnerSettings,
  PaymentMethod,
  PersonRef,
  Player,
  Rs,
  Session,
  Sheet,
  SheetHistoryLine,
  StatementLine,
  Table,
  Worker,
  WorkerSessionEvent,
} from '@stockers/shared';
import type { ScenarioName, SeedAggregates } from './seed-types';

export type StoredWorker = Worker & { pin: string };

/** An owner notification as kept: `readAt` says it was unread until then (the answer's `read` follows the clock). */
export type StoredNotification = AppNotification & { readAt?: ISO };

/** Who the browser is signed in as. A counter session and an owner session are different kinds. */
export type AuthSession =
  { kind: 'worker'; workerId: string; at: ISO } | { kind: 'owner'; ownerId: Owner['id']; at: ISO };

export interface Tries {
  count: number;
  /** Epoch milliseconds until which sign-in is refused. */
  lockedUntil: number;
}

/** Running totals of the open sheet (what "Today's totals" and the dashboard show). */
export interface TodayState {
  earned: Rs;
  frames: number;
  doubles: number;
  centuryMinutes: number;
  centuryGames: number;
  rooms: number;
  roomMinutes: number;
  cashReceived: Rs;
  online: Record<string, Rs>;
  newCredit: Rs;
  newCreditPlayers: number;
  oldCreditPaid: Rs;
  oldCreditPlayers: number;
  expensesPaidToday: Rs;
  moneyInHand: Rs;
  drawerExpenses: Rs;
  discounts: { count: number; total: Rs };
  canteenSales: Rs;
}

export interface DisputeInfo {
  tableId: string;
  playerIds: [string, string];
  amount: Rs;
}

export interface DbState {
  scenario: ScenarioName | null;
  owners: Owner[];
  workers: StoredWorker[];
  paymentMethods: PaymentMethod[];
  categories: Category[];
  tables: Table[];
  players: Player[];
  /** Each player's statement, oldest line first. */
  statements: Record<string, StatementLine[]>;
  /** Ids of charge lines not checked out yet ("tonight"). */
  unsettled: Set<string>;
  /** The order the seed lists the waiting bills in. Players who start waiting later follow it. */
  billOrder: string[];
  sheets: Sheet[];
  /** How many sheets existed after the scenario was set up, so new ones can be counted. */
  baseSheetCount: number;
  currentSheetId: string;
  sheetExtras: Record<
    string,
    { byTable?: Record<string, Rs>; canteen?: { sales: Rs; items: number; profit: Rs } }
  >;
  sheetHistory: Record<string, SheetHistoryLine[]>;
  /** Owner corrections to a sheet's entries: sheet id -> entry id -> value. */
  sheetEntryEdits: Record<string, Record<string, number>>;
  today: TodayState;
  games: Game[];
  sessions: Session[];
  canteenItems: CanteenItem[];
  canteenSales: CanteenSale[];
  expenses: Expense[];
  /** Newest first, like the seed. */
  activity: ActivityEvent[];
  notifications: StoredNotification[];
  /** The counter's own alerts (the bell), newest first. */
  counterAlerts: CounterAlert[];
  /** Sign-ins, sign-outs, automatic sign-outs, refusals and lockouts, oldest first. */
  workerEvents: WorkerSessionEvent[];
  disputes: Record<string, DisputeInfo>;
  settings: OwnerSettings;
  pauseAll: { at: ISO; by: PersonRef; activityId?: string } | null;
  lastBackupAt: ISO | null;
  /** Changes the dashboard numbers by what was written in this session. */
  deltas: {
    earned: Rs;
    expenses: Rs;
    canteenCost: Rs;
    creditOwed: Rs;
    advanceHeld: Rs;
    sheetsEarned: Rs;
  };
  /** The owners' figures from the seed (dashboard and reports). Read only. */
  aggregates: SeedAggregates;
  auth: {
    session: AuthSession | null;
    pinTries: Record<string, Tries>;
    ownerTries: Tries;
  };
  seq: Record<string, number>;
}
