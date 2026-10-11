# Progress

Claude Code updates this file at the end of every step. The developer reads it before starting the next one.

## Steps

| Step | What | Status | Notes |
|---|---|---|---|
| P00 | Install everything and set up the project | ☑ | Done 12 Oct 2026. Follow-up done the same day (new location, audit notes, owner deep links). See the log and the questions below. |
| P01 | Design system and shared UI | ☐ |  |
| P02 | Table tiles | ☐ |  |
| P03 | Data, rules and mock API | ☐ |  |
| P04 | Counter shell, worker sign-in, lock | ☐ |  |
| P05 | Live board | ☐ |  |
| P06 | Start a game | ☐ |  |
| P07 | Running game | ☐ |  |
| P08 | Ending games and rooms | ☐ |  |
| P09 | Checkout | ☐ |  |
| P10 | Canteen, drawer expense, today, close sheet | ☐ |  |
| P11 | Owner shell and sign-in | ☐ |  |
| P12 | Dashboard, reports, activity | ☐ |  |
| P13 | Sheets | ☐ |  |
| P14 | Players | ☐ |  |
| P15 | Prices and games | ☐ |  |
| P16 | Canteen, expenses, workers, settings | ☐ |  |
| P17 | Owner phone | ☐ |  |
| P18 | Urdu everywhere | ☐ |  |
| P19 | Visual check and accessibility | ☐ |  |
| P20 | Handover | ☐ |  |

## Screens

Tick a screen when it matches its PNG at the design size and its visual test passes.

