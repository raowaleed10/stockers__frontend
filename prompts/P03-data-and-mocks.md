# P03-data-and-mocks · Shared rules, API client and mock server

**Goal:** Make the app run on realistic data: the money and time rules as tested pure functions, a typed API client with TanStack Query hooks, and an MSW mock server that serves `mock/seed.json` and changes it when you use the app.

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/06_DATA_AND_API.md`, `docs/07_RULES_FOR_SCREENS.md`, `docs/08_AUTH_AND_ACCESS.md` §3–4, `mock/seed.json`

## Build
1. `packages/shared/src/rules`: `charges.ts`, `checkout.ts`, `credit.ts`, `drawer.ts`, `slots.ts` and `sheet.ts`, exactly as in `07_RULES_FOR_SCREENS.md`. Every worked example in that doc becomes a unit test:
   - 42 min 35 s at Rs 15 = 630; room 1 h 40 min at 1,500 = 2,500; Bilal's checkout; drawer 22,250 − 500 = 21,750;
   - the slot cases, including the ones that cross midnight.
2. `apps/web/src/counter/api` and `src/owner/api`: typed functions for every call in `06_DATA_AND_API.md` §2–3, plus TanStack Query hooks using the keys in §5. Errors return `{code, message}`; `NOT_YOUR_TIME` carries `{slot, now}`.
3. `apps/web/src/mocks`: MSW handlers that load `mock/seed.json` into an in-memory store.
   - **Counter handlers:** sign-in with demo PINs (Shabir 1111, Zain 2222) and the sign-in time check against the demo clock; the board; start, pause, resume, end, move, replace, discard, dispute, undo and damage; checkout; canteen; drawer expense; today; close sheet.
   - **Owner handlers:** sign-in (any password in dev), dashboard and reports from `aggregates`, activity, sheets, players, prices, canteen, expenses, workers, settings and notifications.
   - Every write records `doneBy` from the mock session, and adds an activity event where `02_DECISIONS.md` D52 says so.
   - A mock event bus that fires the events in §4; hooks invalidate their queries when they arrive.
   - `?scenario=<name>` switches to one of the `scenarios` in the seed (`paused`, `checkout`, `closing`, `closed`, `empty`); see `06_DATA_AND_API.md` §6. `?now=` sets the demo clock.
4. Owner endpoints answer 404 to a counter session; counter endpoints answer 401 without a worker session.

## Done when
- `npm test` covers every rule example in `07_RULES_FOR_SCREENS.md`, and they all pass.
- A small dev page `/dev/data` (both apps) lists the board and the workers from the mock API; starting a game there changes the board.
- Signing in as Shabir at the demo time (21:42) returns `NOT_YOUR_TIME`; Zain works.

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).


## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test`. Fix everything until they pass.
2. Start the app and check that what you built works. List anything you could not finish.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P03 Shared rules, API client and mock server"`.
6. If anything needs my answer, list the questions at the very end of your report (also in PROGRESS.md). I will answer in this same session; then apply the answers, update PROGRESS.md, run the checks and commit again as "P03 answers". The next step starts in a new session only after that.
