# 03 · Routes and screens

Every approved screen with its number, route, files and main parts. Counter routes are under `/`; owner routes are under the private address (in development `/owner-dev/`). The owner phone uses the same routes as the desktop, laid out for 390 px.

Image: `design/screens/<file>.png` · HTML: `design/html/<file>.html`

## Counter screen

| # | Screen | Route (state) | File | Size | Main parts | States to build |
|---|---|---|---|---|---|---|
| 1 | **Worker sign-in**: Shabir and Zain each have their own PIN, and each can sign in only in his own time. There is no owner button on the counter. | `/sign-in` | `01-worker-sign-in` | 1440×900 | WorkerCards, Keypad, PinDots, LanguageSwitch | Zain selected, 2 of 4 digits; wrong PIN; too many tries |
| 2 | **Not your time to sign in**: Outside his time a worker’s PIN does not work. The counter shows when his time is. | `/sign-in?worker=shabir` | `02-not-your-time-to-sign-in` | 1440×900 | WorkerCards, NotYourTimeAlert | 403 NOT_YOUR_TIME from the server |
| 3 | **Live board**: Every table is drawn as a real snooker table, with its timer and the amount so far. Rooms show the table with the sofa. On the right: players who still have to pay. | `/  (= /board/snooker)` | `03-live-board` | 1440×952 | CounterTopBar, WorkerChip, CategoryTabs, SnookerTile, RoomTile, WaitingPanel, CounterActionBar | every tile state; waiting list; unread badge |
| 4 | **Pool tables before a price is set**: The pool tables show on the board but stay locked until you set a price. Foosball, carrom, ludo and PlayStation work the same way. | `/board/pool` | `04-pool-tables-before-a-price-is-set` | 1440×900 | CategoryTabs, PoolTile (noPrice), InfoBanner | prices not set: tiles disabled |
| 5 | **Pool, carrom, foosball, ludo and PlayStation**: How each game will look once you set its prices: a pool table, a carrom board, a foosball table, a ludo board and a TV. The prices here are only examples. | `/dev/games-preview  (real: /board/carrom, /board/foosball, /board/ludo, /board/playstation)` | `05-pool-carrom-foosball-ludo-and-playstation` | 1440×1901 | PoolTile, CarromTile, FoosballTile, LudoTile, PlayStationTile | each game in free/playing/over/paused/out of order, example prices |
| 6 | **Live board in Urdu**: One tap on the language button switches the whole screen to Urdu, and back. | `/?lang=ur` | `06-live-board-in-urdu` | 1440×1040 | same as screen 3, right-to-left | Urdu copy and mirrored layout |
| 7 | **Start a game: choose the type**: Tap a free table, then choose single frame, double frame or Century. The Century rate can be changed for this game. | `/table/t2/start` | `07-start-a-game-choose-the-type` | 1440×900 | CounterDialog, OptionCard ×3, Century rate stepper | Century selected; Mark out of order |
| 8 | **Start a game: pick the players**: Search by name or phone, or tap a player who played here recently. | `/table/t2/start/players` | `08-start-a-game-pick-the-players` | 1440×900 | Player search, PersonCard list, recent players | player 1 picked, searching player 2; "Playing on Table 1" tags |
| 9 | **Double frame: pick the two sides**: Two against two. Three players also count as a double. | `/table/t2/start/double` | `09-double-frame-pick-the-two-sides` | 1440×900 | Two side boxes, search, PersonCard | 3 players count as a double |
| 10 | **Add a new player**: Only the name is needed; the phone can be added later. Similar names are shown so nobody is added twice. | `/players/new?for=t2` | `10-add-a-new-player` | 1440×900 | Field, Keypad (phone), similar-names list | skip phone |
| 11 | **A game that is running**: Tap a table to end the frame, pause it, move it, swap a player, add a canteen item or a damage charge, or discard it. | `/table/t1` | `11-a-game-that-is-running` | 1440×900 | SidePanel, TimerText, session score, action grid | change-type window closed note; board faded behind |
| 12 | **Change the game type**: In the first 5 minutes the game type can be changed, for example from a single frame to Century. | `/table/t2/change-type` | `12-change-the-game-type` | 1440×900 | CounterDialog, OptionCard ("Now" badge) | 2 minutes left |
| 13 | **Move to another table, or swap a player**: A moved frame keeps the price of the table it started on. | `/table/t1/move` | `13-move-to-another-table-or-swap-a-player` | 1440×900 | two panels: move to free table, replace a player | out-of-order table disabled |
| 14 | **Stop a frame without the normal charge**: Discard it, mark it as a dispute for you to decide, or cancel it. A reason is needed. A game started by mistake can be undone for 2 minutes. | `/table/t6/stop` | `14-stop-a-frame-without-the-normal-charge` | 1440×900 | OptionCard ×3, reason chips, note, Toast with Undo | discard / dispute / cancel |
| 15 | **Damage charge**: A broken cue, ball or cloth goes on the player’s bill with a note. You see it in Activity. | `/table/t1/damage` | `15-damage-charge` | 1440×900 | PersonCard, chips, MoneyInput, quick amounts, note | note required |
| 16 | **Power cut**: Pause every table with one tap. Paused minutes are not charged. | `/?scenario=paused` | `16-power-cut` | 1440×966 | pause banner with Resume all, tiles as div with Resume buttons | all running games paused |
| 17 | **End a frame: who lost?**: The player who lost pays for the frame. The winner is recorded. | `/table/t1/end` | `17-end-a-frame-who-lost` | 1440×900 | CounterDialog, PersonCard ×2 (who lost) | Keep playing, Nobody pays |
| 18 | **Frame charged, next frame**: The same players can start the next frame with one tap. The session score is kept. | `/table/t1/next` | `18-frame-charged-next-frame` | 1440×900 | success header, session score, next-frame options, Toast Undo | Undo for 2 minutes |
| 19 | **Over 30 minutes: charge double?**: The timer shows a red card after 30 minutes. At the end the counter chooses normal or double price. | `/table/t4/end/overtime` | `19-over-30-minutes-charge-double` | 1440×900 | CounterDialog (warning), OptionCard ×2 | normal or double price |
| 20 | **End a double frame**: The losing side pays: half each, one pays all, or a custom split. | `/table/t5/end` | `20-end-a-double-frame` | 1440×900 | two sides, split options (half each, one pays all, custom) | custom split must add up |
| 21 | **End Century**: Charged for whole minutes at the rate set at the start, to the player it was started under. | `/table/t3/end` | `21-end-century` | 1440×900 | summary rows: time, minutes charged, rate, paused | whole minutes only |
| 22 | **Start a room**: Under one player. Rs 1,500 an hour, and the counter can change it when starting. | `/room/r2/start` | `22-start-a-room` | 1440×900 | player, hourly price stepper, examples | default Rs 1,500, changeable |
| 23 | **End a room**: 1 hour minimum, then by the minute. 1 hour 40 minutes is Rs 2,500. | `/room/r1/end` | `23-end-a-room` | 1440×900 | summary: first hour, minutes after, total | 1 hour minimum |
| 24 | **Checkout: who is paying?**: Everyone who has not paid yet tonight, with old credit shown too. | `/checkout` | `24-checkout-who-is-paying` | 1440×900 | search, tabs (Waiting to pay / Owes from before), bill cards | total waiting tonight |
| 25 | **A player’s bill**: Old balance plus tonight’s games and canteen. Pay in full, pay part, or put it on credit. | `/checkout/bilal` | `25-a-players-bill` | 1440×900 | StatementTable (bill), pay options, payment methods | pay in full / part / credit |
| 26 | **Part payment**: Pay part now, even with two methods. The rest goes to the player’s credit. | `/checkout/bilal/part` | `26-part-payment` | 1440×900 | split rows per method, Keypad, totals | extra becomes advance |
| 27 | **Give a discount**: Allowed with a reason. You see every discount in Activity. | `/checkout/bilal/discount` | `27-give-a-discount` | 1440×900 | MoneyInput, reason chips, note, new total | reason required |
| 28 | **Canteen sale**: Add items to a player’s bill, or take cash straight away with no name. | `/canteen` | `28-canteen-sale` | 1440×900 | item grid with stock, charge to player or cash sale, basket | low stock, sold out |
| 29 | **Expense from the drawer**: Food, petrol or other cash taken from the drawer. It comes off the expected cash, and you see it with the worker’s name. | `/expense` | `29-expense-from-the-drawer` | 1440×900 | CounterDialog, category chips, MoneyInput, quick amounts, drawer preview | note required; shows "Added by Zain" |
| 30 | **Players and their statements**: Every player’s account, like a bank statement. | `/players/kamran` | `30-players-and-their-statements` | 1440×900 | player list with filters, StatementTable | owes, advance |
| 31 | **Today’s totals**: Cash that should be in the drawer after drawer expenses, and the online money by method. No profit here. | `/today` | `31-todays-totals` | 1440×900 | drawer cash card, online by method, counts, waiting | drawer cash after drawer expenses |
| 32 | **Close the sheet**: The counter counts the cash. If it is short or extra, a note is needed. | `/close-sheet` | `32-close-the-sheet` | 1440×924 | cash count, online totals, when-you-close list, summary | short/extra needs a note |
| 33 | **New sheet opened**: Games still running move to the new sheet. Anyone who left without paying moves to credit. | `/sheet-closed` | `33-new-sheet-opened` | 1440×900 | result summary | games moved, credit moved, cash check |
| 34 | **Screen locked**: Locks after 5 minutes without a tap. The signed-in worker unlocks it with his PIN, or the other worker signs in. Games keep running. | `/?locked=1` | `34-screen-locked` | 1440×900 | lock overlay: clock, table summary, Keypad, Switch worker | auto after 5 minutes |

