# P12-owner-dashboard-reports-activity · Dashboard, reports, activity

**Goal:** Build the owners' main pages: the dashboard with today and the month, reports with month comparisons, and Activity with names, filters and disputes.

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/04_DESIGN_SYSTEM.md` §7 (charts), `docs/07_RULES_FOR_SCREENS.md` §7, `docs/02_DECISIONS.md` D15, D24, D37, D38, D52, Q11

## Look at these screens before you write code
Open each PNG (it is the approved design) and read its HTML for exact sizes, colours and copy.
- Screen 36, Dashboard (1440×1479, clock 10:30 PM): `design/screens/36-dashboard.png` and `design/html/36-dashboard.html` → `/owner-dev/`
- Screen 37, Reports and comparisons (1440×1818, clock 10:30 PM): `design/screens/37-reports-and-comparisons.png` and `design/html/37-reports-and-comparisons.html` → `/owner-dev/reports`
- Screen 38, Activity (1440×1377, clock 3:45 AM, scenario `closed`): `design/screens/38-activity.png` and `design/html/38-activity.html` → `/owner-dev/activity`
- Screen 53, Home (390×1715, clock 10:30 PM): `design/screens/53-home.png` and `design/html/53-home.html` → `/owner-dev/`

## Build
1. `/` dashboard (screen 36), from `GET /dashboard` (`aggregates` in the seed):
   - Today: earned, received, put on credit, tables in use. October so far: earned, expenses, canteen buying cost, profit.
   - Credit pending; money in hand (received − expenses paid today).
   - Earned per day for the last 30 days (bars, today hatched), where October's money came from, busiest hours.
   - Biggest debts, top players, and "Needs a look".
2. `/reports` (screen 37):
   - Day/Month/Year switch and the comparison picker.
   - Four stat cards; profit is after expenses and canteen buying cost.
   - The running-total line chart (two months).
   - By game, by table (bars), **Money received by payment method**, and the year bars.
   - PDF and Excel buttons (just trigger `GET …/export` for now).
3. `/activity` (screen 38):
   - The "1 dispute is waiting for you" banner with Faisal pays, Naveed pays, Half each, Nobody pays (`POST /activity/:id/decide`).
   - Type chips (with counts) and **Done by** chips (Everyone, Shabir, Zain, Aqil, Adil).
   - The table with time, done by, what happened and amount.
4. Charts: the Recharts wrappers from `05_COMPONENTS.md` (`BarChartDays`, `LineChartMonth`, `BusyHours`, `HBarList`), using the tokens. Thin marks, one hue, a tooltip on tap.
5. Phone home (screen 53): the same data in the phone layout (hero card, mini stats, Needs a look, 7-day bars, the month, credit pending).

## Done when
- Screens 36, 37, 38 and 53 match their PNGs with the seed data.
- Deciding a dispute removes the banner and adds an activity line "by Aqil".

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).


## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run test:visual` for the screens above. Fix everything until they pass.
2. Start the app and compare each screen above with its PNG at the design size. List any difference you could not fix.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P12 Dashboard, reports, activity"`.
6. If anything needs my answer, list the questions at the very end of your report (also in PROGRESS.md). I will answer in this same session; then apply the answers, update PROGRESS.md, run the checks and commit again as "P12 answers". The next step starts in a new session only after that.
