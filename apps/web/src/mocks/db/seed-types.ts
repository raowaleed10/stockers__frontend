import type {
  ActivityEvent,
  AppNotification,
  CanteenItem,
  Category,
  Expense,
  Game,
  ISO,
  Owner,
  PaymentMethod,
  PersonRef,
  Rs,
  Session,
  Settings,
  StatementLine,
  Table,
  Worker,
} from '@stockers/shared';

/** The shape of `mock/seed.json`, as far as the mock needs it. */

export type ScenarioName = 'paused' | 'checkout' | 'closing' | 'closed' | 'empty';

export interface SeedPlayer {
  id: string;
  name: string;
  phone: string | null;
  nick?: string;
  note?: string;
  since: ISO;
  balance: Rs;
  oldestUnpaidAt: ISO | null;
  visits: number;
  framesWon: number;
  framesPlayed: number;
  centuryMinutes: number;
  spent: Rs;
}

export interface SeedSheet {
  id: string;
  number: number;
  openedAt: ISO;
  openedBy: PersonRef;
  closedAt?: ISO;
  closedBy?: PersonRef;
  earned?: Rs;
  editedBy?: PersonRef[];
  final?: SeedFinal;
}

export interface SeedFinal {
  closedAt: ISO;
  closedBy: PersonRef;
  earned: Rs;
  received: Rs;
  oldCreditPaid: Rs;
  newCredit: Rs;
  discounts: { count: number; total: Rs };
  frames: number;
  centuryMinutes: number;
  roomMinutes: number;
  cash: {
    received: Rs;
    drawerExpenses: Rs;
    expected: Rs;
    counted: Rs;
    difference: Rs;
    note: string;
  };
  online: Record<string, Rs>;
  byTable: Record<string, Rs>;
  canteen: { sales: Rs; items: number; profit: Rs };
}

export interface SeedWaiting {
  playerId: string;
  summary: string;
  tonight: Rs;
  oldCredit?: Rs;
  total?: Rs;
}

export interface SeedStatementLine {
  at: ISO;
  kind: StatementLine['kind'];
  text: string;
  charge?: Rs;
  paid?: Rs;
  balance: Rs;
  doneBy: PersonRef;
  method?: string;
}

export interface SeedAggregates {
  dashboardAt: ISO;
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
  october: {
    days: number;
    earned: Rs;
    expenses: Rs;
    canteenCost: Rs;
    profit: Rs;
    vsSeptemberFirst3DaysPct: number;
    byGame: Record<string, Rs>;
  };
  credit: {
    total: Rs;
    players: number;
    olderThan15Days: { total: Rs; players: number };
    advanceHeld: Rs;
  };
  earnedPerDayLast30: {
    from: string;
    values: Rs[];
    best: { date: string; earned: Rs };
    todayOpen: boolean;
  };
  busyHours: Record<string, number>;
  reports: {
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
    year2026: Record<string, Rs>;
  };
  sheetFolders: { month: string; days: number; sheets: number; earned: Rs }[];
}

export interface SeedScenario {
  now?: ISO;
  note: string;
  pauseAll?: { at: ISO; doneBy: PersonRef };
  signedIn?: PersonRef;
  games?: (Omit<Game, 'price'> & { price?: Rs; rate?: Rs })[];
  waiting?: SeedWaiting[];
  waitingTotal?: Rs;
  activity?: ActivityEvent[];
  closeSheet?: string;
  openSheet?: { id: string; number: number; openedAt: ISO; openedBy: PersonRef };
  moved?: { gameId: string; toSheetId: string }[];
  leftWithoutCheckout?: { playerId: string; amount: Rs }[];
}

export interface SeedFile {
  meta: { demoNow: { counter: ISO; owner: ISO; afterClose: ISO }; currentSheetId: string };
  owners: Owner[];
  workers: (Worker & { demoPin: string })[];
  paymentMethods: PaymentMethod[];
  categories: Category[];
  tables: Table[];
  players: SeedPlayer[];
  sheets: SeedSheet[];
  games: (Omit<Game, 'price'> & { price?: Rs; rate?: Rs })[];
  sessions: Session[];
  waiting: SeedWaiting[];
  statementExamples: Record<string, SeedStatementLine[]>;
  canteenItems: CanteenItem[];
  expenses: Expense[];
  activity: ActivityEvent[];
  notifications: AppNotification[];
  settings: Omit<Settings, 'email'> & {
    email: { aqil: string | null; adil: string | null };
    backups: { last?: ISO; thisComputer: boolean; usb: boolean; keep: number };
  };
  aggregates: SeedAggregates;
  scenarios: Record<ScenarioName, SeedScenario>;
}
