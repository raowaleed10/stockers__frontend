import type {
  ActivityEvent,
  AppNotification,
  CanteenItem,
  CounterAlert,
  CanteenSale,
  Category,
  CloseSheetResult,
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
  /** The frame of the fight and what the worker wrote, for the owners' banner (screen 38). */
  frameNo?: number;
  note?: string;
}

/**
 * What a payment changed, so the worker who took it can undo it for 2 minutes (D63). One record for each player, the
 * latest only: a second payment replaces it.
 */
export interface CheckoutUndo {
  by: PersonRef;
  at: ISO;
  sheetId: string;
  name: string;
  paid: Rs;
  toCredit: Rs;
  /** The statement lines the payment posted (a payment for each method, and the discount). */
  postedLineIds: string[];
  /** Tonight's charge lines the payment settled; they are "tonight" again after the undo. */
  settledLineIds: string[];
  /** Where the player stood in the waiting list, or -1. */
  billIndex: number;
  oldestUnpaidAt: ISO | undefined;
  /** Money received now, for each method. */
  received: Record<string, Rs>;
  newCredit: Rs;
  newCreditPlayer: boolean;
  oldCreditPaid: Rs;
  oldCreditPlayer: boolean;
  discount: Rs;
  discountEventId?: string;
}

/** What a canteen sale changed, so the worker who made it can undo it for 2 minutes (D65). By sale id. */
export interface CanteenUndo {
  by: PersonRef;
  at: ISO;
  sheetId: string;
  /** The statement lines the sale posted (what was sold, and the payment of a sale with a name). */
  lineIds: string[];
  /** What the items cost to buy, which the owners' profit took off (never shown to the counter). */
  cost: Rs;
  /** The money taken now, with the method, or none when it went on a bill. */
  received?: { method: string; amount: Rs };
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
  /** The latest payment of each player that can still be undone (D63), by player id. */
  checkoutUndo: Record<string, CheckoutUndo>;
  /** The canteen sales that can still be undone (D65), by sale id. */
  canteenUndo: Record<string, CanteenUndo>;
  /** The ids of the drawer expenses made at the counter in this session, which the worker can still undo (D65). */
  drawerUndo: Set<string>;
  /** What the last close of a sheet did, for "Sheet 48 is closed" (screen 33). */
  lastClose: CloseSheetResult | null;
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
