# Progress

Claude Code updates this file at the end of every step. The developer reads it before starting the next one.

## Steps

| Step | What | Status | Notes |
|---|---|---|---|
| P00 | Install everything and set up the project | ☑ | Done 12 Oct 2026. Follow-up done the same day (new location, audit notes, owner deep links). See the log and the questions below. |
| P01 | Design system and shared UI | ☑ | Done 12 Oct 2026, after the language-file split (see Decisions). 26 components in `src/ui`, `format.ts` and `time.ts` in shared, and `/dev/kit` in both apps. Open questions and differences are below. |
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

**From P01: answered by the developer on 12 Oct 2026 (done in "P01 answers")**

| # | Question | Answer | Result |
|---|---|---|---|
| 1 | Touch size against the screens (language switch drawn 44, chips 48 on the PNGs, rule says 56) | Keep the drawn size from the PNGs, but make the pressable area at least 56 px: the button's own box is 56 px and the visible shape is drawn inside it at the PNG size, without moving anything else (negative margins). Do the same for every counter control a PNG draws under 56 px. The touch-size test measures the button's box. | New counter-only prop `drawn` (`44 \| 48 \| 50 \| 52 \| 54`) on `Button`, `IconButton`, `Chip` and `Segmented`; `LanguageSwitch` always uses it (`src/ui/touch-box.ts`). I searched screens 1–34 and found more than the two I had flagged: the bell (52), Lock and worker chip (52), "Change" (52 and 48), remove ✕ and the steppers (48, 52), the split choices (52, 54), "Check out first" (52), and the Resume button on screen 16 (50, comes with P02). They are listed with their screens in `docs/04` §4. The kit shows 44, 48, 52 and 54. **One difference from my plan:** `drawn` is something a screen asks for, not a default for every `Chip` or `Segmented`, because other screens draw those at 56 or more. |
| 2 | Light status pill (owner phone) | Follow screen 54 everywhere in the owner portal: tinted fill, no border (Playing `#B42318` on `#FBE7E5`, Free on `#E3F0E8`, Paused on `#FBF1DC`, Out of order on `#EEF0F2`). Darken only the green, yellow and grey text until each reaches 4.5:1 on its own fill, and add a test. | `StatusPill tone="light"` is now the words on a tint, 13 px bold, padding `2px 8px`. **Screen 54 draws no dot, so the light pill has none** (the words still carry the status). New tokens: `--o-grey-tint` `#EEF0F2` and the three inks `--sl-free-ink` `#147B42` (4.54:1), `--sl-pause-ink` `#966319` (4.57:1), `--sl-ooo-ink` `#666D7A` (4.56:1), each the same hue as before, darkened by 0.5 % lightness steps until it passed. The plain colours were 3.75, 3.24 and 4.23. Red passes as it is (5.53:1). `StatusPill.contrast.test.tsx` reads `tokens.css`, resolves the classes the pill really renders, and checks all six statuses; I put the old light green back and the test failed with the ratio, then restored it. |

**From P01: still open**

| # | Question | What I did meanwhile |
|---|---|---|
| 3 | **Urdu words.** Ten new common Urdu words (Close, Clear, Delete last digit, Price not set, the statement columns and others). | Listed in `docs/URDU_TO_CHECK.md` for the owners. |

**From P01: for information (no answer needed)**

