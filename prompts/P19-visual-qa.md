# P19-visual-qa · Visual check of all 58 screens and accessibility

**Goal:** Compare every route with its approved PNG, fix the differences, and pass the accessibility and touch-size checks.

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/10_TESTING_AND_QA.md` (all), `design/screens.json` (number, route, file, size, demo clock `now` and `scenario` for every screen)

## Look at these screens before you write code
Open each PNG (it is the approved design) and read its HTML for exact sizes, colours and copy.
- Screen 1, Worker sign-in (1440×900, clock 9:42 PM): `design/screens/01-worker-sign-in.png` and `design/html/01-worker-sign-in.html` → `/sign-in`
- Screen 2, Not your time to sign in (1440×900, clock 9:42 PM): `design/screens/02-not-your-time-to-sign-in.png` and `design/html/02-not-your-time-to-sign-in.html` → `/sign-in?worker=shabir`
- Screen 3, Live board (1440×952, clock 9:42 PM): `design/screens/03-live-board.png` and `design/html/03-live-board.html` → `/`
- Screen 4, Pool tables before a price is set (1440×900, clock 9:44 PM): `design/screens/04-pool-tables-before-a-price-is-set.png` and `design/html/04-pool-tables-before-a-price-is-set.html` → `/board/pool`
- Screen 5, Pool, carrom, foosball, ludo and PlayStation (1440×1901, clock 9:44 PM): `design/screens/05-pool-carrom-foosball-ludo-and-playstation.png` and `design/html/05-pool-carrom-foosball-ludo-and-playstation.html` → `/dev/games-preview`
- Screen 6, Live board in Urdu (1440×1040, clock 9:42 PM): `design/screens/06-live-board-in-urdu.png` and `design/html/06-live-board-in-urdu.html` → `/?lang=ur`
- Screen 7, Start a game: choose the type (1440×900, clock 9:46 PM): `design/screens/07-start-a-game-choose-the-type.png` and `design/html/07-start-a-game-choose-the-type.html` → `/table/t2/start`
- Screen 8, Start a game: pick the players (1440×900, clock 9:46 PM): `design/screens/08-start-a-game-pick-the-players.png` and `design/html/08-start-a-game-pick-the-players.html` → `/table/t2/start/players`
- Screen 9, Double frame: pick the two sides (1440×900, clock 9:47 PM): `design/screens/09-double-frame-pick-the-two-sides.png` and `design/html/09-double-frame-pick-the-two-sides.html` → `/table/t2/start/double`
- Screen 10, Add a new player (1440×900, clock 9:47 PM): `design/screens/10-add-a-new-player.png` and `design/html/10-add-a-new-player.html` → `/players/new?for=t2`
- Screen 11, A game that is running (1440×900, clock 9:42 PM): `design/screens/11-a-game-that-is-running.png` and `design/html/11-a-game-that-is-running.html` → `/table/t1`
- Screen 12, Change the game type (1440×900, clock 9:53 PM): `design/screens/12-change-the-game-type.png` and `design/html/12-change-the-game-type.html` → `/table/t2/change-type`
- Screen 13, Move to another table, or swap a player (1440×900, clock 9:43 PM): `design/screens/13-move-to-another-table-or-swap-a-player.png` and `design/html/13-move-to-another-table-or-swap-a-player.html` → `/table/t1/move`
- Screen 14, Stop a frame without the normal charge (1440×900, clock 9:50 PM): `design/screens/14-stop-a-frame-without-the-normal-charge.png` and `design/html/14-stop-a-frame-without-the-normal-charge.html` → `/table/t6/stop`
- Screen 15, Damage charge (1440×900, clock 9:45 PM): `design/screens/15-damage-charge.png` and `design/html/15-damage-charge.html` → `/table/t1/damage`
- Screen 16, Power cut (1440×966, clock 10:01 PM, scenario `paused`): `design/screens/16-power-cut.png` and `design/html/16-power-cut.html` → `/?scenario=paused`
- Screen 17, End a frame: who lost? (1440×900, clock 9:51 PM): `design/screens/17-end-a-frame-who-lost.png` and `design/html/17-end-a-frame-who-lost.html` → `/table/t1/end`
- Screen 18, Frame charged, next frame (1440×900, clock 9:51 PM): `design/screens/18-frame-charged-next-frame.png` and `design/html/18-frame-charged-next-frame.html` → `/table/t1/next`
- Screen 19, Over 30 minutes: charge double? (1440×900, clock 9:46 PM): `design/screens/19-over-30-minutes-charge-double.png` and `design/html/19-over-30-minutes-charge-double.html` → `/table/t4/end/overtime`
- Screen 20, End a double frame (1440×900, clock 9:47 PM): `design/screens/20-end-a-double-frame.png` and `design/html/20-end-a-double-frame.html` → `/table/t5/end`
- Screen 21, End Century (1440×900, clock 9:47 PM): `design/screens/21-end-century.png` and `design/html/21-end-century.html` → `/table/t3/end`
- Screen 22, Start a room (1440×900, clock 9:52 PM): `design/screens/22-start-a-room.png` and `design/html/22-start-a-room.html` → `/room/r2/start`
- Screen 23, End a room (1440×900, clock 10:15 PM): `design/screens/23-end-a-room.png` and `design/html/23-end-a-room.html` → `/room/r1/end`
- Screen 24, Checkout: who is paying? (1440×900, clock 10:20 PM, scenario `checkout`): `design/screens/24-checkout-who-is-paying.png` and `design/html/24-checkout-who-is-paying.html` → `/checkout`
- Screen 25, A player’s bill (1440×900, clock 10:20 PM, scenario `checkout`): `design/screens/25-a-players-bill.png` and `design/html/25-a-players-bill.html` → `/checkout/bilal`
- Screen 26, Part payment (1440×900, clock 10:22 PM, scenario `checkout`): `design/screens/26-part-payment.png` and `design/html/26-part-payment.html` → `/checkout/bilal/part`
- Screen 27, Give a discount (1440×900, clock 10:21 PM, scenario `checkout`): `design/screens/27-give-a-discount.png` and `design/html/27-give-a-discount.html` → `/checkout/bilal/discount`
- Screen 28, Canteen sale (1440×900, clock 9:55 PM): `design/screens/28-canteen-sale.png` and `design/html/28-canteen-sale.html` → `/canteen`
- Screen 29, Expense from the drawer (1440×900, clock 8:15 PM): `design/screens/29-expense-from-the-drawer.png` and `design/html/29-expense-from-the-drawer.html` → `/expense`
- Screen 30, Players and their statements (1440×900, clock 10:25 PM): `design/screens/30-players-and-their-statements.png` and `design/html/30-players-and-their-statements.html` → `/players/kamran`
- Screen 31, Today’s totals (1440×900, clock 10:30 PM): `design/screens/31-todays-totals.png` and `design/html/31-todays-totals.html` → `/today`
- Screen 32, Close the sheet (1440×924, clock 3:40 AM, scenario `closing`): `design/screens/32-close-the-sheet.png` and `design/html/32-close-the-sheet.html` → `/close-sheet`
- Screen 33, New sheet opened (1440×900, clock 3:40 AM, scenario `closed`): `design/screens/33-new-sheet-opened.png` and `design/html/33-new-sheet-opened.html` → `/sheet-closed`
- Screen 34, Screen locked (1440×900, clock 9:42 PM): `design/screens/34-screen-locked.png` and `design/html/34-screen-locked.html` → `/?locked=1`
- Screen 35, Owner sign-in at the private address (1440×900, clock 10:30 PM): `design/screens/35-owner-sign-in-at-the-private-address.png` and `design/html/35-owner-sign-in-at-the-private-address.html` → `/owner-dev/sign-in`
- Screen 36, Dashboard (1440×1479, clock 10:30 PM): `design/screens/36-dashboard.png` and `design/html/36-dashboard.html` → `/owner-dev/`
- Screen 37, Reports and comparisons (1440×1818, clock 10:30 PM): `design/screens/37-reports-and-comparisons.png` and `design/html/37-reports-and-comparisons.html` → `/owner-dev/reports`
- Screen 38, Activity (1440×1377, clock 3:45 AM, scenario `closed`): `design/screens/38-activity.png` and `design/html/38-activity.html` → `/owner-dev/activity`
- Screen 39, Sheets: month folders (1440×900, clock 3:45 AM, scenario `closed`): `design/screens/39-sheets-month-folders.png` and `design/html/39-sheets-month-folders.html` → `/owner-dev/sheets`
- Screen 40, Sheets: days in a month (1440×900, clock 3:45 AM, scenario `closed`): `design/screens/40-sheets-days-in-a-month.png` and `design/html/40-sheets-days-in-a-month.html` → `/owner-dev/sheets/2026-10`
- Screen 41, A day’s sheet (1440×900, clock 3:45 AM, scenario `closed`): `design/screens/41-a-days-sheet.png` and `design/html/41-a-days-sheet.html` → `/owner-dev/sheets/s48`
- Screen 42, Correct a sheet (1440×907, clock 3:45 AM, scenario `closed`): `design/screens/42-correct-a-sheet.png` and `design/html/42-correct-a-sheet.html` → `/owner-dev/sheets/s48/edit`
- Screen 43, Players and credit (1440×900, clock 3:45 AM, scenario `closed`): `design/screens/43-players-and-credit.png` and `design/html/43-players-and-credit.html` → `/owner-dev/players`
- Screen 44, A player’s page (1440×900, clock 3:45 AM, scenario `closed`): `design/screens/44-a-players-page.png` and `design/html/44-a-players-page.html` → `/owner-dev/players/kamran`
- Screen 45, Games and prices (1440×1420, clock 10:30 PM): `design/screens/45-games-and-prices.png` and `design/html/45-games-and-prices.html` → `/owner-dev/prices`
- Screen 46, Change a price (1440×942, clock 10:30 PM): `design/screens/46-change-a-price.png` and `design/html/46-change-a-price.html` → `/owner-dev/prices/t4`
- Screen 47, Add a game or table (1440×900, clock 10:30 PM): `design/screens/47-add-a-game-or-table.png` and `design/html/47-add-a-game-or-table.html` → `/owner-dev/prices/add`
- Screen 48, Canteen and stock (1440×1073, clock 10:30 PM): `design/screens/48-canteen-and-stock.png` and `design/html/48-canteen-and-stock.html` → `/owner-dev/canteen`
- Screen 49, Expenses (1440×1127, clock 10:30 PM): `design/screens/49-expenses.png` and `design/html/49-expenses.html` → `/owner-dev/expenses`
- Screen 50, Workers and sign-in times (1440×1078, clock 10:30 PM): `design/screens/50-workers-and-sign-in-times.png` and `design/html/50-workers-and-sign-in-times.html` → `/owner-dev/workers`
- Screen 51, Settings (1440×1936, clock 10:30 PM): `design/screens/51-settings.png` and `design/html/51-settings.html` → `/owner-dev/settings`
- Screen 52, Sign in (390×844, clock 10:30 PM): `design/screens/52-sign-in.png` and `design/html/52-sign-in.html` → `/owner-dev/sign-in`
- Screen 53, Home (390×1715, clock 10:30 PM): `design/screens/53-home.png` and `design/html/53-home.html` → `/owner-dev/`
- Screen 54, Live tables (390×1265, clock 9:44 PM): `design/screens/54-live-tables.png` and `design/html/54-live-tables.html` → `/owner-dev/live`
- Screen 55, Sheets (390×853, clock 3:45 AM, scenario `closed`): `design/screens/55-sheets.png` and `design/html/55-sheets.html` → `/owner-dev/sheets/2026-10`
- Screen 56, A player’s statement (390×1136, clock 3:45 AM, scenario `closed`): `design/screens/56-a-players-statement.png` and `design/html/56-a-players-statement.html` → `/owner-dev/players/kamran`
- Screen 57, Games and prices (390×1356, clock 10:30 PM): `design/screens/57-games-and-prices.png` and `design/html/57-games-and-prices.html` → `/owner-dev/prices`
- Screen 58, Alerts (390×1033, clock 10:30 PM): `design/screens/58-alerts.png` and `design/html/58-alerts.html` → `/owner-dev/alerts`

## Build
1. Generate `tests/visual/screens.spec.ts` from `design/screens.json`:
   - One test per screen: open `route?now=<now>&scenario=<scenario>` (owner routes under `/owner-dev`), viewport width from `size`, full-page screenshot (`10_TESTING_AND_QA.md` §2–3).
   - Dialog states opened through the route or `?state=`.
   - The PNG as the baseline.
2. Run it, open every diff, and fix what is visibly different: layout, size, colour, copy, missing states. Repeat until every screen passes at `maxDiffPixelRatio: 0.06`, or explain why one cannot (for example a live number).
3. Accessibility: run axe on every route (no serious or critical issues); keyboard tab order; focus visible; dialogs.
4. Touch-size test: every button is at least 56 px on counter routes and at least 44 px on owner routes.
5. Write `docs/QA_REPORT.md`: one line per screen (✓ or what is still different and why).

## Done when
- `npm run test:visual` passes for all 58 screens (or `QA_REPORT.md` explains each exception).
- axe and the touch-size tests pass.

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).


## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run test:visual` for the screens above. Fix everything until they pass.
2. Start the app and compare each screen above with its PNG at the design size. List any difference you could not fix.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P19 Visual check of all 58 screens and accessibility"`.
6. If anything needs my answer, list the questions at the very end of your report (also in PROGRESS.md). I will answer in this same session; then apply the answers, update PROGRESS.md, run the checks and commit again as "P19 answers". The next step starts in a new session only after that.
