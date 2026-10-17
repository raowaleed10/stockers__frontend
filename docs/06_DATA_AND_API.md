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
  maxMinutes?: number;                    // 5 to 180 whole minutes: the red card and "charge double?" (D56). Not on a room
  outOfOrder?: { note: string; by: PersonRef; at: ISO } }

export type GameType = 'single' | 'double' | 'century' | 'room' | 'game';
export type GameStatus = 'running' | 'paused' | 'ended' | 'discarded' | 'dispute' | 'cancelled';
export interface Game {
  id: string; tableId: string; sheetId: string; type: GameType; status: GameStatus;
  startedAt: ISO; startedBy: PersonRef; endedAt?: ISO; endedBy?: PersonRef;
  pausedAt?: ISO; pausedMs: number;      // total paused time, not charged
  price: Rs;                             // frame / game price, or Century rate per minute, or room hourly
  maxMinutes?: number;                   // the limit this game started with (a frame or a game); never changes (D56)
  playerIds?: [string, string];          // single
  sides?: [string[], string[]];          // double (1–2 players per side)
  underPlayerId?: string;                // century / room
  sessionId?: string; frameNo?: number;
  result?: { loserIds: string[]; amount: Rs; chargedDouble?: boolean; split?: Record<string, Rs>; minutes?: number };
}
export interface Session { id: string; tableId: string; playerIds: string[]; frames: { no: number; loserIds: string[]; amount: Rs; startedAt: ISO; endedAt: ISO }[] }

export interface Player { id: string; name: string; phone?: string; nick?: string; note?: string; since: ISO;
  balance: Rs;                           // > 0 owes the club, < 0 advance held
  oldestUnpaidAt?: ISO; visits: number; framesWon: number; framesPlayed: number; centuryMinutes: number; spent: Rs }
export type LineKind = 'frame' | 'double' | 'century' | 'room' | 'game' | 'canteen' | 'damage' | 'payment' | 'discount'
  | 'opening' | 'left-without-checkout' | 'correction' | 'advance';
export interface StatementLine { id: string; playerId: string; at: ISO; kind: LineKind; text: string;
  charge?: Rs; paid?: Rs; balance: Rs; doneBy: PersonRef; method?: string; sheetId?: string;
  item?: { name: string; qty: number } }   // a canteen line: what was sold (the name as typed) and how many
export type BillPartKind = 'frame' | 'game' | 'double' | 'century' | 'room' | 'damage' | 'canteen';
export interface BillPart { kind: BillPartKind; count: number; item?: string }   // item only on 'canteen'
// `parts` is what tonight's bill is made of ("2 frames lost, 2 teas"). It is data, not a sentence: the screen writes
// the words in the page language, and a canteen item keeps the name it was stored with. `billParts(lines)` in shared.
export interface WaitingBill { playerId: string; name: string; phoneTail?: string; parts: BillPart[]; tonight: Rs; oldCredit: Rs; advance: Rs; total: Rs }

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

export type ActivityType = 'discount' | 'discard' | 'dispute' | 'cancel' | 'undo' | 'double-charge' | 'damage' | 'drawer-expense' | 'out-of-order'
  | 'edit' | 'left-without-checkout' | 'cash-difference' | 'pause-all' | 'price-change' | 'worker-change' | 'settings-change' | 'sign-in' | 'sign-out';
export interface ActivityEvent { id: string; at: ISO; by: PersonRef; type: ActivityType; title: string; detail?: string; amount?: Rs;
  sheetId?: string; needsDecision?: boolean }

export interface AppNotification { id: string; at: ISO; kind: 'sheet-closed' | 'left-without-checkout' | 'cancelled-or-discarded' | 'edited' | 'low-stock';
  title: string; text: string; amount?: Rs; read: boolean }

export interface Settings { paymentMethods: PaymentMethod[];
  rules: { doubleAfterMin: number /* the starting maximum time for new games, 5 to 180 (D56) */; lockAfterMin: 5; undoWindowSec: 120; changeTypeWindowMin: 5; oldCreditDays: 15; roomMinMinutes: 60; slotWarningMin: 10 };
  alerts: Record<AppNotification['kind'], boolean>; email: { aqil?: string; adil?: string };
  language: { counter: 'en' | 'ur'; owner: 'en' | 'ur' }; club: { name: string; address: string; logo?: string; domain?: string } }
