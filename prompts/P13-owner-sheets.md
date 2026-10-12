# P13-owner-sheets · Sheets: folders, days, a sheet, corrections

**Goal:** Build the sheets area: month folders, the days of a month, a full day sheet, and correcting an entry with a required reason and history.

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/02_DECISIONS.md` D30, D32–D36, D52

## Look at these screens before you write code
Open each PNG (it is the approved design) and read its HTML for exact sizes, colours and copy.
- Screen 39, Sheets: month folders (1440×900, clock 3:45 AM, scenario `closed`): `design/screens/39-sheets-month-folders.png` and `design/html/39-sheets-month-folders.html` → `/owner-dev/sheets`
- Screen 40, Sheets: days in a month (1440×900, clock 3:45 AM, scenario `closed`): `design/screens/40-sheets-days-in-a-month.png` and `design/html/40-sheets-days-in-a-month.html` → `/owner-dev/sheets/2026-10`
- Screen 41, A day’s sheet (1440×900, clock 3:45 AM, scenario `closed`): `design/screens/41-a-days-sheet.png` and `design/html/41-a-days-sheet.html` → `/owner-dev/sheets/s48`
- Screen 42, Correct a sheet (1440×907, clock 3:45 AM, scenario `closed`): `design/screens/42-correct-a-sheet.png` and `design/html/42-correct-a-sheet.html` → `/owner-dev/sheets/s48/edit`
- Screen 55, Sheets (390×853, clock 3:45 AM, scenario `closed`): `design/screens/55-sheets.png` and `design/html/55-sheets.html` → `/owner-dev/sheets/2026-10`

## Build
1. `/sheets` (screen 39): the 2026 month folders with days, sheets and earned; the Folders/Calendar switch; search.
2. `/sheets/:month` (screen 40):
   - Day rows: sheet number, open and close times, the note ("Edited once by Adil"), status, earned, PDF and Excel.
   - The month summary row; the calendar heat panel.
3. `/sheets/:id` (screen 41):
   - The header "Opened 11:10 AM Sat by Adil, closed 3:40 AM Sun by Shabir…"; tabs.
   - The spreadsheet-like grid with numbered rows and lettered columns, as in the design.
   - The money panel: cash, the line "Taken from the drawer, Zain, food −500", expected and counted, online by method, received, old credit, new credit.
   - "Correct an entry" goes to edit.
4. `/sheets/:id/edit` (screen 42):
   - The blue "Editing sheet 48" bar; table chips; the editable grid with the selected row highlighted.
   - `OwnerAside`: was → change to, new amount, **reason required**, and the effect note (for example "becomes advance").
   - History lines with names ("9:04 PM, Zain: started…").
5. Phone (screen 55): October summary and day rows.

## Done when
- Correcting the Century minutes from 42 to 37 updates the amount, needs a reason, and adds a history line and an activity event by the owner.
- Screens 39–42 and 55 match their PNGs.

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).


## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run test:visual` for the screens above. Fix everything until they pass.
2. Start the app and compare each screen above with its PNG at the design size. List any difference you could not fix.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P13 Sheets: folders, days, a sheet, corrections"`.
6. If anything needs my answer, list the questions at the very end of your report (also in PROGRESS.md). I will answer in this same session; then apply the answers, update PROGRESS.md, run the checks and commit again as "P13 answers". The next step starts in a new session only after that.