## Owner portal on the computer

| # | Screen | Route (state) | File | Size | Main parts | States to build |
|---|---|---|---|---|---|---|
| 35 | **Owner sign-in at the private address**: Only at your private address, which workers never see. Aqil and Adil each use their own password. | `/sign-in` | `35-owner-sign-in-at-the-private-address` | 1440×900 | owner choice, password, keep signed in | wrong password, wait 15 minutes |
| 36 | **Dashboard**: Today’s money, this month’s profit, credit, busy hours, top players and what needs a look. | `/` | `36-dashboard` | 1440×1479 | OwnerSidebar, StatCard, BarChartDays, HBarList, BusyHours, lists | live, updated time |
| 37 | **Reports and comparisons**: Compare months: earned, expenses, profit, by game, by table and by payment method. | `/reports` | `37-reports-and-comparisons` | 1440×1818 | period picker, StatCard ×4, LineChartMonth, tables, bars, year bars | month vs month |
| 38 | **Activity**: Every discount, edit, cancel, damage charge, drawer expense and double charge, with the name of who did it. Disputes wait here for you. | `/activity` | `38-activity` | 1440×1377 | dispute banner, type chips, Done-by chips, DataTable | disputes waiting |
| 39 | **Sheets: month folders**: One folder for each month. | `/sheets` | `39-sheets-month-folders` | 1440×900 | folder list, calendar toggle, search |  |
| 40 | **Sheets: days in a month**: Every day’s sheet, with PDF and Excel download. | `/sheets/2026-10` | `40-sheets-days-in-a-month` | 1440×900 | day rows with PDF/Excel, month calendar heat | open sheet |
| 41 | **A day’s sheet**: Every table, room, payment and canteen sale for the day. | `/sheets/s48` | `41-a-days-sheet` | 1440×900 | tabs, spreadsheet grid, money summary | Correct an entry |
| 42 | **Correct a sheet**: Owners can fix an entry. The reason and the old value are kept. | `/sheets/s48/edit` | `42-correct-a-sheet` | 1440×907 | editable grid, OwnerAside with reason and history | reason required |
| 43 | **Players and credit**: Who owes money, how much and since when. Older than 15 days is marked. | `/players` | `43-players-and-credit` | 1440×900 | StatCard ×3, search, filter chips, DataTable | owe money, old, advance, no phone |
| 44 | **A player’s page**: Details, record a payment, enter old credit from the register, and the full statement. | `/players/kamran` | `44-a-players-page` | 1440×900 | profile card, actions, StatementTable (editable) | PDF/Excel |
| 45 | **Games and prices**: Every table and room with its price. New games wait here for a price. | `/prices` | `45-games-and-prices` | 1440×1420 | table price cards, Century rate, rooms, waiting-for-price list |  |
| 46 | **Change a price**: Counts from the moment you save. Running games keep their old price. | `/prices/t4` | `46-change-a-price` | 1440×942 | cards with selection, OwnerAside: new price, same change for others | starts on save |
| 47 | **Add a game or table**: A new snooker table becomes Table 8 automatically. | `/prices/add` | `47-add-a-game-or-table` | 1440×900 | numbered steps, choice cards, preview with SnookerTile | next number automatically |
| 48 | **Canteen and stock**: Buying price, selling price, profit and stock for each item. | `/canteen` | `48-canteen-and-stock` | 1440×1073 | StatCard ×4, filter chips, DataTable, OwnerAside: add stock | low stock |
| 49 | **Expenses**: Bills, repairs, salaries and advances, plus cash the workers took from the drawer, with their names. | `/expenses` | `49-expenses` | 1440×1127 | month picker, StatCard ×3, HBarList, DataTable, OwnerAside: add expense | drawer expenses by workers |
| 50 | **Workers and sign-in times**: Set the daily sign-in time for Shabir and Zain, change their PINs, or add a worker. | `/workers` | `50-workers-and-sign-in-times` | 1440×1078 | SignInTimeline, worker cards, OwnerAside with TimeSlotPicker | gaps hatched, now line |
| 51 | **Settings**: Owner passwords and the private owner address, payment methods, counter rules, phone alerts, daily email, language and backups. | `/settings` | `51-settings` | 1440×1936 | cards: who can sign in (private address), payment methods, rules, alerts, email, language, backups, club |  |

