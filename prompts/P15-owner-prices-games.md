# P15-owner-prices-games · Games and prices

**Goal:** Build the price cards, changing a price from now on, and adding a game or table with the next number.

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/02_DECISIONS.md` D3–D6, D13, Q3, Q4

## Look at these screens before you write code
Open each PNG (it is the approved design) and read its HTML for exact sizes, colours and copy.
- Screen 45, Games and prices (1440×1420, clock 10:30 PM): `design/screens/45-games-and-prices.png` and `design/html/45-games-and-prices.html` → `/owner-dev/prices`
- Screen 46, Change a price (1440×942, clock 10:30 PM): `design/screens/46-change-a-price.png` and `design/html/46-change-a-price.html` → `/owner-dev/prices/t4`
- Screen 47, Add a game or table (1440×900, clock 10:30 PM): `design/screens/47-add-a-game-or-table.png` and `design/html/47-add-a-game-or-table.html` → `/owner-dev/prices/add`
- Screen 57, Games and prices (390×1356, clock 10:30 PM): `design/screens/57-games-and-prices.png` and `design/html/57-games-and-prices.html` → `/owner-dev/prices`

## Build
1. `/prices` (screen 45):
   - Snooker table cards (number ball, single and double price, Change price); the Century rate card.
   - Rooms; "Waiting for a price" (pool, foosball, carrom, ludo, PlayStation) with Set price.
   - Price history; Add a game or table.
2. `/prices/:tableId` (screen 46):
   - The cards with the selected table outlined; the price history.
   - `OwnerAside`: now → new price; "Double frame becomes"; **"Starts the moment you save"** (no later option, D5).
   - "Same change for other Rs 200 tables?" checkboxes.
   - The note that running games keep their old price.
3. `/prices/add` (screen 47):
   - Numbered steps: what you are adding (snooker table → "It will be Table 8", room, pool table, new kind of game); name and number; price.
   - The live preview using the real `SnookerTile` (or the right tile).
4. Setting a pool price unlocks the pool tiles on the counter board immediately (`price.changed` event).
5. Phone (screen 57): grouped price rows.

## Done when
- Changing Table 4 to 250 shows on the counter at once. A running frame keeps 200.
- Adding Table 8 puts a free Table 8 after Table 7 on the board.
- Screens 45–47 and 57 match their PNGs.

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).


## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run test:visual` for the screens above. Fix everything until they pass.
2. Start the app and compare each screen above with its PNG at the design size. List any difference you could not fix.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P15 Games and prices"`.
