# P04-counter-shell-and-signin · Counter frame, worker sign-in, lock

**Goal:** Build the counter app frame and everything around signing in: the worker sign-in with sign-in times, "Not your time to sign in", the worker chip, the end-of-time warning and sign-out, and the lock screen.

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/08_AUTH_AND_ACCESS.md` §1 and §3, `docs/07_RULES_FOR_SCREENS.md` §6, `docs/04_DESIGN_SYSTEM.md` §7 (top bar, action bar)

## Look at these screens before you write code
Open each PNG (it is the approved design) and read its HTML for exact sizes, colours and copy.
- Screen 1, Worker sign-in (1440×900, clock 9:42 PM): `design/screens/01-worker-sign-in.png` and `design/html/01-worker-sign-in.html` → `/sign-in`
- Screen 2, Not your time to sign in (1440×900, clock 9:42 PM): `design/screens/02-not-your-time-to-sign-in.png` and `design/html/02-not-your-time-to-sign-in.html` → `/sign-in?worker=shabir`
- Screen 3, Live board (1440×952, clock 9:42 PM): `design/screens/03-live-board.png` and `design/html/03-live-board.html` → `/`
- Screen 34, Screen locked (1440×900, clock 9:42 PM): `design/screens/34-screen-locked.png` and `design/html/34-screen-locked.html` → `/?locked=1`

## Build
1. `/sign-in` (screen 1):
   - Green clock panel on the start side.
   - "Who is working?" with worker cards from `GET /workers/public`: name, sign-in time, "Your time now" or "Not now".
   - Keypad and PIN dots; the language switch.
   - Exactly the copy of the screen. **No owner option anywhere.**
2. Not your time (screen 2): when the server answers `NOT_YOUR_TIME`, show the red alert with the worker's time and the current time, and an OK button that clears the selection. Also handle wrong PIN and too many tries (`08_AUTH_AND_ACCESS.md` §3).
3. App frame for signed-in routes:
   - `CounterTopBar` (screen 3 top), including the `WorkerChip` ("Zain, Until 11:00 PM"); tapping it offers "Switch worker".
   - `CounterActionBar` (screen 3 bottom), with Checkout, Canteen, Players, Today's totals, **Expense**, Pause all, the backup time and Close sheet. For now the buttons go to placeholder routes.
4. End of time:
   - 10 minutes before the slot ends, show a banner across the top: "Your sign-in time ends at 11:00 PM. Finish what you are doing."
   - At the end, sign out to `/sign-in`. Running games are untouched.
   - Use `slots.ts` with the clock.
5. Lock (screen 34):
   - After 5 minutes without a touch, show the lock overlay: big clock, table summary pills with the same status colours, "Zain, enter your PIN", keypad, and "Switch worker".
   - The pill colours are red for playing, a red card for over 30, green for free, and grey for out of order.
   - Unlock calls `/auth/unlock`.
6. Route guard: every counter route except `/sign-in` needs a worker session.

## Done when
- Zain (2222) signs in at 21:42 and lands on `/` (still a placeholder board).
- Shabir (1111) at 21:42 gets screen 2.
- With `?now=2026-10-03T22:51:00%2B05:00` the warning banner shows; at 23:00 the app returns to sign-in.
- After 5 minutes idle (use a shorter time in tests) the lock shows; the right PIN unlocks it.
- Screens 1, 2 and 34 match their PNGs.

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).


## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run test:visual` for the screens above. Fix everything until they pass.
2. Start the app and compare each screen above with its PNG at the design size. List any difference you could not fix.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P04 Counter frame, worker sign-in, lock"`.