## Owner portal on the phone

| # | Screen | Route (state) | File | Size | Main parts | States to build |
|---|---|---|---|---|---|---|
| 52 | **Sign in**: Owners only, at the private address. Each owner has his own password. | `/sign-in` | `52-sign-in` | 390×844 | owner choice, password |  |
| 53 | **Home**: Today’s money and what needs a look. | `/` | `53-home` | 390×1715 | PhoneTopBar, hero, mini stats, chart, lists, PhoneTabBar |  |
| 54 | **Live tables**: What the counter sees, right now. | `/live` | `54-live-tables` | 390×1265 | category chips, rows with MiniTable | red card timer |
| 55 | **Sheets**: Every day’s sheet, by month. | `/sheets/2026-10` | `55-sheets` | 390×853 | month switcher, summary, day rows |  |
| 56 | **A player’s statement**: Call the player or download the statement. | `/players/kamran` | `56-a-players-statement` | 390×1136 | profile, Call, Download PDF, Record a payment, statement list |  |
| 57 | **Games and prices**: Change prices from your phone. | `/prices` | `57-games-and-prices` | 390×1356 | grouped price rows |  |
| 58 | **Alerts**: Sheet closed, left without paying, cancelled games, edits and low stock. | `/alerts` | `58-alerts` | 390×1033 | filter chips, grouped list | unread dots |

