# 06 · Data, API and mock

The frontend is built first, against a **mock API** (MSW) that serves `mock/seed.json` from an in-memory store. The real backend later implements the same endpoints, and the screens don't change.

## 1. Shared types (`packages/shared/src/types.ts`)

```ts
export type Rs = number;                 // whole rupees, integer
export type ISO = string;                // ISO date-time with +05:00
export type HHMM = string;               // "02:00", "23:00" (24 h)

export type PersonRef = { id: string; name: string; role: 'worker' | 'owner' | 'system' };

export interface Worker { id: string; name: string; slot: { start: HHMM; end: HHMM }; enabled: boolean; pinSet: boolean;
  lastSignIn?: { at: ISO; until?: ISO }; signedIn?: { at: ISO } }
export interface Owner { id: 'aqil' | 'adil'; name: string; lastSeen?: ISO }

export type TableKind = 'snooker' | 'room' | 'pool' | 'foosball' | 'carrom' | 'ludo' | 'playstation';
export interface Category { id: string; name: string; kind: TableKind; pricing: 'frame' | 'hour' | 'game'; centuryAllowed: boolean; order: number }
export interface Table { id: string; categoryId: string; kind: TableKind; number: string; name: string;
  price: Rs | null;                       // per frame / per hour / per game; null = price not set (locked)
  outOfOrder?: { note: string; by: PersonRef; at: ISO } }

export type GameType = 'single' | 'double' | 'century' | 'room' | 'game';
export type GameStatus = 'running' | 'paused' | 'ended' | 'discarded' | 'dispute' | 'cancelled';
export interface Game {
  id: string; tableId: string; sheetId: string; type: GameType; status: GameStatus;
  startedAt: ISO; startedBy: PersonRef; endedAt?: ISO; endedBy?: PersonRef;
  pausedAt?: ISO; pausedMs: number;      // total paused time, not charged
  price: Rs;                             // frame / game price, or Century rate per minute, or room hourly
  playerIds?: [string, string];          // single
  sides?: [string[], string[]];          // double (1–2 players per side)
  underPlayerId?: string;                // century / room
  sessionId?: string; frameNo?: number;
  result?: { loserIds: string[]; amount: Rs; chargedDouble?: boolean; split?: Record<string, Rs>; minutes?: number };
}
export interface Session { id: string; tableId: string; playerIds: string[]; frames: { no: number; loserIds: string[]; amount: Rs; endedAt: ISO }[] }

export interface Player { id: string; name: string; phone?: string; nick?: string; note?: string; since: ISO;
  balance: Rs;                           // > 0 owes the club, < 0 advance held
  oldestUnpaidAt?: ISO; visits: number; framesWon: number; framesPlayed: number; centuryMinutes: number; spent: Rs }
export type LineKind = 'frame' | 'double' | 'century' | 'room' | 'game' | 'canteen' | 'damage' | 'payment' | 'discount'
  | 'opening' | 'left-without-checkout' | 'correction' | 'advance';
export interface StatementLine { id: string; playerId: string; at: ISO; kind: LineKind; text: string;
  charge?: Rs; paid?: Rs; balance: Rs; doneBy: PersonRef; method?: string; sheetId?: string }
export interface WaitingBill { playerId: string; name: string; phoneTail?: string; summary: string; tonight: Rs; oldCredit: Rs; advance: Rs; total: Rs }

export interface PaymentMethod { id: 'cash' | 'bank' | 'easypaisa' | 'jazzcash' | string; name: string; enabled: boolean; alwaysOn?: boolean }
export interface CheckoutRequest { playerId: string; parts: { method: string; amount: Rs }[]; toCredit: Rs; discount?: { amount: Rs; reason: string; note?: string } }

export interface CanteenItem { id: string; name: string; category: 'drinks' | 'food' | 'cigarettes'; sell: Rs; buy: Rs; buyIsEstimate?: boolean;
  stock: number | null;                  // null = made fresh
  lowAt: number }
export interface CanteenSale { id: string; at: ISO; playerId: string | null; items: { itemId: string; qty: number; price: Rs }[]; total: Rs; paidNow?: string; doneBy: PersonRef }

export type ExpenseCategory = 'staff' | 'bills' | 'generator' | 'repairs' | 'cleaning-tea' | 'rent' | 'food-petrol' | 'other';
export interface Expense { id: string; at: ISO; what: string; category: ExpenseCategory; amount: Rs;
  paidFrom: 'owner' | 'bank' | 'drawer'; staffName?: string; source: 'owner' | 'counter'; doneBy: PersonRef; sheetId?: string }

export interface Sheet { id: string; number: number; openedAt: ISO; openedBy: PersonRef; closedAt?: ISO; closedBy?: PersonRef;
  earned: Rs; received: Rs; newCredit: Rs; oldCreditPaid: Rs; discounts: { count: number; total: Rs };
  cash: { received: Rs; drawerExpenses: Rs; expected: Rs; counted?: Rs; difference?: Rs; note?: string };
  online: Record<string, Rs>; frames: number; centuryMinutes: number; roomMinutes: number; editedBy?: PersonRef[] }

export type ActivityType = 'discount' | 'discard' | 'dispute' | 'cancel' | 'undo' | 'double-charge' | 'damage' | 'drawer-expense'
  | 'edit' | 'left-without-checkout' | 'cash-difference' | 'pause-all' | 'price-change' | 'worker-change' | 'sign-in' | 'sign-out';
export interface ActivityEvent { id: string; at: ISO; by: PersonRef; type: ActivityType; title: string; detail?: string; amount?: Rs;
  sheetId?: string; needsDecision?: boolean }

export interface AppNotification { id: string; at: ISO; kind: 'sheet-closed' | 'left-without-checkout' | 'cancelled-or-discarded' | 'edited' | 'low-stock';
  title: string; text: string; amount?: Rs; read: boolean }

export interface Settings { paymentMethods: PaymentMethod[];
  rules: { doubleAfterMin: 30; lockAfterMin: 5; undoWindowSec: 120; changeTypeWindowMin: 5; oldCreditDays: 15; roomMinMinutes: 60; slotWarningMin: 10 };
  alerts: Record<AppNotification['kind'], boolean>; email: { aqil?: string; adil?: string };
  language: { counter: 'en' | 'ur'; owner: 'en' | 'ur' }; club: { name: string; address: string; logo?: string; domain?: string } }
```

