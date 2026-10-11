# P02-table-tiles · Table tiles: every game, every state

**Goal:** Build the table tiles: each tile is the real object seen from above (snooker table, room with a sofa, pool table, carrom board, foosball table, ludo board, PlayStation TV), with the details on top and the status ring around it.

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/04_DESIGN_SYSTEM.md` §5 and §6, `docs/05_COMPONENTS.md` (`src/tiles`), `design/tiles.reference.css` (the exact CSS from the approved designs)

## Look at these screens before you write code
Open each PNG (it is the approved design) and read its HTML for exact sizes, colours and copy.
- Screen 3, Live board (1440×952, clock 9:42 PM): `design/screens/03-live-board.png` and `design/html/03-live-board.html` → `/`
- Screen 4, Pool tables before a price is set (1440×900, clock 9:44 PM): `design/screens/04-pool-tables-before-a-price-is-set.png` and `design/html/04-pool-tables-before-a-price-is-set.html` → `/board/pool`
- Screen 5, Pool, carrom, foosball, ludo and PlayStation (1440×1901, clock 9:44 PM): `design/screens/05-pool-carrom-foosball-ludo-and-playstation.png` and `design/html/05-pool-carrom-foosball-ludo-and-playstation.html` → `/dev/games-preview`
- Screen 6, Live board in Urdu (1440×1040, clock 9:42 PM): `design/screens/06-live-board-in-urdu.png` and `design/html/06-live-board-in-urdu.html` → `/?lang=ur`
- Screen 16, Power cut (1440×966, clock 10:01 PM, scenario `paused`): `design/screens/16-power-cut.png` and `design/html/16-power-cut.html` → `/?scenario=paused`
- Screen 54, Live tables (390×1265, clock 9:44 PM): `design/screens/54-live-tables.png` and `design/html/54-live-tables.html` → `/owner-dev/live`

## Build
1. In `apps/web/src/tiles`, build:
   - `SnookerTile`, `RoomTile`, `PoolTile`, `CarromTile`, `FoosballTile`, `LudoTile`, `PlayStationTile`;
   - `MiniTable` (the phone glyph on screen 54);
   - `GameTile`, which picks the right tile;
   - `TileContent`, the number, label, pill, game line, players, timer, amount, CTA and note.
2. Rebuild the look from `design/tiles.reference.css`:
   - rails, cloth gradients, cushions, pockets, baulk line and D;
   - racked balls (snooker reds and colours, pool rack), carrom coins;
   - foosball rods, men and handles; the ludo board SVG; the TV bezel and stand.
   Use CSS modules or Tailwind arbitrary values for these drawings, but take the colours from the tokens.
3. Statuses (D7 and Q2) as in `04_DESIGN_SYSTEM.md` §5:
   - ring colours, cloth lit or faded;
   - the **red card timer** when over 30 minutes;
   - the grey striped cover with a note when out of order;
   - locked "Price not set" (disabled, faded).
4. `as="div"` variant for tiles that contain their own buttons (the Resume button on screen 16).
5. Right to left: the content mirrors, the drawing does not (screen 6).
6. `/dev/tiles` gallery: every tile in every state, in English and Urdu, at the sizes used on screens 3 (about 320×200), 5 (carrom square about 300, foosball about 420 wide) and 16 (about 440 wide).

## Done when
- Placed side by side, the tiles on `/dev/tiles` match the tiles on screens 3, 4, 5, 6 and 16.
- Text on the cloth stays readable at the smallest size (the R1 room tile on screen 3).
- Tests: each status renders the right pill text and ring class; the over-30 timer uses the red card; `noPrice` is disabled with the reason as accessible text.

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).


## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run test:visual` for the screens above. Fix everything until they pass.
2. Start the app and compare each screen above with its PNG at the design size. List any difference you could not fix.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P02 Table tiles: every game, every state"`.