| # | Screen | App | Route | Built | Visual test | Urdu checked |
|---|---|---|---|---|---|---|
| 1 | Worker sign-in | counter | `/sign-in` | ☐ | ☐ | ☐ |
| 2 | Not your time to sign in | counter | `/sign-in?worker=shabir` | ☐ | ☐ | ☐ |
| 3 | Live board | counter | `/` | ☐ | ☐ | ☐ |
| 4 | Pool tables before a price is set | counter | `/board/pool` | ☐ | ☐ | ☐ |
| 5 | Pool, carrom, foosball, ludo and PlayStation | counter | `/dev/games-preview` | ☐ | ☐ | ☐ |
| 6 | Live board in Urdu | counter | `/?lang=ur` | ☐ | ☐ | ☐ |
| 7 | Start a game: choose the type | counter | `/table/t2/start` | ☐ | ☐ | ☐ |
| 8 | Start a game: pick the players | counter | `/table/t2/start/players` | ☐ | ☐ | ☐ |
| 9 | Double frame: pick the two sides | counter | `/table/t2/start/double` | ☐ | ☐ | ☐ |
| 10 | Add a new player | counter | `/players/new?for=t2` | ☐ | ☐ | ☐ |
| 11 | A game that is running | counter | `/table/t1` | ☐ | ☐ | ☐ |
| 12 | Change the game type | counter | `/table/t2/change-type` | ☐ | ☐ | ☐ |
| 13 | Move to another table, or swap a player | counter | `/table/t1/move` | ☐ | ☐ | ☐ |
| 14 | Stop a frame without the normal charge | counter | `/table/t6/stop` | ☐ | ☐ | ☐ |
| 15 | Damage charge | counter | `/table/t1/damage` | ☐ | ☐ | ☐ |
| 16 | Power cut | counter | `/?scenario=paused` | ☐ | ☐ | ☐ |
| 17 | End a frame: who lost? | counter | `/table/t1/end` | ☐ | ☐ | ☐ |
| 18 | Frame charged, next frame | counter | `/table/t1/next` | ☐ | ☐ | ☐ |
| 19 | Over 30 minutes: charge double? | counter | `/table/t4/end/overtime` | ☐ | ☐ | ☐ |
| 20 | End a double frame | counter | `/table/t5/end` | ☐ | ☐ | ☐ |
| 21 | End Century | counter | `/table/t3/end` | ☐ | ☐ | ☐ |
| 22 | Start a room | counter | `/room/r2/start` | ☐ | ☐ | ☐ |
| 23 | End a room | counter | `/room/r1/end` | ☐ | ☐ | ☐ |
| 24 | Checkout: who is paying? | counter | `/checkout` | ☐ | ☐ | ☐ |
| 25 | A player’s bill | counter | `/checkout/bilal` | ☐ | ☐ | ☐ |
| 26 | Part payment | counter | `/checkout/bilal/part` | ☐ | ☐ | ☐ |
| 27 | Give a discount | counter | `/checkout/bilal/discount` | ☐ | ☐ | ☐ |
| 28 | Canteen sale | counter | `/canteen` | ☐ | ☐ | ☐ |
| 29 | Expense from the drawer | counter | `/expense` | ☐ | ☐ | ☐ |
| 30 | Players and their statements | counter | `/players/kamran` | ☐ | ☐ | ☐ |
| 31 | Today’s totals | counter | `/today` | ☐ | ☐ | ☐ |
| 32 | Close the sheet | counter | `/close-sheet` | ☐ | ☐ | ☐ |
| 33 | New sheet opened | counter | `/sheet-closed` | ☐ | ☐ | ☐ |
| 34 | Screen locked | counter | `/?locked=1` | ☐ | ☐ | ☐ |
| 35 | Owner sign-in at the private address | owner | `/owner-dev/sign-in` | ☐ | ☐ | ☐ |
| 36 | Dashboard | owner | `/owner-dev/` | ☐ | ☐ | ☐ |
| 37 | Reports and comparisons | owner | `/owner-dev/reports` | ☐ | ☐ | ☐ |
| 38 | Activity | owner | `/owner-dev/activity` | ☐ | ☐ | ☐ |
| 39 | Sheets: month folders | owner | `/owner-dev/sheets` | ☐ | ☐ | ☐ |
| 40 | Sheets: days in a month | owner | `/owner-dev/sheets/2026-10` | ☐ | ☐ | ☐ |
| 41 | A day’s sheet | owner | `/owner-dev/sheets/s48` | ☐ | ☐ | ☐ |
| 42 | Correct a sheet | owner | `/owner-dev/sheets/s48/edit` | ☐ | ☐ | ☐ |
| 43 | Players and credit | owner | `/owner-dev/players` | ☐ | ☐ | ☐ |
| 44 | A player’s page | owner | `/owner-dev/players/kamran` | ☐ | ☐ | ☐ |
| 45 | Games and prices | owner | `/owner-dev/prices` | ☐ | ☐ | ☐ |
| 46 | Change a price | owner | `/owner-dev/prices/t4` | ☐ | ☐ | ☐ |
| 47 | Add a game or table | owner | `/owner-dev/prices/add` | ☐ | ☐ | ☐ |
| 48 | Canteen and stock | owner | `/owner-dev/canteen` | ☐ | ☐ | ☐ |
| 49 | Expenses | owner | `/owner-dev/expenses` | ☐ | ☐ | ☐ |
| 50 | Workers and sign-in times | owner | `/owner-dev/workers` | ☐ | ☐ | ☐ |
| 51 | Settings | owner | `/owner-dev/settings` | ☐ | ☐ | ☐ |
| 52 | Sign in | owner (phone) | `/owner-dev/sign-in` | ☐ | ☐ | ☐ |
| 53 | Home | owner (phone) | `/owner-dev/` | ☐ | ☐ | ☐ |
| 54 | Live tables | owner (phone) | `/owner-dev/live` | ☐ | ☐ | ☐ |
| 55 | Sheets | owner (phone) | `/owner-dev/sheets/2026-10` | ☐ | ☐ | ☐ |
| 56 | A player’s statement | owner (phone) | `/owner-dev/players/kamran` | ☐ | ☐ | ☐ |
| 57 | Games and prices | owner (phone) | `/owner-dev/prices` | ☐ | ☐ | ☐ |
| 58 | Alerts | owner (phone) | `/owner-dev/alerts` | ☐ | ☐ | ☐ |

## Questions for the developer

(Claude Code adds questions here. The developer answers them before the next step.)

**From P00: answered by the developer on 12 Oct 2026 (done in the P00 follow-up)**

