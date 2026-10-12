# P06-start-game · Starting a game

**Goal:** Build the flows to start a game on a free table: choose the type, pick players, double-frame sides, add a new player, and change the game type within 5 minutes.

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/07_RULES_FOR_SCREENS.md` §2, `docs/02_DECISIONS.md` D8–D11, D17, D20, D21, Q18

## Look at these screens before you write code
Open each PNG (it is the approved design) and read its HTML for exact sizes, colours and copy.
- Screen 7, Start a game: choose the type (1440×900, clock 9:46 PM): `design/screens/07-start-a-game-choose-the-type.png` and `design/html/07-start-a-game-choose-the-type.html` → `/table/t2/start`
- Screen 8, Start a game: pick the players (1440×900, clock 9:46 PM): `design/screens/08-start-a-game-pick-the-players.png` and `design/html/08-start-a-game-pick-the-players.html` → `/table/t2/start/players`
- Screen 9, Double frame: pick the two sides (1440×900, clock 9:47 PM): `design/screens/09-double-frame-pick-the-two-sides.png` and `design/html/09-double-frame-pick-the-two-sides.html` → `/table/t2/start/double`
- Screen 10, Add a new player (1440×900, clock 9:47 PM): `design/screens/10-add-a-new-player.png` and `design/html/10-add-a-new-player.html` → `/players/new?for=t2`
- Screen 12, Change the game type (1440×900, clock 9:53 PM): `design/screens/12-change-the-game-type.png` and `design/html/12-change-the-game-type.html` → `/table/t2/change-type`

## Build
1. `/table/:id/start` (screen 7): `CounterDialog` with single frame, double frame and Century option cards showing this table's prices. The Century rate stepper starts at the owners' price. "Mark out of order" (asks for a note). Next goes to players.
2. `/table/:id/start/players` (screen 8):
   - Two player slots with search by name or phone (always shown together, D21).
   - "Played here recently" chips.
   - Tags such as "Playing on Table 1" or "Owes Rs 1,200", shown as plain information, never a warning.
   - Start the game → back to the board, with the tile now playing.
3. `/table/:id/start/double` (screen 9): side A and side B with one or two players each, and the note "Three players count as a double…".
4. `/players/new` (screen 10):
   - Full name (required); phone optional with "Skip phone for now".
   - A similar-names list to prevent duplicates.
   - The on-screen phone keypad.
   - It returns to the flow it came from with the new player picked.
5. `/table/:id/change-type` (screen 12): available only in the first 5 minutes (`canChangeType`). It shows the "Now" badge and the countdown "2 minutes left…". After the window it is not offered (the table panel says so, screen 11).
6. Century under one player: picking one player is enough. Rooms are not started here (P08).

## Done when
- From screen 3, tap Table 2 → Single frame → Ahmed Nawaz and Ali Akbar → Start. The board shows Table 2 playing from 0:00, under Zain.
- A double with 3 players works.
- A new player with no phone can be added in the middle of the flow.
- Change type works at 3 minutes and is hidden at 6.
- Screens 7, 8, 9, 10 and 12 match their PNGs.

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).


## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run test:visual` for the screens above. Fix everything until they pass.
2. Start the app and compare each screen above with its PNG at the design size. List any difference you could not fix.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P06 Starting a game"`.
6. If anything needs my answer, list the questions at the very end of your report (also in PROGRESS.md). I will answer in this same session; then apply the answers, update PROGRESS.md, run the checks and commit again as "P06 answers". The next step starts in a new session only after that.