## 2. API: counter (`/api/counter/*`, worker session only)

| Call | Body → result | Screens |
|---|---|---|
| `GET /workers/public` | → `[{id,name,slot,canSignInNow}]` (names and times only) | 1, 2 |
| `POST /auth/sign-in` | `{workerId, pin}` → `{worker, until}` · **403 `NOT_YOUR_TIME`** `{slot, now}` · 401 wrong PIN · 429 too many tries | 1, 2 |
| `POST /auth/unlock` · `POST /auth/sign-out` · `GET /auth/me` | | 34 |
| `GET /board?category=` | → `{sheet, categories, tables(with game), waiting, unread, backedUpAt, pausedAll}` | 3–6, 16 |
| `POST /games` | `{tableId, type, playerIds|sides|underPlayerId, price?}` | 7–10 |
| `POST /games/:id/change-type` | `{type, ...}` (within 5 min) | 12 |
| `POST /games/:id/pause` · `/resume` · `POST /games/pause-all` · `/resume-all` | | 11, 16 |
| `POST /games/:id/move` `{toTableId}` · `POST /games/:id/replace` `{outId, inId}` | | 13 |
| `POST /games/:id/discard` `{reason, note}` · `/dispute` `{note}` · `/cancel` `{reason}` · `/undo` | | 14 |
| `POST /games/:id/damage` | `{playerId, item, amount, note}` | 15 |
| `POST /games/:id/end` | `{loserIds, split?, chargeDouble?}` → charged lines | 17, 19, 20 |
| `POST /games/:id/next` | same players, next frame | 18 |
| `POST /games/:id/end-century` | → minutes, amount | 21 |
| `POST /rooms/:tableId/start` · `POST /games/:id/end-room` | `{underPlayerId, hourly}` | 22, 23 |
| `GET /players?q=` · `POST /players` `{name, phone?}` · `GET /players/:id/statement` | | 8, 10, 30 |
| `GET /checkout` · `GET /checkout/:playerId` · `POST /checkout/:playerId` | `CheckoutRequest` | 24–27 |
| `GET /canteen/items` · `POST /canteen/sales` | `{playerId|null, items, payNow?}` | 28 |
| `POST /expenses/drawer` | `{category, amount, note}` → new expected drawer cash | 29 |
| `GET /today` | cash in drawer, online by method, frames, credit, waiting | 31 |
| `GET /sheets/current/close-preview` · `POST /sheets/current/close` | `{counted, note}` → new sheet | 32, 33 |

## 3. API: owner (`/api/owner/*`, owner session only; the counter session gets 404)

