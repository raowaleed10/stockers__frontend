# P20-handover · Handover to the backend stage

**Goal:** Leave the frontend ready for the real backend: document exactly what the screens need from the server, tidy the code, and write the README.

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/06_DATA_AND_API.md`, `docs/08_AUTH_AND_ACCESS.md`, `PROGRESS.md`

## Build
1. Write `docs/API_NEEDED.md` from the mock handlers:
   - For every endpoint: method, path, who can call it (worker or owner), request and response types (from `packages/shared/src/types.ts`), errors, the live events it fires, and which screens use it.
   - Note every place where the frontend relies on a server rule: sign-in times, the owner path, `doneBy`, money totals.
2. Make the API base URL configurable (`VITE_API_URL`), and keep MSW behind `VITE_MOCKS=on`, so switching to the real server is one setting.
3. Remove dead code; check that no component uses `fetch` directly or reads the clock directly; run the bundle check.
4. `README.md`: how to run, build and test; the two apps and the private owner address; the demo PINs (dev only); where the docs are.
5. Final `PROGRESS.md`: all screens done, known gaps, and the open questions still waiting for the owners (`docs/11_OPEN_QUESTIONS.md`).

## Done when
- `docs/API_NEEDED.md` covers every call the screens make.
- `VITE_MOCKS=off` makes the app call `VITE_API_URL` (and show friendly errors if it isn't there).
- All checks pass.

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).


## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test`. Fix everything until they pass.
2. Start the app and check that what you built works. List anything you could not finish.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P20 Handover to the backend stage"`.
6. If anything needs my answer, list the questions at the very end of your report (also in PROGRESS.md). I will answer in this same session; then apply the answers, update PROGRESS.md, run the checks and commit again as "P20 answers". The next step starts in a new session only after that.
