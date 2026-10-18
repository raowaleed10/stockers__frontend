export type Rs = number; // whole rupees, integer
export type ISO = string; // ISO date-time with +05:00
export type HHMM = string; // "02:00", "23:00" (24 h)

export type PersonRef = { id: string; name: string; role: 'worker' | 'owner' | 'system' };

export interface Worker {
  id: string;
  name: string;
  slot: { start: HHMM; end: HHMM };
  enabled: boolean;
  pinSet: boolean;
  lastSignIn?: { at: ISO; until?: ISO };
  signedIn?: { at: ISO };
}
export interface Owner {
  id: 'aqil' | 'adil';
  name: string;
  lastSeen?: ISO;
}

export type TableKind =
  'snooker' | 'room' | 'pool' | 'foosball' | 'carrom' | 'ludo' | 'playstation';
export interface Category {
  id: string;
  name: string;
  kind: TableKind;
  pricing: 'frame' | 'hour' | 'game';
  centuryAllowed: boolean;
  order: number;
  centuryRate?: Rs; // default Century rate per minute (snooker)
  minMinutes?: number; // room minimum
}
export interface Table {
  id: string;
  categoryId: string;
  kind: TableKind;
  number: string;
  name: string;
  price: Rs | null; // per frame / per hour / per game; null = price not set (locked)
  /**
   * The longest a game charged per game may run before the red card and the "charge double?" choice, in whole
   * minutes (5 to 180). It is set with the price (docs/02 D56). Not on a room, which is charged by the hour.
   * A change applies to games started after it.
   */
  maxMinutes?: number;
  outOfOrder?: { note: string; by: PersonRef; at: ISO };
}

/** How a table is shown (decision D7): the ring, the pill text and the surface all follow this. */
export type TableStatus = 'free' | 'playing' | 'overLimit' | 'paused' | 'outOfOrder' | 'noPrice';

export type GameType = 'single' | 'double' | 'century' | 'room' | 'game';
export type GameStatus = 'running' | 'paused' | 'ended' | 'discarded' | 'dispute' | 'cancelled';
export interface Game {
  id: string;
  tableId: string;
  sheetId: string;
  type: GameType;
  status: GameStatus;
  startedAt: ISO;
  startedBy: PersonRef;
  endedAt?: ISO;
  endedBy?: PersonRef;
  pausedAt?: ISO;
  pausedMs: number; // total paused time, not charged
  /** The time limit this game started with (a single or double frame, or a game); a change of the table's limit does not move it. */
  maxMinutes?: number;
  price: Rs; // frame / game price, or Century rate per minute, or room hourly
  playerIds?: [string, string]; // single
  sides?: [string[], string[]]; // double (1–2 players per side)
  underPlayerId?: string; // century / room
  sessionId?: string;
  frameNo?: number;
  result?: {
    loserIds: string[];
    amount: Rs;
    chargedDouble?: boolean;
    split?: Record<string, Rs>;
    minutes?: number;
    /** The statement lines this end posted, so "Undo" on screen 18 can take them back. */
    lineIds?: string[];
    /** The Activity event of a double charge, so a correction can take it back. */
    doubleEventId?: string;
  };
  /**
   * "Tapped the wrong player?" (screen 18, D63): set when the worker who charged a frame taps Undo. The charge stands
   * until he picks who lost again (or Nobody pays); he has 2 minutes from `at` to choose.
   */
  correction?: { at: ISO };
}
export interface Session {
  id: string;
  tableId: string;
  playerIds: string[];
  frames: { no: number; loserIds: string[]; amount: Rs; startedAt: ISO; endedAt: ISO }[];
}

export interface Player {
  id: string;
  name: string;
  phone?: string;
  nick?: string;
  note?: string;
  since: ISO;
  balance: Rs; // > 0 owes the club, < 0 advance held
  oldestUnpaidAt?: ISO;
  visits: number;
  framesWon: number;
  framesPlayed: number;
  centuryMinutes: number;
  spent: Rs;
}
export type LineKind =
  | 'frame'
  | 'double'
  | 'century'
  | 'room'
  | 'game'
  | 'canteen'
  | 'damage'
  | 'payment'
  | 'discount'
  | 'opening'
  | 'left-without-checkout'
  | 'correction'
  | 'advance';
export interface StatementLine {
  id: string;
  playerId: string;
  at: ISO;
  kind: LineKind;
  text: string;
  charge?: Rs;
  paid?: Rs;
  balance: Rs;
  doneBy: PersonRef;
  method?: string;
  sheetId?: string;
  /** A canteen line: what was sold and how many. The name is stored as typed. */
  item?: { name: string; qty: number };
  /** A frame or game that was charged double because it ran past its limit (Q2). Shown as "one charged double" at checkout. */
  doubled?: boolean;
}

/** What a bill is made of, one part for each kind of charge (the "2 frames lost, 2 teas" of screen 3). */
export type BillPartKind = 'frame' | 'game' | 'double' | 'century' | 'room' | 'damage' | 'canteen';
export interface BillPart {
  kind: BillPartKind;
  /** Frames lost, halves of a double, games, or the quantity of a canteen item. */
  count: number;
  /** What these charges add up to (Century Rs 630). */
  amount: Rs;
  /** How many of the frames, games or halves were charged double (Zubair: 2 frames, one charged double). */
  doubled?: number;
  /** A room: the line as it is on his statement ("Room 1, 1 h 40 min"), which the checkout list shows as it is. */
  text?: string;
  /** The canteen item, as stored. Only on `canteen`. */
  item?: string;
}

