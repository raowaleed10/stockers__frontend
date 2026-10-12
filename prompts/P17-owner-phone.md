# P17-owner-phone · Owner portal on the phone

**Goal:** Make every owner route work well at 390 px wide, matching the phone designs, and finish the phone-only pages (live tables, alerts).

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/04_DESIGN_SYSTEM.md` §7 (phone), `docs/03_ROUTES_AND_SCREENS.md` (phone rows)

## Look at these screens before you write code
Open each PNG (it is the approved design) and read its HTML for exact sizes, colours and copy.
- Screen 52, Sign in (390×844, clock 10:30 PM): `design/screens/52-sign-in.png` and `design/html/52-sign-in.html` → `/owner-dev/sign-in`
- Screen 53, Home (390×1715, clock 10:30 PM): `design/screens/53-home.png` and `design/html/53-home.html` → `/owner-dev/`
- Screen 54, Live tables (390×1265, clock 9:44 PM): `design/screens/54-live-tables.png` and `design/html/54-live-tables.html` → `/owner-dev/live`
- Screen 55, Sheets (390×853, clock 3:45 AM, scenario `closed`): `design/screens/55-sheets.png` and `design/html/55-sheets.html` → `/owner-dev/sheets/2026-10`
- Screen 56, A player’s statement (390×1136, clock 3:45 AM, scenario `closed`): `design/screens/56-a-players-statement.png` and `design/html/56-a-players-statement.html` → `/owner-dev/players/kamran`
- Screen 57, Games and prices (390×1356, clock 10:30 PM): `design/screens/57-games-and-prices.png` and `design/html/57-games-and-prices.html` → `/owner-dev/prices`
- Screen 58, Alerts (390×1033, clock 10:30 PM): `design/screens/58-alerts.png` and `design/html/58-alerts.html` → `/owner-dev/alerts`

## Build
1. Check every owner route at 390×844. Tables scroll sideways inside their card; asides become bottom sheets; stat grids go to 2 columns.
2. `/live` (screen 54):
   - Category chips; rows with `MiniTable`, name, status pill, players, game line, the timer (with the red card when over 30) and the amount.
   - The "Waiting to pay" card; the note "Games are started and ended at the counter…".
   - On desktop, `/live` shows the read-only board (the screen 3 layout without actions).
3. `/alerts` (screen 58):
   - Filter chips (All, Sheets, Games, Edits, Stock); grouped Today and Yesterday lists with unread dots; Mark all read.
   - Only the 5 alert kinds from Q12.
   - "Choose which alerts you get" goes to Settings.
4. Screens 52, 53, 55, 56 and 57 were built in earlier steps: polish them here to match at 390 px.
5. Install as a PWA on phones: manifest (name Stockers, theme `#211913`, icon placeholder), and a service worker that caches the app shell only. The owner app's manifest `start_url` is relative.

## Done when
- Screens 52–58 match their PNGs at 390×844 in the `phone` Playwright project.
- No horizontal page scroll on any owner route at 390 px.

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).


## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run test:visual` for the screens above. Fix everything until they pass.
2. Start the app and compare each screen above with its PNG at the design size. List any difference you could not fix.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P17 Owner portal on the phone"`.
6. If anything needs my answer, list the questions at the very end of your report (also in PROGRESS.md). I will answer in this same session; then apply the answers, update PROGRESS.md, run the checks and commit again as "P17 answers". The next step starts in a new session only after that.