```

## 2. API: counter (`/api/counter/*`, worker session only)

| Call | Body → result | Screens |
|---|---|---|
| `GET /workers/public` | → `[{id,name,slot,canSignInNow}]` (names and times only) | 1, 2 |
| `GET /club-status` | **No session needed.** → `{sheetNumber, openedAt, inUse, total}`: the line "Sheet 48 is open since 11:10 AM. 6 of 9 tables in use." on the sign-in page. `inUse` and `total` count the Snooker and rooms tab (as on screen 3). No names, no money. *(Added in P04: the sign-in page has no session, and every board call needs one.)* | 1, 2 |
| `POST /auth/sign-in` | `{workerId, pin}` → `{worker, until}` · **403 `NOT_YOUR_TIME`** `{slot, now}` · 401 wrong PIN · 429 too many tries | 1, 2 |
| `POST /auth/unlock` · `POST /auth/sign-out` · `GET /auth/me` | | 34 |
| `GET /alerts` · `POST /alerts/read-all` | → `{alerts, unread}`. The counter's own alerts (the bell); separate from the owners' notifications. A table put out of order, a game cancelled or undone, and an item running low add one. (Added with the P03 answers. The counter's bell panel at `/alerts` shows the list, D54. A row may carry an `amount` in whole rupees.) | 3–6 |
| `GET /board?category=` | → `{sheet, categories, tables(with game), players, waiting, unread, backedUpAt, pausedAll, pausedAllAt?}`; `pausedAllAt` is when Pause all was pressed, while it is on (the banner of screen 16, added in P07). No category is the `snooker` tab (snooker tables and rooms); `all` is the whole club. `players` names everyone on a table. | 3–6, 16 |
| `GET /games/:id` | → `{game, table, session?, players, tonight}` (added in P03: the `['game', id]` query needs it). `tonight` is `{[playerId]: {won, waiting}}`: the frames and games he played in on the open sheet and did not lose, and what he has waiting to pay from tonight's charges (his bill without old credit). Screens 17 and 18 read them (P08); `waiting` comes in the same answer as the charge, so screen 18 never shows the bill from before it | 11, 13–15, 17–23 |
| `POST /games` | `{tableId, type, playerIds|sides|underPlayerId, price?}` | 7–10 |
| `POST /games/:id/change-type` | `{type, ...}` (within 5 min) | 12 |
| `POST /games/:id/pause` · `/resume` · `POST /games/pause-all` · `/resume-all` | | 11, 16 |
| `POST /games/:id/move` `{toTableId}` · `POST /games/:id/replace` `{outId, inId}` | | 13 |
| `POST /games/:id/discard` `{reason, note}` · `/dispute` `{note}` · `/cancel` `{reason?}` · `/undo` | `/undo` is for the worker who started the game, in its first 2 minutes (`NOT_ALLOWED` for another worker, `UNDO_EXPIRED` after). `/cancel` in the first 2 minutes of the caller's own game does exactly what `/undo` does and needs no reason; after that, or on another worker's game, it needs a `reason` (`NOTE_REQUIRED`). D60 | 14 |
| `POST /games/:id/damage` | `{playerId, item, amount, note}` | 15 |
| `POST /games/:id/end` | `{loserIds, split?, chargeDouble?}` → charged lines | 17, 19, 20 |
| `POST /games/:id/next` | same players, next frame | 18 |
| `POST /games/:id/undo-end` · `POST /games/:id/correct-end` `{loserIds, split?, chargeDouble?}` or `{discard: {reason, note?}}` | "Tapped the wrong player? Undo" on screen 18 (D63). `undo-end` opens a correction on a charged frame (`Game.correction = {at}`) and changes nothing else: only the worker who charged it (`NOT_ALLOWED`), within 2 minutes of the charge (`UNDO_EXPIRED`), and it works while another frame is running on the table (the running game is never touched); `GAME_NOT_RUNNING` for a game that is not a charged frame. `correct-end` then takes the charge back (its statement lines `Game.result.lineIds`, the players' numbers, the session frame, the sheet totals, a double-charge event `result.doubleEventId`) and makes the new one in a single step, judged at the minute the frame ended (`Game.endedAt`), not now; with `discard` the frame becomes `discarded` (a reason is required, `NOTE_REQUIRED`). A request that is refused changes nothing, so the first charge stands. It needs an open correction (`GAME_NOT_RUNNING`), the same worker (`NOT_ALLOWED`) and 2 minutes from `undo-end` (`UNDO_EXPIRED`). Activity gets `undo` "Frame undone on Table 1" (and `discard`, and `double-charge`, as they would be on their own) | 18 |
| `POST /games/:id/end-century` | → minutes, amount | 21 |
| `POST /rooms/:tableId/start` · `POST /games/:id/end-room` | `{underPlayerId, hourly}` | 22, 23 |
| `GET /players?q=` · `GET /players/recent` · `POST /players` `{name, phone?}` · `GET /players/:id/statement` | `?q=` matches a name or nickname that starts with the text or has a word that does ("ali" finds Ali Raza and Hamid Ali, not Malik), or three or more digits of the phone number. Each player carries `lastPlayedAt` (the start of his latest frame, game, Century or room, or of the game he is in; nothing if he has not played), which the counter writes as "Last played Thursday". `GET /players/recent` is the last eight to play, the latest first, for "Played here recently" (added in P06: the backend must implement it). A player made with `POST /players` needs only a name (Q18); a phone number, if given, has at least 10 digits | 8, 10, 30 |
| `POST /tables/:id/out-of-order` `{note}` | A worker marks a **free** table out of order with a note (screen 7). Answers the table. `NOTE_REQUIRED` with no note, `TABLE_BUSY` if a game is running, `TABLE_OUT_OF_ORDER` if it already is. The counter's bell gets an alert ("Table 2 marked out of order by Zain"). Written in Activity (`out-of-order`) with his name. Putting it back is `POST /tables/:id/back-in-order` (below) or, for an owner, `PATCH /tables/:id` with `outOfOrder: null` (added in P06: the backend must implement it) | 7 |
| `POST /tables/:id/back-in-order` `{note}` | A worker puts a table back in order with a note (D60). Answers the table. A table a worker marked can be put back by any worker; a table an owner marked answers `NOT_ALLOWED` (403: "Adil marked Table 7 out of order. Only an owner can put it back."). `NOTE_REQUIRED` with no note, `VALIDATION` if the table is not out of order. Written in Activity (`out-of-order`, "Table 2 put back in order") with his name; an owner's `PATCH` with `outOfOrder: null` is written the same way and needs no note | 7 |
| `POST /checkout/:playerId/undo` · `GET /undoable` | Takes the latest payment of a player back (D63): the payment lines and the discount leave the statement, tonight's charges are waiting again in their place, the drawer and the online totals, the credit and discount totals go back, and Activity gets `undo` "Payment undone for Bilal Ahmed" (the discount's own event is removed). Only the worker who took it (`NOT_ALLOWED`), within 2 minutes (`UNDO_EXPIRED`), on the same open sheet; `NOT_FOUND` when there is nothing to undo. `GET /undoable` answers `{charge, payment}`: the frame this worker charged less than 2 minutes ago (single frames) and the payment he took less than 2 minutes ago, for the cream toast; each is `null` when there is none. | 24–26 |
| `GET /checkout` · `GET /checkout/:playerId` · `POST /checkout/:playerId` | `CheckoutRequest`. `GET /checkout` is every bill waiting tonight (`WaitingBill`, with `parts` that carry `amount`, `doubled` and, for one room, its own `text`, and `oldestUnpaidAt` while there is old credit) and their `total`. `GET /checkout/:playerId` works for any player (nothing waiting gives an empty `tonight`). `POST` checks the parts, the credit and the discount together (`BILL_MISMATCH` when they do not make the bill) and writes a payment line for each method, the discount line and the Activity event, each with the worker's name. A frame or game charged double is `StatementLine.doubled` | 24–27 |
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
| `GET /prices` · `PATCH /tables/:id` `{price?, maxMinutes?, alsoTableIds?, outOfOrder?}` · `PATCH /categories/:id` `{price?, maxMinutes?, centuryRate?}` · `POST /tables` `{…, maxMinutes?}` · `PATCH /settings` `{rules?: {doubleAfterMin}}` | 45–47, 57 |
| `GET /canteen` · `POST /canteen/items` · `POST /canteen/stock` | 48 |
| `GET /expenses?month=` · `POST /expenses` · `PATCH /expenses/:id` · `DELETE /expenses/:id` | 49 |
| `GET /workers` · `POST /workers` · `PATCH /workers/:id` `{slot?, enabled?}` · `POST /workers/:id/pin` | → each worker with `lastSignIn`, `signedIn`, `signsOutAt` and `sessionEvents` (sign-in, sign-out, automatic sign-out, "Not your time", PIN lockout; newest first). A change of time, a PIN or turning sign-in off is saved in Activity; sign-ins are not. | 50 |
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
| `paused` | 10:01 PM | Zain pressed Pause all at 9:58 PM; every running game is paused. **The games are the ones screen 16 draws** (the scenario replaces the night's games and gives their sessions): Table 1 in frame 4 (06:48), a Century on Table 2 (08:10), Table 4 in frame 2 (11:20), a double on Table 5 (10:05), Room 1 (1:28:05) and Room 2 (0:06:10); Tables 3 and 6 are free | 16 |
| `checkout` | 10:20 PM | 8 players waiting to pay, Rs 6,880 in all (Tariq has paid) | 24–27 |
| `closing` | 3:40 AM Sun | Shabir is signed in (since 2:04 AM); one Century on Table 2; Waqas (old credit 950) and Shoaib (250) not checked out, Rs 450 and Rs 250 tonight; close numbers from `sheets[s48].final` | 32 |
| `closed` | 3:45 AM Sun | Sheet 48 closed, sheet 49 open, the Century moved, Waqas and Shoaib moved to credit | 33, 38–44, 55, 56 |
| `empty` | any | No games, no bills, no activity | empty states |
| `roomEnd` | 10:15 PM | Only Room 1 is running, with a 5-minute power cut already paused (`pausedMs` 300000): 1 h 45 min in the room, Rs 2,500 | 23 |
| `newGame` | 9:53 PM | Zain started a single frame on Table 2 at 9:50 PM for Ahmed Nawaz and Ali Akbar, **added** to the night's own games (`addGames`; the others stay): inside the 5 minutes to change the type, and at 9:50 the 2 minutes to undo | 12, 14 |

- `design/screens.json` gives every screen its `now` (the demo clock the design shows) and, where needed, its `scenario`. Visual tests open `route?now=<now>&scenario=<scenario>`.
- Small number differences against the PNGs are fine. Layout, copy and states must match.

### How the mock behaves (built in P03)

Code: `apps/web/src/mocks` (`db/` is the store, `counter/` and `owner/` are the two APIs, `http.ts` turns an operation into an answer). The rules come from `packages/shared/src/rules`, so the backend later gives the same numbers. Types of every request and answer are in `packages/shared/src/api.ts`.

**What the address can say** (read once, when the page opens):

| Switch | Meaning |
|---|---|
| `?scenario=paused\|checkout\|closing\|closed\|empty` | Another moment of the night (table above). The demo clock moves to the scenario's own moment unless `?now=` is also given. |
| `?now=2026-10-03T22:51:00%2B05:00` | The demo clock. The server checks of sign-in times, the 2-minute undo and the 5-minute type change all use it. |
| `?as=none\|zain\|shabir\|aqil\|adil` | Who is signed in when the page opens. Without it the counter starts as the worker the seed says is signed in (Zain; Shabir in `closing` and `closed`) and the owner app as Aqil. `none` starts signed out. |

**Sessions.** One session per browser tab: a worker or an owner. A counter call without a worker session is a **401** (`UNAUTHENTICATED`); a worker whose time is over is signed out on his next call (**401** `SESSION_ENDED`) and his games keep running. An owner call from a worker session is a plain **404**; without any session it is a **401**. Signing in checks, in this order: the wait after too many tries (429), the time of day (**403** `NOT_YOUR_TIME` with `{slot, now}`), then the PIN. Five wrong PINs mean 5 minutes of waiting; five wrong owner passwords, 15 minutes. In the mock any non-empty owner password works.

**The seed holds the numbers** (nothing is written into the loader): screen 31's counts and the discounts so far (`aggregates.today`: `doubles`, `centuryGames`, `playersPutOnCredit`, `playersPaidOldCredit`, `discounts`), every session frame's `startedAt` and `endedAt`, the non-frame charges of tonight (`tonightCharges`: Bilal's teas), the dispute of activity a2 (`disputes`), the counter's alerts (`counterAlerts`), and when the worker of a night scenario signed in (`signedInSince`). A bill's lines come from the sessions and from `tonightCharges`; the `checkout` scenario has no copy of them. A waiting row that no session explains has its own `lines` (kind and charge, and the item for a canteen line), which must add up to `tonight` (the loader refuses a seed where they do not). **The seed holds no English sentence about a bill**: what a waiting bill is for is built from its lines (`billParts`).

**Statements show when a frame started** (screen 25), although it is charged when it ends; a statement is kept in time order, and the balance after each line is worked out again when a line goes in earlier than the last. Frame 3 of Table 1 is the game running at 9:42 PM (it started at 9:23 PM and the seed ends it at 9:51 PM), so a session shows only the frames already charged.

**The two bells.** The counter's bell counts its own unread alerts (`counterAlerts`: 3 at 9:42 PM, screen 3). The owners' bell counts unread notifications: an unread one can carry `readAt`, the time the owners read it, so n1 to n4 are all unread at 10:30 PM (4, screen 36) and only n4, n5 and n6 at 3:45 AM (3, screens 55 and 56).

**Money model.** The seed's `balance` is the credit from before tonight. Each waiting bill is tonight's charges, posted at load as statement lines and added to the balance (Kamran 1,100 + 250 = 1,350, as on screen 30), so `balance` equals the sum of the statement lines for every player. A charge stays "tonight" until checkout; at close, bills not paid get a "Left without checkout" line. Payments clear the oldest money first (old credit), so what stays on credit after a checkout is new from tonight. Players the seed gives only a balance get one opening-balance line from an owner (D28).

**Who did it.** The client never sends a name. Every write takes `doneBy` from the session and writes it on the record, on the sheet's history, and, for the D52 events (discount, discard, cancel, undo, dispute, double charge, damage, drawer expense, edit, left without checkout, cash difference, pause all, price change, worker change, settings change, and a table marked out of order or put back, D60), in Activity. Activity and notifications dated after the demo clock are not listed yet.

**Live events** (what each refreshes; a key matches by its first word). The mock server fires them after every write; the counter map is `counter/api/invalidations.ts` and the owner map `owner/api/invalidations.ts`.

| Event | Fired by | Counter refreshes | Owner refreshes |
|---|---|---|---|
| `board.changed` | start, end, move, pause, undo and the other game writes; drawer expense; canteen sale; checkout | board, game, today, closePreview, undoable | live, dashboard |
| `game.changed` | any change to one game | game, board | live, dashboard |
| `waiting.changed` | a bill changes (frame ended, damage, canteen, checkout, undo of a payment, dispute decided) | board, undoable, checkout, today, closePreview, players, statement, canteen | live, dashboard, players |
| `sheet.closed` | close sheet | nearly everything | sheets, folders, activity, players, reports… |
| `notification.created` | a notification is written | board | notifications, dashboard, activity |
| `worker.signedIn` / `worker.signedOut` | worker sign-in, sign-out, end of time | me, workers, board | workers |
| `price.changed` | a price or a new table | board | prices, live |
| `settings.changed` | settings, workers | workers, board, checkout | settings, workers |

**Known differences from the real server** (so nobody is surprised):
- The counter tab and the owner tab each hold their own store, so a write in one does not show in the other until the backend exists.
- Words the mock writes (activity titles, statement lines) are English only.
- The seed has no source for the screen 29 drawer figure (Rs 12,300); the drawer starts from `aggregates.today`. Screens 53, 54 and 57 draw 3 on the owner bell where the story gives 4 (10:30 PM) and 2 (9:44 PM): a slip in the designs, listed in `PROGRESS.md`.
- `GET /reports` always answers with the September against August report; the answer says which months it is for.
- The seed lists individual sheets only for 46 to 48 (and 49 after close). Other months have a folder and no sheets. Sheets 46 and 47 have only `earned`.
- The owner PDF and Excel downloads are stand-in text files until P13.
- The dashboard's player counts (41 owing, 312 players) are the seed's; the player list holds the 21 seed players.

## The maximum time of a game (D56)

- **Where it lives:** `Table.maxMinutes` (5 to 180 whole minutes), set with the price. A game charged per game (a single or double frame, a game of pool, foosball, carrom, ludo, PlayStation) copies it to `Game.maxMinutes` when it starts and keeps it. Rooms and Century have none.
- **Who sets it:** the owners, on screen 46 (with the price, and "also these tables"), on a whole game's price card, and when adding a table (screen 47; left empty it takes `Settings.rules.doubleAfterMin`, which screen 51 sets). A value outside 5 to 180, or not a whole number, or on a room, is a 400 `VALIDATION`. Each save is in Activity (`price-change`, "Maximum time changed: Table 4", "30 min to 20 min. Games already started keep their limit.") with the owner's name; a change of the starting value is a `settings-change`.
- **What the counter does:** `tableStatus` says `overLimit` at `maxMinutes`:00 (`isGameOverLimit`); the pill, the red card, the table's name for a screen reader and the lock screen say that game's number; `POST /games/:id/end` accepts `chargeDouble` for any game that is over its own limit (a single frame, a double frame, a game) and refuses it under the limit (`A game is charged double only after 20 minutes.`) and for Century and rooms. A game saved without a limit (older data) gets 30 (`DEFAULT_MAX_MINUTES`).
- **The seed:** every table except a room has `maxMinutes: 30`; Tables 1, 4, 5 and 6's running games have it too. `aggregates.today.overLimit` replaces `over30`; `Dashboard.today.overLimit` counts the games over their own limit right now.
