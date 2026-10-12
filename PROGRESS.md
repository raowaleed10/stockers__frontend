# Progress

Claude Code updates this file at the end of every step. The developer reads it before starting the next one.

## Steps

| Step | What | Status | Notes |
|---|---|---|---|
| P00 | Install everything and set up the project | ☑ | Done 12 Oct 2026. Follow-up done the same day (new location, audit notes, owner deep links). See the log and the questions below. |
| P01 | Design system and shared UI | ☑ | Done 12 Oct 2026, after the language-file split (see Decisions). 26 components in `src/ui`, `format.ts` and `time.ts` in shared, and `/dev/kit` in both apps. Open questions and differences are below. |
| P02 | Table tiles | ☑ | Done 12 Oct 2026, straight after "P01 answers". Eight tiles, `GameTile`, `/dev/tiles`, and a crop test against the PNGs. Questions and differences are below. |
| P03 | Data, rules and mock API | ☑ | Done 13 Oct 2026, answers applied the same day ("P03 answers"). Six rule files and the shared API types, a typed client with hooks for both apps, the mock server, the live events, and `/dev/data` in both apps. Differences are below. |
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

**From P02: answered by the developer on 12 Oct 2026 (done in "P02 answers")**

| # | Question | Answer | Result |
|---|---|---|---|
| 1 | Text on the lit green cloth (ivory text 2.3:1 and second line 2.1:1 at the brightest part) | Keep it as drawn. The owners approved this look, and the design gives tile text a shadow (`.ct` in `design/tiles.reference.css`: `0 1px 2px rgba(0,0,0,.55)`); the contrast numbers ignore it. Make sure every tile's text uses it. Add to `docs/11_OPEN_QUESTIONS.md`: check tile text on the real counter screen, and if it is hard to read use the stronger shadow from `.ff .ct`. Close the question. | Closed. Nothing changed in the look. I added a Playwright check that measures the computed shadow of every word on all 148 tiles of `/dev/tiles` (English and Urdu): the shadow is the same as the tile's own on every word; the carrom board has its light halo and the foosball pitch the stronger shadow, as in the design; the status pill and the Resume button have none, as in the design. I proved it fails with the shadow removed. The check of the real counter screen is question 14 in `docs/11_OPEN_QUESTIONS.md`, with the fallback written in `docs/04` §6. |
| 2 | Doc against design: out of order | Stripes only on snooker, room and pool: correct, the screens win. | Nothing to change; `docs/04` §5 already says so. |
| 3 | Phone glyph green | Keep `#21864C`: it is the same rule as the light pills. | Kept. |
| 4 | Eight new Urdu words | Keep adding them to `docs/URDU_TO_CHECK.md`. | Kept. No new Urdu words in this round. |
| 5 | Urdu tiles (screen 6) in the pixel test | Comparing by eye is fine for now. In P05, if screen 6 differs only because the Urdu lines render taller, note it in `PROGRESS.md` and compare by eye. | Written under "Heads-up for P05" below. |

**From P02: for information (no answer needed)**