- **Design against doc, answered by you:** the normal dialog border is 1 px `#4A3B2E`, the warning dialog 2 px `#A8403A`, and a selected option card 3 px brass on `#33271C`. `docs/04` §4 and §7 are corrected.
- **Same kind of disagreement, resolved the same way:** the amount keypad (screen 26) has 72 px keys, the PIN keypad (screen 1) has 76 px. `docs/04` said 76 for both.
- **I added to `packages/shared`:** `TableStatus` (type), `formatAmount`, `formatDate` (`3 Oct`), `elapsed` and `isOver30` (`rules/time.ts`, the names from `docs/07` §2). P03 should extend these, not write them again. `formatClock` and `formatDay` read the club's UTC+5 offset, so they give the same text on every computer (tested in two other time zones). The Urdu clock words and month names are left for P18, because `docs/09` does not give the hour limits for صبح، دوپہر، شام، رات.
- **`Button` size `'owner-sm'` is now `'ownerSm'`.** The text `owner-` in a shared component would be in the counter bundle, and `check:bundles` forbids it. `docs/05` is updated.
- **New colours:** the screens use about 55 colours that were not tokens. Only the ones the P01 components needed were added, to `tokens.css` and the preset (list under "What P01 left in place"). Nothing existing changed. `.prettierignore` still treats both files as copies of `design/`; they now have P01 additions at the end.
- **Fonts:** only the Arabic-script part of Noto Nastaliq Urdu is bundled now. Before, Latin letters and digits inside Urdu text used the Nastaliq font's own (serif) Latin, which looked wrong. They fall back to Barlow.
- **The one thing in `base.css` I did not change:** my plan said to switch the Urdu rule to `:lang(ur)`. That would have lost to the body's `font-body` class on specificity, so the Urdu rule stays on `html[lang='ur'] body`, and the kit's Urdu column sets its own font class.
- **Kit route in the owner app is `/owner-dev/dev/kit`** (the dev base path plus `/dev/kit`).

**From P00: for information (no answer needed)**

3. **Demo clock is on unless `VITE_DEMO_CLOCK=off`**, as P00 specifies. Production builds must set it to `off` (written in `apps/web/.env.example`). P20 should check this.
6. **Git identity.** At your request the global Git name and email are now `rwaowaleed10` / `raowaleed.codemachine@gmail.com` (they were `XtreemeTech`). This affects every repository on this PC.

## Decisions

- **12 Oct 2026, npm audit:** no major upgrades before P20. We decide on them then, with the visual tests in place. Read `docs/AUDIT_NOTES.md` first; it also has the rules that keep the two React Router advisories from applying (no outside text into `<Link to>` or `navigate()`; stay on the plain `BrowserRouter`).
- **12 Oct 2026, owner words never go into the counter app:** language files are split into `common` (both apps), counter-only and owner-only, and only the owner entry loads the owner files. `npm run check:bundles` fails the build check if any owner text over 10 characters is found in `dist/counter`. A word both apps need goes in `common`. Rules in `docs/09_URDU_RTL.md`. Question 2 from P00 is closed.
- **12 Oct 2026, touch size:** a counter control keeps the size its PNG draws, and its pressable box is still 56 px (`drawn`, `docs/04` §4). Every new counter control that a PNG draws under 56 px must use it; the touch-size tests measure the box, and a second check proves the layout did not move.
- **12 Oct 2026, light status pill:** the owner portal follows screen 54 (tinted fill, no border, no dot), with darker text for green, yellow and grey so each is at least 4.5:1 (`docs/04` §5).
- **12 Oct 2026, owner deep links:** the server injects `<base href>` and the app-base tag for every address under the secret prefix. The rule is in `docs/08_AUTH_AND_ACCESS.md` §1 and the backend copies it.

## Carried to P20

- Check that the production counter and owner bundles contain no `/dev/kit` page or kit words (`check:bundles` does this; keep it in the release steps).
- Decide the upgrades listed in `docs/AUDIT_NOTES.md` and re-run `npm audit`.
- Production builds must set `VITE_DEMO_CLOCK=off` (see question 3).
- Leave `mockServiceWorker.js` out of production builds.
- Check that the backend serves the owner app as `docs/08_AUTH_AND_ACCESS.md` §1 says; `scripts/preview-owner.mjs` is the working example.

## Differences from the designs that could not be fixed

(Screen number, what is different, why.) `test:visual` has no routes to compare until P05, so these come from comparing `/dev/kit` crops with the PNGs by eye at the design size (kit opened at 2400 px so the dialogs reach their real width).

| Screen | Difference | Why |
|---|---|---|
| 7 | The "Century rate" row in the kit is a labelled number box, not the − / Rs 15 a minute / + control of the PNG | That control belongs to the Start a game screen (P06); the kit shows the building blocks |
| 7 | "Mark out of order" uses the standard outline button (`#6B5640` border, ivory text); the PNG has `#5A4A3C` and `#CDBFAE` | One outline button for screens 3, 7 and 25 |
| 7, 19 | The dimmed page behind a dialog is one 92 % dark layer, not a separately dimmed header | A real dialog sits over a live page; the header cannot be dimmed on its own |
| 43 | Stat card numbers are 40 px, the PNG has 42 px (49 has 40) | One `md` size, `text-o-stat` from the preset |
| 36, 43, 53 | Urdu amounts show `1,350 روپے` with the number in Barlow Condensed and the word in Nastaliq; these screens have no approved Urdu PNG except screen 6 | Per `docs/09` |
| – | Toast and the counter `danger` button have no approved screen | Toast follows the Undo button of screen 18; `danger` follows the red option of screen 19 |

