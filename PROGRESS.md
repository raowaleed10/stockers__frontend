# Progress

Claude Code updates this file at the end of every step. The developer reads it before starting the next one.

## Steps

| Step | What | Status | Notes |
|---|---|---|---|
| P00 | Install everything and set up the project | ☑ | Done 12 Oct 2026. See the log and the questions below. |
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

**From P00**

1. **Deep links on the owner build (for P11 / P20 / the backend).** The owner bundle is built with `base: './'`, so its page loads `./assets/...`. On a hard reload at a deep link such as `/<secret>/sheets/2026-10` the browser looks for `/<secret>/sheets/assets/...` and finds nothing. The server that injects `<meta name="app-base">` should also inject `<base href="/<secret>/">` (or rewrite the asset paths). Not needed in dev, where assets are absolute. Please confirm which way to go.
2. **Owner words inside the shared language files.** `src/locales/en.json` and `ur.json` are shared by both bundles. When owner screens arrive, their words should live in a namespace that only the owner entry loads, or the counter bundle will carry them. Today only `common` exists (brand, "Page not found", crash message).
3. **Demo clock is on unless `VITE_DEMO_CLOCK=off`**, as P00 specifies. Production builds must set it to `off` (written in `apps/web/.env.example`). P20 should check this.
4. **Security warnings from `npm audit` (15, none fixable without a major upgrade).** They sit in the tools we were told to keep: Vite 5, Vitest 2 (`tinypool`, critical) and Tailwind 3 (`braces`, `micromatch`, `chokidar`) are build and test tools that do not ship to the club. Two moderate ones are in `react-router-dom` 6, which does ship; the fix is React Router 7. I did not upgrade any major. Do you want a separate upgrade step later?
5. **A stray file outside the project.** `C:\Users\Ali Raza\Downloads\vite.config.js` (it needs `@react-router/dev`) belongs to some other project. Vitest walked up the folders and loaded it, which broke `packages/shared` until I gave that package its own `vitest.config.ts`. It is safe to move or delete that file; I did not touch it.
6. **Git identity.** At your request the global Git name and email are now `rwaowaleed10` / `raowaleed.codemachine@gmail.com` (they were `XtreemeTech`). This affects every repository on this PC.
7. **Urdu to check.** Three new Urdu strings are in `docs/URDU_TO_CHECK.md` (Page not found, and the crash message with its button).

## Differences from the designs that could not be fixed

(Screen number, what is different, why.)

## What P00 left in place (read before P01)

- **Routes to open (`npm run dev`):** counter `http://localhost:5173/` (placeholder "Stockers", dark `--c-page`), owner `http://localhost:5173/owner-dev/` (placeholder "Stockers", light `--o-page`, dev only). Any other address shows "Page not found" in both apps. `?lang=ur` flips to Urdu, `?now=...` moves the demo clock.
- **Build output:** `npm run build` runs two separate builds into `apps/web/dist/counter` (base `/`) and `apps/web/dist/owner` (base `./`). Pages are `counter.html` and `owner.html`. `npm run check:bundles` passes (58 files, no owner code in the counter).
- **Wired, with no screens yet:** React Router, TanStack Query (`src/lib/query-client.ts`), Zustand (language store), react-i18next (`en`/`ur`, `useLanguage()`), Tailwind 3 with the design preset and tokens, bundled fonts (Barlow, Barlow Condensed, Noto Nastaliq Urdu), the clock (`src/lib/clock.ts`: `clock.now()`, `useNow()`), MSW (one health handler per API: `counter-handlers.ts`, `owner-handlers.ts`; real handlers are P03).
- **Lint rules that now protect the golden rules:** counter and owner cannot import each other, and `ui`/`tiles`/`lib` cannot import either app; `Date.now()` and `new Date()` with no argument are errors in `counter`, `owner` and `ui` (tests exempt). Both were proved with throwaway snippets.
- **Mocks switch:** on in dev unless `VITE_MOCKS=off`; in a build only when `VITE_MOCKS=on` (otherwise MSW is not in the bundle). `.env.development` exists locally but Git ignores it (the required `.gitignore` ignores `.env.*`), so the code defaults to mocks on in dev. `apps/web/.env.example` documents both switches.
- **Small additions beyond the P00 list:** `.gitattributes` (`* text=auto eol=lf`, so Windows line endings do not break Prettier), pins `@eslint/js@^9` (latest is 10, which needs ESLint 10) and `@types/node@^20`, the `globals` package for ESLint, `docs/URDU_TO_CHECK.md`, React Router v7 future flags in `src/lib/router-future.ts` (silences upgrade warnings), and `packages/shared/vitest.config.ts` (see question 5).
- **Not done / for later steps:** no screens, no focus ring or button styles (P01 defines them), no real mock data or handlers (P03), no visual tests (P05; `test:visual` passes with no tests until then). Playwright runs the `phone` project against the owner app only. MSW's `mockServiceWorker.js` is copied from `public/` into both `dist` folders even when mocks are off (inert, 9.6 KB); P20 can leave it out of production builds.
- **Machine:** Windows 10, Node 24.13, npm 11.6, Git 2.52 (all above the minimums). The project path contains a space; scripts avoid absolute paths.

## Log

| Date | Step | What was done | Tests |
|---|---|---|---|
| 2026-10-12 | P00 | Checked the computer (nothing to install), set Git identity, `git init`, committed the kit. Created the npm workspace: `packages/shared` (types from docs/06) and `apps/web` (counter and owner entries, Vite 5 dev plugin for `/owner-dev/`, two-build script, Tailwind preset and tokens, fonts, i18n, clock, router, query, Zustand, MSW, ErrorBoundary, Page not found), ESLint + Prettier with the import and clock rules, `scripts/check-bundles.mjs`, Vitest and Playwright (counter, owner, phone), README. | Vitest: 16 in web (clock, language, both route sets, app-base), 3 in shared. Playwright: 10 smoke tests across the 3 projects, all passing. typecheck, lint, build and check:bundles pass from a clean `npm install`. |
