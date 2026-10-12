# P07-running-game · While a game is running

**Goal:** Build everything you can do on a running table: the table panel, move or swap a player, stop without the normal charge (discard, dispute, cancel, undo), a damage charge, and pause all for a power cut.

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/02_DECISIONS.md` D10, D14–D19, D52; `docs/07_RULES_FOR_SCREENS.md` §2

## Look at these screens before you write code
Open each PNG (it is the approved design) and read its HTML for exact sizes, colours and copy.
- Screen 11, A game that is running (1440×900, clock 9:42 PM): `design/screens/11-a-game-that-is-running.png` and `design/html/11-a-game-that-is-running.html` → `/table/t1`
- Screen 13, Move to another table, or swap a player (1440×900, clock 9:43 PM): `design/screens/13-move-to-another-table-or-swap-a-player.png` and `design/html/13-move-to-another-table-or-swap-a-player.html` → `/table/t1/move`
- Screen 14, Stop a frame without the normal charge (1440×900, clock 9:50 PM): `design/screens/14-stop-a-frame-without-the-normal-charge.png` and `design/html/14-stop-a-frame-without-the-normal-charge.html` → `/table/t6/stop`
- Screen 15, Damage charge (1440×900, clock 9:45 PM): `design/screens/15-damage-charge.png` and `design/html/15-damage-charge.html` → `/table/t1/damage`
- Screen 16, Power cut (1440×966, clock 10:01 PM, scenario `paused`): `design/screens/16-power-cut.png` and `design/html/16-power-cut.html` → `/?scenario=paused`

## Build
1. `/table/:id` (screen 11):
   - The right `SidePanel` over a faded board.
   - The game title, "Playing since", the session box with the frame number and players, the live timer and the amount.
   - The session score with the earlier frames.
   - "End frame" (brass), plus Pause, Move table, Replace player, Canteen item, Damage charge and Discard frame.
   - The note about the change-type window.
2. `/table/:id/move` (screen 13):
   - Move to a free table: out-of-order tables are disabled, and "same price" or the price difference is shown.
   - Replace a player: who is leaving, who is coming in (search).
   - The note "The timer and session move… A frame keeps the price of the table it started on".
3. `/table/:id/stop` (screen 14):
   - Discard frame, Unpaid dispute, or Cancel started by mistake.
   - Reason chips (required) and a note.
   - The Undo toast ("Undo for 1:42 more") after starting a game by mistake within 2 minutes.
4. `/table/:id/damage` (screen 15):
   - Who pays, what was damaged (Cue, Ball, Cloth, Other), the amount with quick buttons, and a required note.
   - "Add Rs 1,500 to Ali's bill". It appears on his statement and in Activity with "Zain".
5. Pause all (screen 16):
   - The action bar button pauses every running game.
   - The board shows the yellow banner "All games are paused…" with "Resume all games", and each paused tile has its own Resume button (tiles render `as="div"`).
   - Paused time is not charged.
6. Every action shows its result on the board through the mock events, and records `doneBy`.

## Done when
- Each action on Table 1 changes the mock data and the board correctly.
- Pause all, then Resume all: the timers continue without counting the pause.
- Discard needs a reason; the dispute appears in the owner Activity later (P12).
- Screens 11, 13, 14, 15 and 16 match their PNGs.

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).


## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run test:visual` for the screens above. Fix everything until they pass.
2. Start the app and compare each screen above with its PNG at the design size. List any difference you could not fix.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P07 While a game is running"`.
6. If anything needs my answer, list the questions at the very end of your report (also in PROGRESS.md). I will answer in this same session; then apply the answers, update PROGRESS.md, run the checks and commit again as "P07 answers". The next step starts in a new session only after that.