Urdu, checked in the kit: nothing is clipped, dates and times keep their order (`<bdi dir="ltr">`), the keypad keeps 1-2-3 from the left, amounts keep Western digits. Digits inside running Urdu text are Barlow, not Barlow Condensed; P18 decides if that needs changing.

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

## What P01 left in place (read before P02)

- **Routes to open (`npm run dev`):** counter `http://localhost:5173/dev/kit`, owner `http://localhost:5173/owner-dev/dev/kit`. Add `?lang=ur` to put the whole page in Urdu (the kit always shows English and Urdu side by side), and open at 1440 px, at 390 px, and at 2400 px to see the dialogs at their real width. Both routes exist only in development.
- **`src/ui` (all with tests or covered by the kit checks):** `Button`, `IconButton`, `StatusPill`, `Chip`, `Card`, `StatCard`, `CounterDialog`, `SidePanel`, `OwnerAside`, `OptionCard`, `PersonCard`, `Keypad`, `PinDots`, `MoneyText`, `TimerText`, `Toggle`, `Segmented`, `LanguageSwitch`, `Field` with `TextInput`, `MoneyInput`, `TextArea` and `Select`, `DataTable`, `StatementTable`, `EmptyState`, `Toast`. Helpers: `cx`, `theme` (focus rings), `useDialog`, `useMediaQuery`.
- **Not in P01 (still to build):** `WorkerChip`, `CounterTopBar`, `CounterActionBar`, `CategoryTabs`, `OwnerSidebar`, `PhoneTopBar`, `PhoneTabBar`, the charts and the sign-in timeline.
- **`packages/shared`:** `rules/format.ts` (`formatRs`, `formatAmount`, `formatSigned`, `formatTimer`, `formatClock`, `formatDate`, `formatDay`, `formatSlot`, `phoneTail`) and `rules/time.ts` (`elapsed`, `isOver30`), 29 tests.
- **Tokens added** (`tokens.css` and the preset; screen in brackets): `--c-brass-press`, `--c-selected` (7, 25, 26), `--c-scrim` (7, 19), `--c-warn-*` (25, 26), `--c-danger-*` (19), `--c-info-*` (25), `--c-ok-*` (1, 26), `--o-red-line` (50, 51), `--o-track` (50, 51), `--o-stripe` (49), `--o-divider` (43, 49), `--o-on-green` (36), `--shadow-dot` (3), `--shadow-redcard` (3), `--shadow-thumb` (50, 51); preset `height` and `width` from the touch tokens, and `s.card-edge` and `s.pill-bg`. After the P01 answers: `--o-grey-tint` (54) and the three status inks `--sl-free-ink`, `--sl-pause-ink`, `--sl-ooo-ink` (also in the preset).
- **Tests:** Vitest, 109 in web (Button, IconButton, Keypad, PinDots, StatusPill, MoneyText in English and Urdu, TimerText on the demo clock, StatementTable, Toggle, the three dialogs, Chip, Segmented, LanguageSwitch, Field and the inputs) and 29 in shared. Playwright: `tests/e2e/kit-checks.ts`, run by `kit.counter.spec.ts` and `kit.owner.spec.ts` (the owner one also on the phone project): every component present, no console errors, axe with no serious or critical issues (English and `?lang=ur`), counter controls at least 56 px and owner controls at least 44 px, no sideways page scroll at 390 px.
- **How the kit stays out of production:** each app adds the `/dev/kit` route only when `import.meta.env.DEV` is true, so a build drops it. `check:bundles` also searches both bundles for every kit word; it found none.
- **Heads-up for P02 (tiles):** use `StatusPill`, `TimerText` (the red card is built there) and the status tokens; `TileProps.status` has one extra value, `selected`, on top of `TableStatus`.
- **Heads-up for every screen:** put counter dialog content inside `CounterDialog` (it sets the lighter button colour for a panel); a table that scrolls sideways is a focusable region, so give `DataTable` a real `caption`.

