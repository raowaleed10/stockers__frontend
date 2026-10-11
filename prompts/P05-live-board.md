# P05-live-board · Live board, game tabs, waiting to pay, Urdu board

**Goal:** Build the live board: all tables as tiles with live timers and amounts, the game tabs, the "Waiting to pay" panel, and the Urdu version.

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/04_DESIGN_SYSTEM.md` §5–7, `docs/07_RULES_FOR_SCREENS.md` §2 and §8, `docs/09_URDU_RTL.md`

## Look at these screens before you write code
Open each PNG (it is the approved design) and read its HTML for exact sizes, colours and copy.
- Screen 3, Live board (1440×952, clock 9:42 PM): `design/screens/03-live-board.png` and `design/html/03-live-board.html` → `/`
- Screen 4, Pool tables before a price is set (1440×900, clock 9:44 PM): `design/screens/04-pool-tables-before-a-price-is-set.png` and `design/html/04-pool-tables-before-a-price-is-set.html` → `/board/pool`
- Screen 5, Pool, carrom, foosball, ludo and PlayStation (1440×1901, clock 9:44 PM): `design/screens/05-pool-carrom-foosball-ludo-and-playstation.png` and `design/html/05-pool-carrom-foosball-ludo-and-playstation.html` → `/dev/games-preview`
- Screen 6, Live board in Urdu (1440×1040, clock 9:42 PM): `design/screens/06-live-board-in-urdu.png` and `design/html/06-live-board-in-urdu.html` → `/?lang=ur`

## Build
1. `/` and `/board/:category` (screen 3):
   - `CategoryTabs` with in-use counts.
   - A grid of `GameTile` from `GET /board`: flex-wrap, about 320 px tiles, 22 px gap, 3 per row next to the panel.
   - `WaitingPanel` (5 players, total Rs 1,550 at 21:42).
2. Timers tick with `useNow()`. The amount so far uses `frameCharge`, `centuryCharge` or `roomCharge`. Table 4 crosses 30:00 and turns into the red card without a reload.
3. Tapping a tile:
   - free → `/table/:id/start` (P06);
   - running → `/table/:id` (P07);
   - room free → `/room/:id/start`.
   Out-of-order and locked tiles do nothing and say why.
4. `/board/pool` (screen 4): the "Pool tables have no price yet" banner, locked tiles, and the two info cards at the bottom. The same pattern applies to `/board/foosball`, `/board/carrom`, `/board/ludo` and `/board/playstation` while their prices are null.
5. `/dev/games-preview` (screen 5): every other game with example prices, and the "For the look only" banner. It is used for the look and for visual tests.
6. Urdu (screen 6): switching language mirrors the layout and uses the word list in `09_URDU_RTL.md`.
7. Live events (`board.changed`, `waiting.changed`) refresh the board without a page reload.

## Done when
- `/` at 21:42 matches screen 3: 9 tiles in the right states, R1 at 1:12:05 Rs 1,800, T3 Century 37:05 Rs 555, T4 red card 34:10, T6 paused, T7 grey, and the waiting list totalling Rs 1,550.
- `/board/pool` matches screen 4, `/dev/games-preview` matches screen 5, and `/?lang=ur` matches screen 6.
- `npm run test:visual` covers screens 3–6.

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).


## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run test:visual` for the screens above. Fix everything until they pass.
2. Start the app and compare each screen above with its PNG at the design size. List any difference you could not fix.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P05 Live board, game tabs, waiting to pay, Urdu board"`.