export interface WaitingBill {
  playerId: string;
  name: string;
  phoneTail?: string;
  /** What tonight's bill is made of. The screen writes it in the page language. */
  parts: BillPart[];
  tonight: Rs;
  oldCredit: Rs;
  advance: Rs;
  total: Rs;
  /** When the oldest unpaid charge of his old credit was made, for "Old credit Rs 1,100, 18 days" at checkout. */
  oldestUnpaidAt?: ISO;
}

export interface PaymentMethod {
  id: 'cash' | 'bank' | 'easypaisa' | 'jazzcash' | string;
  name: string;
  enabled: boolean;
  alwaysOn?: boolean;
}
export interface CheckoutRequest {
  playerId: string;
  parts: { method: string; amount: Rs }[];
  toCredit: Rs;
  discount?: { amount: Rs; reason: string; note?: string };
}

export interface CanteenItem {
  id: string;
  name: string;
  category: 'drinks' | 'food' | 'cigarettes';
  sell: Rs;
  buy: Rs;
  buyIsEstimate?: boolean;
  stock: number | null; // null = made fresh
  lowAt: number;
  /** What the owners call many of it in a sentence ("Cigarette packs"); the name is used when this is left out. */
  plural?: string;
}
export interface CanteenSale {
  id: string;
  at: ISO;
  playerId: string | null;
  items: { itemId: string; qty: number; price: Rs }[];
  total: Rs;
  paidNow?: string;
  doneBy: PersonRef;
}

/**
 * The owners' expense types. `food`, `petrol`, `tea-milk` and `cleaning` are the counter's own chips (screen 29) and stay
 * separate on the owner side (D65); `cleaning-tea` ("Cleaning and tea") is what an owner picks in the Add expense form.
 */
export type ExpenseCategory =
  | 'staff'
  | 'bills'
  | 'generator'
  | 'repairs'
  | 'cleaning-tea'
  | 'rent'
  | 'food'
  | 'petrol'
  | 'tea-milk'
  | 'cleaning'
  | 'other';
export interface Expense {
  id: string;
  at: ISO;
  what: string;
  category: ExpenseCategory;
  amount: Rs;
  paidFrom: 'owner' | 'bank' | 'drawer';
  staffName?: string;
  source: 'owner' | 'counter';
  doneBy: PersonRef;
  sheetId?: string;
}

export interface Sheet {
  id: string;
  number: number;
  openedAt: ISO;
  openedBy: PersonRef;
  closedAt?: ISO;
  closedBy?: PersonRef;
  earned: Rs;
  received: Rs;
  newCredit: Rs;
  oldCreditPaid: Rs;
  discounts: { count: number; total: Rs };
  cash: {
    received: Rs;
    drawerExpenses: Rs;
    expected: Rs;
    counted?: Rs;
    difference?: Rs;
    note?: string;
  };
  online: Record<string, Rs>;
  frames: number;
  centuryMinutes: number;
  roomMinutes: number;
  editedBy?: PersonRef[];
}

export type ActivityType =
  | 'discount'
  | 'discard'
  | 'dispute'
  | 'cancel'
  | 'undo'
  | 'double-charge'
  | 'damage'
  | 'drawer-expense'
  | 'edit'
  | 'left-without-checkout'
  | 'cash-difference'
  | 'pause-all'
  | 'price-change'
  | 'worker-change'
  | 'settings-change'
  | 'out-of-order'
  | 'sign-in'
  | 'sign-out';
/** Why a frame was discarded: the four reasons of the counter's stop screen (screen 14). */
export type DiscardReason = 'left' | 'power' | 'table' | 'other';

/** The structured part of an event, so a sentence (the dashboard's "Needs a look") is made from data and not from text (D67). */
export interface ActivityFacts {
  tableId?: string;
  minutes?: number;
  reason?: DiscardReason;
}

/** A table as a screen needs it to write its name in its own language: `Table 4`, `Room 1`. */
export type TableRef = Pick<Table, 'kind' | 'number'>;

export interface ActivityEvent {
  id: string;
  at: ISO;
  by: PersonRef;
  type: ActivityType;
  title: string;
  detail?: string;
  facts?: ActivityFacts;
  amount?: Rs;
  sheetId?: string;
  needsDecision?: boolean;
}

export interface AppNotification {
  id: string;
  at: ISO;
  kind:
    'sheet-closed' | 'left-without-checkout' | 'cancelled-or-discarded' | 'edited' | 'low-stock';
  title: string;
  text: string;
  amount?: Rs;
  read: boolean;
}

export interface Settings {
  paymentMethods: PaymentMethod[];
  rules: {
    /** The starting maximum time (minutes) for games added later; each table's own `maxMinutes` is what counts (D56). */
    doubleAfterMin: number;
    lockAfterMin: 5;
    undoWindowSec: 120;
    changeTypeWindowMin: 5;
    oldCreditDays: 15;
    roomMinMinutes: 60;
    slotWarningMin: 10;
  };
  alerts: Record<AppNotification['kind'], boolean>;
  email: { aqil?: string; adil?: string };
  language: { counter: 'en' | 'ur'; owner: 'en' | 'ur' };
  club: { name: string; address: string; logo?: string; domain?: string };
}