## Log

| Date | Step | What was done | Tests |
|---|---|---|---|
| 2026-10-12 | P00 | Checked the computer (nothing to install), set Git identity, `git init`, committed the kit. Created the npm workspace: `packages/shared` (types from docs/06) and `apps/web` (counter and owner entries, Vite 5 dev plugin for `/owner-dev/`, two-build script, Tailwind preset and tokens, fonts, i18n, clock, router, query, Zustand, MSW, ErrorBoundary, Page not found), ESLint + Prettier with the import and clock rules, `scripts/check-bundles.mjs`, Vitest and Playwright (counter, owner, phone), README. | Vitest: 16 in web (clock, language, both route sets, app-base), 3 in shared. Playwright: 10 smoke tests across the 3 projects, all passing. typecheck, lint, build and check:bundles pass from a clean `npm install`. |
| 2026-10-12 | P00 follow-up | The project moved to `C:\Projects\stockers`: ran `npm install` (the two workspace links still pointed at the old folder and were relinked; the lock file did not change) and every check again. Wrote `docs/AUDIT_NOTES.md` (15 warnings, only `react-router-dom` 6 ships, no upgrades before P20). Added the owner deep-link rule to `docs/08_AUTH_AND_ACCESS.md` §1, `scripts/preview-owner.mjs`, `npm run preview:owner`, and the Playwright project `preview` with `owner-deep-link.preview.spec.ts`. Noted the approved extras. No new Urdu strings. Did not start P01. | Vitest: 16 in web, 3 in shared. Playwright: 18 passing (10 smoke + 8 deep-link). typecheck, lint, build and check:bundles pass. `test:visual` passes with no tests. I removed the `<base>` tag on purpose and the deep-link tests failed, then I put it back. |
| 2026-10-12 | Language split | Closed P00 question 2. Words are split into `src/locales/{en,ur}/common.json`, `src/counter/locales` and `src/owner/locales`; `lib/i18n.ts` loads only `common` and each entry registers its own folder. `check:bundles` now fails if any owner text over 10 characters is in `dist/counter` (proved with a throwaway English, quoted and Urdu leak, twice). Docs: `docs/09`, `CLAUDE.md` layout, P18 step 1. | Vitest 16 + 3 before P01; typecheck, lint, build, check:bundles pass. Committed on its own. |
| 2026-10-12 | P01 | Built the 26 `src/ui` components, `format.ts` and `time.ts` in shared, the dev-only `/dev/kit` page in both apps (both looks, English and Urdu side by side), new tokens, `useDialog`, and Arabic-only Urdu font. Corrected `docs/04`, `docs/05`, `docs/09`; added Urdu words to `docs/URDU_TO_CHECK.md`. Fixed along the way: scrolling tables leaked a 390 px page overflow, light pill contrast, scrambled dates in Urdu. | Vitest: 109 in web, 29 in shared (also in two other time zones). Playwright: 33 passing (kit axe, touch sizes, phone width, smoke, owner preview). typecheck, lint, build, check:bundles pass. `test:visual` has no tests until P05; screens compared by eye (see Differences). |
| 2026-10-12 | P01 answers | Applied the developer's answers to P01 questions 1 and 2: the `drawn` prop (56 px box, shape at the PNG size, negative margins) on `Button`, `IconButton`, `Chip`, `Segmented` and `LanguageSwitch`; the light status pill from screen 54 with three new ink tokens and `--o-grey-tint`. Updated `docs/04` §4 and §5 and `docs/05`. The kit now shows the drawn sizes. | Vitest: 23 new, 132 in web now (`touch-box.test.tsx` 15: the margin of every size, each component, the pressed and focus classes; `StatusPill.contrast.test.tsx` 8: all six light pairs, the screen 54 colours, which colours are darkened). Playwright: new kit check measures every `[data-drawn]` control (box at least 56, shape at the drawn size, layout space equal to the drawn size, no two boxes overlap); kit checks pass in counter, owner and phone, axe included; 36 Playwright tests pass in all (33 before). Each new test was shown to fail on a deliberate mistake. |