| # | Question | Answer | Result |
|---|---|---|---|
| 1 | Deep links on the owner build | Inject `<base href="/<secret>/">` as well as the app-base tag. Every address under the secret prefix that is not a file in `dist/owner/assets/` gets `owner.html`; files under `/<secret>/assets/` come from `dist/owner/assets/`; every other address is "Page not found". | Rule added to `docs/08_AUTH_AND_ACCESS.md` §1. `scripts/preview-owner.mjs` and `npm run preview:owner` serve `dist/owner` under the fake prefix `/owner-preview-x7/`. The Playwright project `preview` runs `owner-deep-link.preview.spec.ts` (hard reload of `/owner-preview-x7/sheets/2026-10`, its files, the redirect, the 404s). One detail the answer did not cover: a missing file under `/assets/` returns 404, not `owner.html`. This is written into doc 08 so the backend copies it. |
| 4 | `npm audit` warnings (15) | No major upgrades now. Write `docs/AUDIT_NOTES.md`. Decide on upgrades in P20, once the visual tests can catch breakage. | `docs/AUDIT_NOTES.md` lists all 15. Only `react-router-dom` 6 ships, and neither of its two advisories applies today. See "Decisions" below. |
| 5 | Stray `vite.config.js` outside the project | The project moved to `C:\Projects\stockers`. Keep the separate Vitest config for `packages/shared`. | Config kept. The project is no longer under `Downloads`, so Vitest does not reach that file. |
| 7 | Urdu to check | Keep adding to `docs/URDU_TO_CHECK.md`. The whole list goes to the owners after P18. | Kept. No new Urdu strings in the follow-up. |
| 2 | Owner words inside the shared language files (answered 12 Oct 2026, done at the start of P01) | Owner words never go into the counter app. Split the files: `src/locales/{en,ur}/common.json` for words both apps use; `src/counter/locales/{en,ur}/` for counter-only; `src/owner/locales/{en,ur}/` for owner-only, loaded only by the owner entry. `check:bundles` reads every owner text longer than 10 characters and fails if one appears in `dist/counter`. Record it here and in `docs/09_URDU_RTL.md`, and close the question. | Done. Layout and rules are in `docs/09_URDU_RTL.md`. `lib/i18n.ts` loads only `common`; each entry calls `registerResources()` with its own folder. `scripts/check-bundles.mjs` now searches `dist/counter` for every owner text over 10 characters (as written, quote-escaped and `\uXXXX`-escaped). Proof: I leaked three throwaway owner strings (English, English with quotes, Urdu) into the counter, the check failed and named all three and ignored the short ones, then I removed them and it passed. Vite writes Urdu as raw UTF-8. No owner strings exist yet, so today the check passes with "no owner strings yet". |
| – | Extras beyond the P00 list (`.gitattributes`, pinned `@eslint/js` and `@types/node`, `globals`) | Fine. | Listed under "What P00 left in place". |
| – | New location | Run `npm install` and every check again from `C:\Projects\stockers`. | Done. The two links in `node_modules/@stockers` still pointed at the old folder; `npm install` relinked them. `package-lock.json` did not change. |

**From P00: still open**

None. Question 2 was answered and closed at the start of P01 (see the table above and "Decisions").

**From P00: for information (no answer needed)**

3. **Demo clock is on unless `VITE_DEMO_CLOCK=off`**, as P00 specifies. Production builds must set it to `off` (written in `apps/web/.env.example`). P20 should check this.
6. **Git identity.** At your request the global Git name and email are now `rwaowaleed10` / `raowaleed.codemachine@gmail.com` (they were `XtreemeTech`). This affects every repository on this PC.

## Decisions

- **12 Oct 2026, npm audit:** no major upgrades before P20. We decide on them then, with the visual tests in place. Read `docs/AUDIT_NOTES.md` first; it also has the rules that keep the two React Router advisories from applying (no outside text into `<Link to>` or `navigate()`; stay on the plain `BrowserRouter`).
- **12 Oct 2026, owner words never go into the counter app:** language files are split into `common` (both apps), counter-only and owner-only, and only the owner entry loads the owner files. `npm run check:bundles` fails the build check if any owner text over 10 characters is found in `dist/counter`. A word both apps need goes in `common`. Rules in `docs/09_URDU_RTL.md`. Question 2 from P00 is closed.
- **12 Oct 2026, owner deep links:** the server injects `<base href>` and the app-base tag for every address under the secret prefix. The rule is in `docs/08_AUTH_AND_ACCESS.md` §1 and the backend copies it.

## Carried to P20

- Decide the upgrades listed in `docs/AUDIT_NOTES.md` and re-run `npm audit`.
- Production builds must set `VITE_DEMO_CLOCK=off` (see question 3).
- Leave `mockServiceWorker.js` out of production builds.
- Check that the backend serves the owner app as `docs/08_AUTH_AND_ACCESS.md` §1 says; `scripts/preview-owner.mjs` is the working example.

## Differences from the designs that could not be fixed

(Screen number, what is different, why.)

## What P00 left in place (read before P01)