- **Doc corrections, from the approved screens:** a snooker table is set up with **10 reds**, not 15; a room shows the 10 reds, blue, pink and black (not "the black only"). `docs/04` §6 is corrected. The room number is 46 px, as the doc said.
- **Out-of-order doc/design** and **the selected ring:** see question 2 above. No approved screen draws the `selected` status (a free table that was picked); it has the 7 px brass ring of the reference CSS (`r-sel`). Check it when a screen needs it.
- **Red card:** the timer is a red card only on a frame past 30 minutes. A Century (screen 3, table 3) and a room (R1) run longer and are plain. P05 must pass `variant="plain"` for those and `"auto"` for frames.
- **Screen 6 is not in the automatic crop test.** My computer lays out the Urdu design HTML 27 px taller than the PNG (1067 against 1040), so the tile positions found from the HTML are not the PNG's. I compared the nine Urdu tiles with the PNG by eye instead (order, mirrored text, the pill wrapping on table 4, the sofa on the other side, the amounts as "250 روپے"). The developer agreed that this is fine for now (see the answers above).
- **`/dev/games-preview` (screen 5) is left to P05**, as agreed. `/dev/tiles` shows the same tiles at the same sizes.
- **Mistakes I made and fixed on the way:** Prettier reformatted all of `tokens.css` (it is a copy of the designer's file and `.prettierignore` skips it only from the repository root); I restored it from Git and re-applied only my additions (58 lines, none removed). A lint check found a test of mine that could never fail (a backspace character in a regular expression); it is now a plain check.

**From P03: answered by the developer on 12 Oct 2026 (in the plan, before the build)**

| # | Question | Answer | Result |
|---|---|---|---|
| 1 | Who is signed in when a page opens | The seed's signed-in worker: Zain, or Shabir in `closing` and `closed`; the owner app starts as Aqil. The sign-in pages still show. One new switch, `?as=none\|zain\|shabir\|aqil\|adil`. | Done. Written in `docs/06` §6 ("How the mock behaves"). Visual tests can open any route with only `?now` and `?scenario`, as `docs/10` says. |
| 2 | Bell badge: the PNGs show 3 (counter, owner phone) and 4 (owner dashboard); the seed has 0 unread at 9:42 PM and 2 at 3:45 AM | Count the seed's `read:false` flags dated before the demo clock. Do not edit the seed. | Done at first, then replaced by the 13 Oct answer 6 below (the seed was fixed so the badges match the designs). |
| 3 | The seed's `balance` is credit from before tonight (Kamran 1,100), but screen 30 shows 1,350 | Post each waiting bill as statement lines at load and add it to the balance. Players with only a balance get one opening-balance line from an owner (D28). | Done. Balance equals the sum of the statement lines for all 21 players, in all six scenarios (a test). |

**From P03: answered by the developer on 13 Oct 2026 (done in "P03 answers")**

| # | Question | Answer | Result |
|---|---|---|---|
| 1 | Does "charge double after 30 minutes" (Q2) also apply to a double frame? | Yes: Q2 says "the frame". Charge double doubles the double-frame price, then the losing side splits it as on screen 20. The worker always chooses. Add "Over-30 double charge on double frames: confirm" to `docs/11_OPEN_QUESTIONS.md`. | Done. `endGame` accepts `chargeDouble` on a double frame past 30 minutes: Table 5 (Rs 400) becomes Rs 800, 400 each, or a custom split that adds up to 800. The "Charged double" event in Activity names both losers and the extra Rs 400. Still refused under 30 minutes and on a per-game table. `docs/07` §2 and `docs/11` question 15 written. |
| 2 | Sign-ins in Activity? | No: screen 38 is "everything that changed money outside a normal game". Record every sign-in, sign-out, automatic sign-out at the end of the time, "Not your time" attempt and PIN lockout as worker session events with the time, and show them on the Workers page as screen 50 draws them. An owner's change to sign-in times does go in Activity. | Done. `WorkerSessionEvent` (`packages/shared/src/api.ts`), recorded in `mocks/db/auth.ts`. `GET /api/owner/workers` returns each worker with `lastSignIn` ("Today 2:04 AM to 10:00 AM"), `signedIn` ("since 2:06 PM"), `signsOutAt` ("Automatically at 11:00 PM") and `sessionEvents`. An automatic sign-out is dated when the time ended (11:00 PM) even if nobody noticed until later. Wrong PINs 1 to 4 are not events; the fifth is one lockout. A change of time, a PIN or turning sign-in off stays in Activity with the owner's name. 10 tests, one of them proving nothing sign-in-related reaches Activity. `docs/08` §3 and `docs/06` say it. |
| 3a | Waqas and Shoaib: the balances are right (screen 43 shows 1,400 and 500). Fix the `closing` rows. | Old credit 950 and 250. What moves to credit at close is tonight's 450 and 250 (Rs 700). | Done in `mock/seed.json`: the rows are 950 + 450 = 1,400 and 250 + 250 = 500. `waitingTotal` is now 1,900 (the sum of the bills, as in `checkout`) and a new `movesToCreditTotal` is 700. After the close they owe 1,400 and 500 (tested against screen 43). |
| 3b | Bilal: not a conflict. Screen 25 shows when each frame started. | Give every session frame a `startedAt` and an `endedAt` (frame 1 8:31 to 8:55, frame 2 8:56 to 9:23, frame 3 9:23 to 9:51 PM). Statements show the start time. Remove the separate copy in the checkout scenario. | Done. The three frames are in `sess-t1` in the seed. A frame's statement line is dated when it started ("Frame 1, Table 1, lost to Ali Raza", 8:31 PM) and a statement is kept in time order. My own copy of Bilal's frames in the loader is gone: 9:42 PM and 10:20 PM both build his bill from the same session plus `tonightCharges` in the seed (his two teas, 9:30 PM). At 9:42 PM frame 3 is the running game, so the session shows frames 1 and 2. |
| 4 | Screen 31's counts: move them into the seed. | Yes, under `aggregates.today` with clear names. No numbers in the loader. | Done: `doubles` 6, `centuryGames` 5, `playersPutOnCredit` 7, `playersPaidOldCredit` 3, and the discounts so far (`discounts` 2 and Rs 150). The constant in `db/load.ts` is gone, and so is the dispute of activity a2 (now `disputes` in the seed). The closing night uses the same counts, because the seed has no other source. |
| 5 | Discount: is the rule right? | Yes: whole rupees, more than 0, not more than the bill total, reason required, note optional, in Activity with the name. | Already built that way; now tested at the limits (the whole Rs 1,350 allowed, Rs 1,351 refused; 0, negative, fractions and a blank reason refused; no note is fine; the Activity event names the worker). `docs/07` §3 says it. |
| 6 | Bell badges: count the unread flags, but fix the seed so the counts match the designs. | Counter: 3 unread at 9:42 PM, from alerts that are separate from the owners'. Owner: n1 to n4 unread, 4 at 10:30 PM; screen 53 draws 3, a slip, so use 4 and list it. | Done. `counterAlerts` in the seed (Table 7 out of order by Adil, 4:15 PM; Game cancelled on Table 5, 8:12 PM; Chips running low, 9:12 PM) give 3, and `GET /board` `unread` counts them. Owner notifications n1 to n4 are unread: 4 at 10:30 PM. **Two additions of mine:** (a) the counter API gets `GET /alerts` and `POST /alerts/read-all` (no screen draws the list yet), and a table put out of order, a game undone or cancelled, and an item running low add a counter alert; (b) n1 to n3 carry `readAt` 11:00 PM (the owners read them then), so at 3:45 AM only n4, n5 and n6 are unread: 3, as screens 55 and 56 draw. Say if you would rather have plain flags (that gives 6 at 3:45 AM). Known differences: see below. |
| 7 | The flaky "every control is 56 px" test: find why, make it wait for fonts and layout, fix the cause, no retries. | Run it with `--repeat-each=20`. | **I could not make that one test fail again, so the cause below is inferred, not caught.** The failed run's report was overwritten by the next run before I read its message (my mistake). What I did: the test alone 20 times (all passed); 40 times with six busy processes taking the CPU (all passed); 20 times against a cold Vite cache (all passed); the kit and tiles tests 12 times with 8 workers (the control test never failed; the axe tests timed out and one worker ran out of memory); six full-suite runs on the final code (all passed). **What I found:** font and layout were not the cause. I measured every control right after the page mounted, without waiting for fonts, in 25 loads, and none was under its size (a control also cannot be smaller than its minimum height while a font loads). The real pattern is the dev server starting cold: both failures came in the first full runs after I had changed many files, and a full run from a cold Vite cache fails in the same way (5 tests: four axe tests hit the 30 s limit and a page missed a 5 s check; the control test itself took 11 s instead of 3 s). With four workers asking for four different pages at once, a cold server is slow enough to run into a test's time limit. **The fix is for that cause:** `tests/e2e/global-setup.ts` loads every dev page once before any test starts. After it, three full runs from a cold cache all passed 64 of 64 (before it: 4, 2 and 4 failures from the same kind of timeout), the control test stays at 2 to 4 s, and 128 kit and data tests passed with 6 workers and a cold cache. As you asked, the kit, tiles and data specs also wait until the page is quiet before measuring (`tests/e2e/settle.ts`: network idle, fonts loaded, animations finished, size unchanged for 5 frames). No retries were added, and no limit was raised for this test. The four axe tests are marked `test.slow()` because they genuinely take 15 to 19 s alone. |

**From P03: for information (no answer needed)**

- **API additions:** `GET /games/:id` (the `['game', id]` query in `docs/06` §5 needs one; the backend must implement it). `GET /board` without a category is the `snooker` tab; `all` is the whole club. `GET /alerts` and `POST /alerts/read-all` (the counter's bell). `GET /workers` (owner) now returns `lastSignIn`, `signedIn`, `signsOutAt` and `sessionEvents` for each worker. Types: `ActivityType` gained `settings-change`; `Category` gained `centuryRate` and `minMinutes`; a session frame gained `startedAt` (all in `docs/06`).
- **Sign-in order:** the wait after too many tries, then the time of day, then the PIN. A worker outside his time sees "not your time" without needing his PIN (`docs/08` §3 says "before or after").
- **What the counter never sees:** the buying price of a canteen item, the whole phone number (it gets `0313 •••• 2276`), any PIN. Tested.
- **Owner code and the counter bundle:** nothing from `src/mocks/owner` is imported by the counter. A counter build made with `VITE_MOCKS=on` contains the seed (including the example private address), so `check:bundles` fails it on purpose; it is a demo build, never a release. The check now also looks for the seed's players, phone numbers and example address in both production bundles (42 strings).
- **Lint:** the counter/owner keep-apart rule now covers `src/mocks` (counter half, owner half, and the shared `db`), and `Date.now()` and `new Date()` are errors in `src/mocks` and in `packages/shared/src/rules`. I proved each with throwaway files, then removed them. The first try left a hole (the shared `db` could import `../owner-handlers`); the probe found it and the patterns are now tighter.
- **How the e2e tests are timed:** the four axe tests (the kit page in both apps, and the tiles page, in English and Urdu) are marked `test.slow()`: they take 15 to 19 s alone and about 25 s when four run together. The 90 s override I had put on the tiles tests is gone. Everything else runs at the normal limits; see answer 7 for why.
- **Not built, on purpose:** the Socket.IO adapter (the bus in `lib/events.ts` is where it plugs in), real cookies, and the real PDF and Excel files (the owner export returns a stand-in text file until P13).
- **Dev page words:** the Urdu on `/dev/data` is my own sample for checking layout (`src/dev/locales/ur/data.json`), never shown to users, so it is not in `docs/URDU_TO_CHECK.md`.
- **Not mine:** running ESLint directly on `scripts/check-bundles.mjs` reports a control character in an older regular expression. `npm run lint` does not cover `scripts/`, so it never showed.

**From P00: for information (no answer needed)**

3. **Demo clock is on unless `VITE_DEMO_CLOCK=off`**, as P00 specifies. Production builds must set it to `off` (written in `apps/web/.env.example`). P20 should check this.
6. **Git identity.** At your request the global Git name and email are now `rwaowaleed10` / `raowaleed.codemachine@gmail.com` (they were `XtreemeTech`). This affects every repository on this PC.

## Decisions

- **12 Oct 2026, npm audit:** no major upgrades before P20. We decide on them then, with the visual tests in place. Read `docs/AUDIT_NOTES.md` first; it also has the rules that keep the two React Router advisories from applying (no outside text into `<Link to>` or `navigate()`; stay on the plain `BrowserRouter`).
- **12 Oct 2026, owner words never go into the counter app:** language files are split into `common` (both apps), counter-only and owner-only, and only the owner entry loads the owner files. `npm run check:bundles` fails the build check if any owner text over 10 characters is found in `dist/counter`. A word both apps need goes in `common`. Rules in `docs/09_URDU_RTL.md`. Question 2 from P00 is closed.
- **12 Oct 2026, touch size:** a counter control keeps the size its PNG draws, and its pressable box is still 56 px (`drawn`, `docs/04` §4). Every new counter control that a PNG draws under 56 px must use it; the touch-size tests measure the box, and a second check proves the layout did not move.
- **12 Oct 2026, light status pill:** the owner portal follows screen 54 (tinted fill, no border, no dot), with darker text for green, yellow and grey so each is at least 4.5:1 (`docs/04` §5).
- **12 Oct 2026, tiles (P02):** a tile keeps the shape of the object it shows; the words on a foosball pitch and a TV screen sit at the top; the carrom board always wraps its pill under the number; the red card timer is for frames only. A tile with buttons of its own is a `div` (`as="div"`), never a button holding a button. Rules in `docs/04` §6.
- **12 Oct 2026, tile text (P02 answers):** the look of the text on the cloth is as the owners approved it. Every word on a tile has the design's text shadow (checked by a test); if it is hard to read on the real counter screen, use the stronger shadow of `.ff .ct` (`docs/11_OPEN_QUESTIONS.md`, question 14). The pill and the Resume button have no shadow, as in the design.
- **12 Oct 2026, owner deep links:** the server injects `<base href>` and the app-base tag for every address under the secret prefix. The rule is in `docs/08_AUTH_AND_ACCESS.md` §1 and the backend copies it.

- **13 Oct 2026, the mock (P03):** one store per tab, and no "who" from the client: the session decides `doneBy`. A counter session gets 404 from the owner API; no session gets 401. The seed's `balance` is credit from before tonight, tonight's bills are statement lines, and `balance` always equals the sum of the lines. The rules live in `packages/shared/src/rules` and the mock uses them, so the backend later gives the same numbers. Details in `docs/06` §6.

## Carried to P20

- Check that the production counter and owner bundles contain no `/dev/kit` page or kit words (`check:bundles` does this; keep it in the release steps).
- Decide the upgrades listed in `docs/AUDIT_NOTES.md` and re-run `npm audit`.
- Production builds must set `VITE_DEMO_CLOCK=off` (see question 3).
- Leave `mockServiceWorker.js` out of production builds.
- Check that the backend serves the owner app as `docs/08_AUTH_AND_ACCESS.md` §1 says; `scripts/preview-owner.mjs` is the working example.

- The backend must implement every endpoint in `docs/06` §2 and §3 including `GET /games/:id`, the error codes in `packages/shared/src/api.ts`, and the events table in `docs/06` §6.
- Keep the seed check in `check:bundles` in the release steps: a release must have no mock server, no seed and no demo PINs.

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
| 3, 4, 5, 16 | Each tile is 1.2 % to 5.1 % different from its PNG, never more (budget 6 %). The sizes agree to the pixel. The difference is text and gradient edges: the tiles sit at fractional widths (319.2 px), so text lands on a different sub-pixel than in the PNG | Cannot be removed; this is how browsers draw text. Open `test-results/tiles/<id>.png` after `npm run test:visual` to see ours, the design and the difference side by side |
| 6 | Not measured by pixels (see "from P02" above) | The Urdu design HTML does not lay out on my computer as it did for the PNG |
| 16 | The out-of-order note title ("Cloth change") is 20 px; the PNG draws 19 px there | One note style for every screen; Urdu tiles use 19 px as on screen 6 |
| 54 | The playing cloth of the phone glyph is `#21864C`, the PNG has `#239052` | Contrast (question 3) |
| 53, 57 | The owner bell shows 4 where the PNG draws 3 (10:30 PM, n1 to n4 unread) | Screen 36 draws 4 at the same moment; the developer called the 3 a slip in the design (13 Oct answer 6) |
| 54 | The owner bell shows 2 where the PNG draws 3 (9:44 PM: only n1 and n2 have happened) | The same kind of slip; the mock follows the story, not the number |

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
- **Heads-up for P16 (Workers):** `useWorkers()` gives everything screen 50 shows: `lastSignIn`, `signedIn`, `signsOutAt` and `sessionEvents` (kind and time, newest first). "Tonight so far 58 games, 23 checkouts, 1 expense" and "Sheet 47 actions 96" are not in the seed, so P16 needs either more seed or a count from the store. Sign-ins are never in Activity.
- **Heads-up for P04/P05 (the bell):** `useAlerts()` and `useReadAllAlerts()` are the counter's bell (`GET /alerts`, `POST /alerts/read-all`); `useBoard().data.unread` is its badge. The owners' notifications are a separate list.
- **Heads-up for every screen:** put counter dialog content inside `CounterDialog` (it sets the lighter button colour for a panel); a table that scrolls sideways is a focusable region, so give `DataTable` a real `caption`.

## What P02 left in place (read before P03 and P05)

- **Routes to open (`npm run dev`):** `http://localhost:5173/dev/tiles` (and `?lang=ur` for the page words). It shows the tiles of screens 3, 4, 5, 6 and 16 at the size of the screens, then every kind of table in every status in English and Urdu, and the phone glyphs. Timers on it are frozen so the page and its screenshots do not change. The route exists only in development.
- **`src/tiles`:** `SnookerTile`, `RoomTile`, `PoolTile`, `CarromTile`, `FoosballTile`, `LudoTile`, `PlayStationTile`, `GameTile`, `MiniTable`, `TileContent`, `TileActionButton` (Resume), `TileFrame` and `useTile` (the frame and its context), `STATUS_LOOK` (`status.ts`: what each status looks like), `layout.ts` (where balls, coins, rods and diamonds go), `tiles.css` (the drawings). How to use them and what differs from the first plan: `docs/05` "As built in P02".
- **Words:** `tile.versus` ("{{a}} vs {{b}}") and `tile.under` ("Under {{name}}", in Urdu the name first) are in `common` for both languages, from the approved list.
- **Tokens added** (end of `tokens.css`, 58 lines, nothing existing changed): `--tile-*` (text colours on the cloth, the call to action, the yellow paused timer, the Resume button, the glow), `--shadow-tile-soft`, `--ov-w08 … --ov-w75` and `--ov-k22 … --ov-k70` (white and black at a given opacity), the pocket rim, the stripes, pool dim and cushion colours, the sofa, carrom frame/board/coins/lines, foosball goal/rods/handles/men, ludo paper and grid, the TV (bezel, off screen, stand, pad), `--mini-*` (phone glyph) and `--ball-*`. The preset gained `tile.frozen` and `tile.btn`.
- **Tests:** Vitest 223 in web (91 new in `src/tiles/tiles.test.tsx`: every kind in every status for the pill words and the ring class, the lit and faded cloth, the stripes, the red card from 30:00 and not at 29:59, the locked tile with its reason as the accessible description, the `div` tile with Resume, the words in English and Urdu, the order of "Under", balls and coins in the same place in Urdu, the sofa order, the count of balls, coins, rods and diamonds, `MiniTable`) and 29 in shared. Playwright e2e 44 (8 new in `tests/e2e/tiles.counter.spec.ts`: every tile present, no console errors, axe in English and Urdu, every control at least 56 px, Resume drawn 50 px with no layout change, no sideways scroll, focus ring, locked tile, and the text shadow on every word of every tile). Visual 41 (`tests/visual/tiles.counter.spec.ts`).
- **The crop test:** for every tile of screens 3, 4, 5 and 16 it finds the tile in the design HTML, cuts the same rectangle from the PNG, screenshots our tile, and compares the two in the browser (no image package). A pixel counts when a colour channel is more than 48 away; at most 6 % may differ. It writes `test-results/tiles/<id>.png` (ours, design, difference) and `<id>.txt` (the percentage). I proved it can fail: with the out-of-order stripes switched off it reported 38.1 %.
- **Proved on purpose (then undone):** the lock and the over-30 ring in `status.ts` were broken and 10 unit tests failed; the stripes were removed and the crop test failed.
- **Not in P02 (still to build):** the live board and `/dev/games-preview` (P05); pressing a tile does nothing yet (P06/P07); the real Resume behaviour (P07); the phone Live tables page (P17); the bell, Lock and worker chip of the top bar (P04), which use the `drawn` prop.
- **Heads-up for P05 (screen 6):** the Urdu design HTML lays out taller on my computer than the PNG (1067 against 1040 px). If the full-page test of screen 6 differs only because the Urdu lines render taller, write that in `PROGRESS.md` and compare by eye (agreed in "P02 answers"). Do not change the tiles to make the numbers match.
- **Heads-up for P05:** give each tile its size with `className` (screen 3 uses `flex-[1_1_300px] min-w-0` in a flex row with a 22 px gap; screens 4 and 16 are the same on a wider board); name each tile as the screens do ("Table 4, over 30 minutes"); pass `variant="plain"` to the timer of a Century and a room; put Resume in `trailing` with `as="div"`.

## What P03 left in place (read before P04 and P05)

- **Routes to open (`npm run dev`):** counter `http://localhost:5173/dev/data`, `/dev/data?scenario=closing`, `/dev/data?now=2026-10-03T22:51:00%2B05:00`, `/dev/data?as=none`; owner `http://localhost:5173/owner-dev/dev/data` (and `?as=zain` for the 404). Both pages exist only in development.
- **`packages/shared/src/rules`** (all pure, all tested, `now` is always an argument): `charges.ts` (`frameCharge`, `doublePrice`, `doubleCharge`, `splitEvenly`, `overtimeOptions`, `centuryCharge`, `roomCharge`, `gameCharge`, `canStartGame`, `undoSecondsLeft`, `canUndo`, `changeTypeMinutesLeft`, `canChangeType`, and `chargeForGame(game, now)` for the amount so far on a tile), `checkout.ts` (`billBreakdown`, `applyDiscount`, `settleCheckout`), `credit.ts` (`creditAgeDays`, `isOldCredit`, `balanceKind`, `statementBalance`, `runningBalances`), `drawer.ts`, `slots.ts` (`isWithinSlot`, `minutesUntilSlotEnd`, `isSlotEndingSoon`, `slotEndAfter`, `nextSlotStart`), `sheet.ts` (`sheetReceived`, `sheetEarned`, `sheetProfit`, `planClose`), `club-time.ts` (the UTC+5 offset, `toClubIso`), and `maskPhone` in `format.ts`. `packages/shared/src/api.ts` holds every request and answer type and the error codes.
- **`apps/web/src/lib`:** `api-client.ts` (`createApiClient`, `ApiError` with `code`, `status`, `details`; `isApiError`, `isNotYourTime`, `isTooManyTries`), `events.ts` (the bus, `connectLiveEvents`, `useLiveEvents`), `use-action.ts` (a write as a mutation with a typed error), and `clock.setStart`.
- **`src/counter/api` and `src/owner/api`:** `calls.ts` (one function per call in `docs/06` §2 and §3), `hooks.ts` (a hook for every read and write, using the keys in `keys.ts`), `invalidations.ts` (event to query keys) and `live.tsx` (mounted once in each `app.tsx`). Counter keys: `['board', category]`, `['game', id]`, `['players', q]`, `['statement', id]`, `['checkout']`, `['checkout', playerId]`, `['canteen']`, `['today']`, `['closePreview']`, plus `['me']` and `['workers']`. Owner keys follow `docs/06` §5 plus `['sheetFolders']`, `['live']`, `['me']`.
- **`src/mocks`:** `db/` (the store, the seed loader and the scenarios, and one file per area: auth, board, games, players, checkout, canteen, sheet), `counter/handlers.ts`, `owner/*.ts` and `owner/handlers.ts`, `http.ts`, and `test-server.ts` (MSW in Node, for tests). `counter-handlers.ts` and `owner-handlers.ts` build their half over the same store when the page opens.
- **Tests:** Vitest 403 in web (180 in the mock: 111 on the store directly and 69 through the real client over MSW, covering every counter and owner area, the 401 and 404 rules, `NOT_YOUR_TIME`, `doneBy` on every record, sign-in events, both bells, double frames over 30 minutes and events refreshing a hook) and 124 in shared (every worked example of `docs/07`). Playwright e2e 64 (20 new in `tests/e2e/data.counter.spec.ts` and `data.owner.spec.ts`, two of them on the owner sign-in record: the board and workers, starting a game, Shabir refused and Zain in at 9:42 PM, the 401 and 404 answers, each scenario, `?now`, Urdu, the phone). Visual 41 (unchanged).
- **Proved on purpose, then undone:** nine more breaks after the answers (a double frame refused, an automatic sign-out dated when noticed, a sign-in written to Activity, a "Not your time" attempt not recorded, a statement out of time order, a frame dated when it ended, an unread flag ignoring `readAt`, a screen 31 count not read from the seed, a discount above the bill) each failed tests. Before them, eight deliberate breaks (the sign-in time check, the owner 404, the live event after a game change, checkout not clearing a bill, room rounding, drawer arithmetic, a slot across midnight, old credit from day 15) each failed tests; a mocks-on counter build failed `check:bundles`; each new lint rule failed on a throwaway file.
- **Heads-up for P04 (sign-in):** `useSignIn()` rejects with an `ApiError`; use `isNotYourTime(error)` for screen 2 (`error.details` is `{slot, now}`), `isTooManyTries` for "Wait 5 minutes", and `error.code === 'WRONG_PIN'`. `useMe()` answers 401 when nobody is signed in or the worker's time is over (`SESSION_ENDED`): that is the route guard. `slotEndAfter` and `isSlotEndingSoon` give "Until 11:00 PM" and the 10-minute banner. The lock screen calls `useUnlock()`. `?as=none` opens signed out.
- **Heads-up for P05 (board):** `useBoard(category)` returns `players` (names of everyone on a table), `waiting`, `unread`, `backedUpAt` and `pausedAll`. No category is the `snooker` tab (snooker tables and rooms), as `/` is. The waiting panel's "Not paid yet today" is the sum of each bill's `tonight` (Rs 1,550); the checkout list's total is the sum of `total` (Rs 6,880). Use `chargeForGame(game, now)` for the amount on a tile and `TimerText` for the clock; a Century and a room get `variant="plain"`.
- **Heads-up for every screen:** the demo clock, the sign-in times, the undo window and the type-change window all read `clock.now()`, so a screen needs no clock of its own. Write calls return the saved record; the screen refreshes from the live events, not from the call's result.

## Log

| Date | Step | What was done | Tests |
|---|---|---|---|
| 2026-10-12 | P00 | Checked the computer (nothing to install), set Git identity, `git init`, committed the kit. Created the npm workspace: `packages/shared` (types from docs/06) and `apps/web` (counter and owner entries, Vite 5 dev plugin for `/owner-dev/`, two-build script, Tailwind preset and tokens, fonts, i18n, clock, router, query, Zustand, MSW, ErrorBoundary, Page not found), ESLint + Prettier with the import and clock rules, `scripts/check-bundles.mjs`, Vitest and Playwright (counter, owner, phone), README. | Vitest: 16 in web (clock, language, both route sets, app-base), 3 in shared. Playwright: 10 smoke tests across the 3 projects, all passing. typecheck, lint, build and check:bundles pass from a clean `npm install`. |
| 2026-10-12 | P00 follow-up | The project moved to `C:\Projects\stockers`: ran `npm install` (the two workspace links still pointed at the old folder and were relinked; the lock file did not change) and every check again. Wrote `docs/AUDIT_NOTES.md` (15 warnings, only `react-router-dom` 6 ships, no upgrades before P20). Added the owner deep-link rule to `docs/08_AUTH_AND_ACCESS.md` §1, `scripts/preview-owner.mjs`, `npm run preview:owner`, and the Playwright project `preview` with `owner-deep-link.preview.spec.ts`. Noted the approved extras. No new Urdu strings. Did not start P01. | Vitest: 16 in web, 3 in shared. Playwright: 18 passing (10 smoke + 8 deep-link). typecheck, lint, build and check:bundles pass. `test:visual` passes with no tests. I removed the `<base>` tag on purpose and the deep-link tests failed, then I put it back. |
| 2026-10-12 | Language split | Closed P00 question 2. Words are split into `src/locales/{en,ur}/common.json`, `src/counter/locales` and `src/owner/locales`; `lib/i18n.ts` loads only `common` and each entry registers its own folder. `check:bundles` now fails if any owner text over 10 characters is in `dist/counter` (proved with a throwaway English, quoted and Urdu leak, twice). Docs: `docs/09`, `CLAUDE.md` layout, P18 step 1. | Vitest 16 + 3 before P01; typecheck, lint, build, check:bundles pass. Committed on its own. |
| 2026-10-12 | P01 | Built the 26 `src/ui` components, `format.ts` and `time.ts` in shared, the dev-only `/dev/kit` page in both apps (both looks, English and Urdu side by side), new tokens, `useDialog`, and Arabic-only Urdu font. Corrected `docs/04`, `docs/05`, `docs/09`; added Urdu words to `docs/URDU_TO_CHECK.md`. Fixed along the way: scrolling tables leaked a 390 px page overflow, light pill contrast, scrambled dates in Urdu. | Vitest: 109 in web, 29 in shared (also in two other time zones). Playwright: 33 passing (kit axe, touch sizes, phone width, smoke, owner preview). typecheck, lint, build, check:bundles pass. `test:visual` has no tests until P05; screens compared by eye (see Differences). |
| 2026-10-12 | P01 answers | Applied the developer's answers to P01 questions 1 and 2: the `drawn` prop (56 px box, shape at the PNG size, negative margins) on `Button`, `IconButton`, `Chip`, `Segmented` and `LanguageSwitch`; the light status pill from screen 54 with three new ink tokens and `--o-grey-tint`. Updated `docs/04` §4 and §5 and `docs/05`. The kit now shows the drawn sizes. | Vitest: 23 new, 132 in web now (`touch-box.test.tsx` 15: the margin of every size, each component, the pressed and focus classes; `StatusPill.contrast.test.tsx` 8: all six light pairs, the screen 54 colours, which colours are darkened). Playwright: new kit check measures every `[data-drawn]` control (box at least 56, shape at the drawn size, layout space equal to the drawn size, no two boxes overlap); kit checks pass in counter, owner and phone, axe included; 36 Playwright tests pass in all (33 before). Each new test was shown to fail on a deliberate mistake. |
| 2026-10-12 | P02 | Built the eight tiles, `GameTile`, `TileContent`, `TileFrame`, `TileActionButton`, `/dev/tiles`, the tile tokens and `tiles.css`, from the approved HTML and `design/tiles.reference.css`. Corrected `docs/04` §5 and §6 (stripes, 10 reds, the selected ring), added "As built in P02" to `docs/05`, and eight Urdu words to `docs/URDU_TO_CHECK.md`. Fixed along the way: the page's line height made tiles 2–6 px too tall, foosball and TV words were stretched to the bottom, the carrom pill did not wrap, Urdu amounts had a tiny word, a contrast failure on the phone glyph. | Vitest: 223 in web, 29 in shared. Playwright: 43 e2e (7 new) and 41 visual (tile crops, 1.2–5.1 % different, budget 6 %). typecheck, lint, build and check:bundles pass; no gallery word and no tile style is in the counter bundle. Each kind of test was shown to fail on a deliberate mistake. |
| 2026-10-12 | P02 answers | Applied the developer's answers to the P02 questions: nothing changed in the look; added a check that every word of every tile has the design's text shadow; wrote question 14 in `docs/11_OPEN_QUESTIONS.md` and the fallback in `docs/04` §6; closed the question in this file; noted the Urdu-by-eye rule for P05. | Playwright: 44 e2e (1 new: text shadow on all 148 tiles, shown to fail with the shadow removed) and 41 visual. Vitest 223 in web, 29 in shared. typecheck, lint, build and check:bundles pass. |
| 2026-10-13 | P03 | Built the six rule files and `api.ts` in shared; the typed API client, the event bus and `useAction` in `lib`; the counter and owner API calls and hooks; the mock server (store, seed loader, five scenarios, counter and owner handlers over one store); `/dev/data` in both apps; lint rules for the mocks and the shared rules; the seed check in `check:bundles`; docs 03 and 06. Fixed along the way: `GET /settings` had no payment methods, owner sign-in did not refresh what had failed with 401, the board with no category returned the whole club, a lint pattern let the shared `db` import an owner file. | Vitest: 368 in web, 122 in shared. Playwright: 62 e2e (18 new) and 41 visual. typecheck, lint, build and check:bundles pass. Each kind of test was shown to fail on a deliberate break (see "What P03 left in place"). |
| 2026-10-13 | P03 answers | Applied the developer's seven answers: the over-30 choice on double frames; worker session events and the Workers data (not in Activity); the seed fixed (closing rows, session frames with start and end, screen 31's counts, disputes, counter alerts, owner notification times) and the loader's own numbers removed; frame lines dated from their start; the counter's alerts and bell; the discount limits tested; docs 06, 07, 08, 11. Found and fixed along the way: a worker who is signed in at the start had no `lastSignIn` to close, and the e2e specs now start from a warm dev server (`global-setup.ts`) and wait for fonts, animations and layout with one `settle` helper. | Vitest: 403 in web, 124 in shared. Playwright: 64 e2e (2 new: the owner's sign-in record) and 41 visual; three full runs from a cold cache all passed 64 of 64 (answer 7). typecheck, lint, build and check:bundles pass. Nine new deliberate breaks each failed tests. |