## Routes without their own design

| Route | What | Build from |
|---|---|---|
| counter `/board/pool` (screen 4), `/board/carrom`, `/board/foosball`, `/board/ludo`, `/board/playstation` | the other game tabs. **Built in P05.** While no table has a price: the amber box, the locked tiles and the two cards of screen 4 (for the four games without a PNG, see `docs/NO_DESIGN.md` §9). Once prices are set: the grid of that game from screen 5, with no banner and no cards. No waiting list on these tabs (screens 4 and 5 draw none). `/board/snooker` and `/board/room` go to `/` | screen 4, screen 5 |
| counter `/table/:id/start`, `/table/:id`, `/room/:id/start`, `/checkout/:playerId` | where a tap on a free table, a running table, a free room and a waiting player goes. **Placeholders until P06, P07 and P09** (the name of what opens, inside the real frame). P06 and P07 turn the first three into child routes of the board, so their panels draw over it like `/alerts` | P05 |
| owner `/live` (desktop) | read-only live board for owners | screen 3 without the action bar and without tap actions |
| owner `/alerts` (desktop) | notifications | screen 58 content in a desktop card |
| counter `/checkout`, `/canteen`, `/players`, `/today`, `/expense`, `/close-sheet` | the action bar's screens, until their steps are built | placeholder with the button's name, inside the real frame (P04) |
| counter `/alerts` | the bell's side panel with the counter's alerts, over the board | the counter side panel of screen 11 and the rows of screen 58; no PNG of its own (`docs/NO_DESIGN.md` §3). It is a child route of the board, so the board must draw an `<Outlet/>` |
| counter `/pause-all` | **temporary.** Pause all is an action (screen 16), not a screen | placeholder, so the button goes somewhere; **P07** replaces it with the action and removes the route (P05 did not build it) |
| counter `/sign-in?worker=<id>` | picks that worker; for a worker who is "Not now" it opens on screen 2 | P04 (test and demo link) |
| any unknown path | "Page not found" | plain page, same look for every app; never mentions owners |
| `/dev/kit`, `/dev/tiles`, `/dev/games-preview`, `/dev/data` | development only (`/dev/data` is in both apps: the board and workers from the mock API, with a button that starts a game) | P01, P02, P03 |