- **Routes to open (`npm run dev`):** counter `http://localhost:5173/` (placeholder "Stockers", dark `--c-page`), owner `http://localhost:5173/owner-dev/` (placeholder "Stockers", light `--o-page`, dev only). Any other address shows "Page not found" in both apps. `?lang=ur` flips to Urdu, `?now=...` moves the demo clock.
- **Build output:** `npm run build` runs two separate builds into `apps/web/dist/counter` (base `/`) and `apps/web/dist/owner` (base `./`). Pages are `counter.html` and `owner.html`. `npm run check:bundles` passes (58 files, no owner code in the counter).
- **Wired, with no screens yet:** React Router, TanStack Query (`src/lib/query-client.ts`), Zustand (language store), react-i18next (`en`/`ur`, `useLanguage()`; words are split by app since P01, see `docs/09_URDU_RTL.md`), Tailwind 3 with the design preset and tokens, bundled fonts (Barlow, Barlow Condensed, Noto Nastaliq Urdu), the clock (`src/lib/clock.ts`: `clock.now()`, `useNow()`), MSW (one health handler per API: `counter-handlers.ts`, `owner-handlers.ts`; real handlers are P03).
- **Lint rules that now protect the golden rules:** counter and owner cannot import each other, and `ui`/`tiles`/`lib` cannot import either app; `Date.now()` and `new Date()` with no argument are errors in `counter`, `owner` and `ui` (tests exempt). Both were proved with throwaway snippets.
- **Mocks switch:** on in dev unless `VITE_MOCKS=off`; in a build only when `VITE_MOCKS=on` (otherwise MSW is not in the bundle). `.env.development` exists locally but Git ignores it (the required `.gitignore` ignores `.env.*`), so the code defaults to mocks on in dev. `apps/web/.env.example` documents both switches.
- **Small additions beyond the P00 list (approved by the developer on 12 Oct 2026):** `.gitattributes` (`* text=auto eol=lf`, so Windows line endings do not break Prettier), pins `@eslint/js@^9` (latest is 10, which needs ESLint 10) and `@types/node@^20`, the `globals` package for ESLint, `docs/URDU_TO_CHECK.md`, React Router v7 future flags in `src/lib/router-future.ts` (silences upgrade warnings), and `packages/shared/vitest.config.ts` (kept on purpose, as the developer asked).
- **Owner preview server (added in the follow-up):** `npm run build:owner -w apps/web`, then `npm run preview:owner` serves `dist/owner` at `http://localhost:4173/owner-preview-x7/` (fake address) the way the real server will: `<base href>` and the app-base tag injected for every address under the prefix, `/assets/` from `dist/owner/assets/` (a missing file is a 404), everything else "Page not found". `npm run test:e2e` builds the owner bundle and starts this server itself (Playwright project `preview`). The deep-link test checks today's "Page not found" heading on `/sheets/2026-10`; P13 swaps it for the real Sheets heading.
- **Heads-up for later screens:** because of `<base href>`, a plain `href="#x"` points at the base address, not the current page. Use router links and buttons.
- **Not done / for later steps:** no screens, no focus ring or button styles (P01 defines them), no real mock data or handlers (P03), no visual tests (P05; `test:visual` passes with no tests until then). Playwright runs the `phone` project against the owner app only, and the `preview` project against the built owner bundle. MSW's `mockServiceWorker.js` is copied from `public/` into both `dist` folders even when mocks are off (inert, 9.6 KB); P20 can leave it out of production builds.
- **Machine:** Windows 10, Node 24.13, npm 11.6, Git 2.52 (all above the minimums). The project lives at `C:\Projects\stockers` (no space in the path; it was moved there on 12 Oct 2026).

## Log

| Date | Step | What was done | Tests |
|---|---|---|---|
| 2026-10-12 | P00 | Checked the computer (nothing to install), set Git identity, `git init`, committed the kit. Created the npm workspace: `packages/shared` (types from docs/06) and `apps/web` (counter and owner entries, Vite 5 dev plugin for `/owner-dev/`, two-build script, Tailwind preset and tokens, fonts, i18n, clock, router, query, Zustand, MSW, ErrorBoundary, Page not found), ESLint + Prettier with the import and clock rules, `scripts/check-bundles.mjs`, Vitest and Playwright (counter, owner, phone), README. | Vitest: 16 in web (clock, language, both route sets, app-base), 3 in shared. Playwright: 10 smoke tests across the 3 projects, all passing. typecheck, lint, build and check:bundles pass from a clean `npm install`. |
| 2026-10-12 | P00 follow-up | The project moved to `C:\Projects\stockers`: ran `npm install` (the two workspace links still pointed at the old folder and were relinked; the lock file did not change) and every check again. Wrote `docs/AUDIT_NOTES.md` (15 warnings, only `react-router-dom` 6 ships, no upgrades before P20). Added the owner deep-link rule to `docs/08_AUTH_AND_ACCESS.md` §1, `scripts/preview-owner.mjs`, `npm run preview:owner`, and the Playwright project `preview` with `owner-deep-link.preview.spec.ts`. Noted the approved extras. No new Urdu strings. Did not start P01. | Vitest: 16 in web, 3 in shared. Playwright: 18 passing (10 smoke + 8 deep-link). typecheck, lint, build and check:bundles pass. `test:visual` passes with no tests. I removed the `<base>` tag on purpose and the deep-link tests failed, then I put it back. |