| Call | Screens |
|---|---|
| `POST /auth/sign-in` `{ownerId, password}` · `GET /auth/me` · `POST /auth/sign-out` | 35, 52 |
| `GET /dashboard` | 36, 53 |
| `GET /reports?period=month&month=2026-09&compare=2026-08` | 37 |
| `GET /activity?type=&by=&from=&to=` · `POST /activity/:id/decide` `{payer}` | 38 |
| `GET /sheets/folders` · `GET /sheets?month=` · `GET /sheets/:id` · `PATCH /sheets/:id/entries/:entryId` `{value, reason}` · `GET /sheets/:id/export?format=pdf|xlsx` | 39–42, 55 |
| `GET /players?filter=` · `GET /players/:id` · `POST /players/:id/payments` · `POST /players/:id/opening-balance` · `PATCH /players/:id` · `PATCH /statement-lines/:id` | 43, 44, 56 |
| `GET /prices` · `PATCH /tables/:id` `{price, alsoTableIds?, outOfOrder?}` · `PATCH /categories/:id` `{price}` · `POST /tables` | 45–47, 57 |
| `GET /canteen` · `POST /canteen/items` · `POST /canteen/stock` | 48 |
| `GET /expenses?month=` · `POST /expenses` · `PATCH /expenses/:id` · `DELETE /expenses/:id` | 49 |
| `GET /workers` · `POST /workers` · `PATCH /workers/:id` `{slot?, enabled?}` · `POST /workers/:id/pin` | 50 |
| `GET /settings` · `PATCH /settings` · `POST /settings/owner-address` (new address, signs out owners) · `POST /auth/sign-out-all` | 51 |
| `GET /live` (read-only board) · `GET /notifications` · `POST /notifications/read-all` | 54, 58 |

Every write returns the saved record including `doneBy`. Errors use `{code, message}`; show the message in plain words next to the control.

## 4. Live updates
- Real backend: Socket.IO. Mock: an in-memory event bus with the same event names.
- Events: `board.changed`, `game.changed`, `waiting.changed`, `sheet.closed`, `notification.created`, `worker.signedIn`, `worker.signedOut`, `price.changed`, `settings.changed`.
- On an event, invalidate the matching TanStack Query keys.
- Timers do not need events: they tick from `startedAt` and `pausedMs` with `useNow()`.

## 5. Query keys
`['board', category]`, `['game', id]`, `['players', q]`, `['player', id]`, `['statement', id]`, `['checkout']`, `['checkout', playerId]`, `['canteen']`, `['today']`, `['closePreview']`, `['dashboard']`, `['reports', params]`, `['activity', filters]`, `['sheets', month]`, `['sheet', id]`, `['prices']`, `['expenses', month]`, `['workers']`, `['settings']`, `['notifications']`.

## 6. Mock data (`mock/seed.json`)
- It tells one story: **Saturday 3 October 2026, sheet 48**. The sheet opens at 11:10 AM. Zain works 2 PM to 11 PM; the counter screens are at 9:42 PM. Shabir closes the sheet at 3:40 AM on Sunday. It holds owners, workers, categories, all 28 tables, players, the games running at 9:42 PM, waiting bills, sheets 46–48, canteen items, October expenses, the night's activity, notifications, settings, and the owner aggregates (dashboard, reports) used on screens 36, 37 and 53.
- MSW handlers load it into an in-memory store. Writes change the store and fire the matching event.
- `?scenario=<name>` in the URL switches to another moment of the same night, from `scenarios` in the seed. Each scenario lists only what differs from the 9:42 PM data:

| Scenario | Clock | What changes | Screens |
|---|---|---|---|
| `paused` | 10:01 PM | Zain pressed Pause all at 9:58 PM; every running game is paused | 16 |
| `checkout` | 10:20 PM | 8 players waiting to pay, Rs 6,880 in all (Tariq has paid) | 24–27 |
| `closing` | 3:40 AM Sun | Shabir is signed in; one Century on Table 2; Waqas and Shoaib not checked out; close numbers from `sheets[s48].final` | 32 |
| `closed` | 3:45 AM Sun | Sheet 48 closed, sheet 49 open, the Century moved, Waqas and Shoaib moved to credit | 33, 38–44, 55, 56 |
| `empty` | any | No games, no bills, no activity | empty states |

- `design/screens.json` gives every screen its `now` (the demo clock the design shows) and, where needed, its `scenario`. Visual tests open `route?now=<now>&scenario=<scenario>`.
- Small number differences against the PNGs are fine. Layout, copy and states must match.
