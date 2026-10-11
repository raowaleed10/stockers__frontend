# P16-owner-canteen-expenses-workers-settings · Canteen, expenses, workers and sign-in times, settings

**Goal:** Build the canteen and stock page, expenses (including drawer expenses by workers), the new Workers page with sign-in times, and Settings with the private owner address.

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/02_DECISIONS.md` D31, D39–D41, D47, D49–D53, Q11, Q12, Q15, Q19; `docs/08_AUTH_AND_ACCESS.md`

## Look at these screens before you write code
Open each PNG (it is the approved design) and read its HTML for exact sizes, colours and copy.
- Screen 48, Canteen and stock (1440×1073, clock 10:30 PM): `design/screens/48-canteen-and-stock.png` and `design/html/48-canteen-and-stock.html` → `/owner-dev/canteen`
- Screen 49, Expenses (1440×1127, clock 10:30 PM): `design/screens/49-expenses.png` and `design/html/49-expenses.html` → `/owner-dev/expenses`
- Screen 50, Workers and sign-in times (1440×1078, clock 10:30 PM): `design/screens/50-workers-and-sign-in-times.png` and `design/html/50-workers-and-sign-in-times.html` → `/owner-dev/workers`
- Screen 51, Settings (1440×1936, clock 10:30 PM): `design/screens/51-settings.png` and `design/html/51-settings.html` → `/owner-dev/settings`

## Build
1. `/canteen` (screen 48):
   - Stat cards (sales, profit, stock value, running low).
   - Filter chips; the item table (sells for, buys for with "est." for fresh items, profit each, stock, sold, profit).
   - The Add stock bought aside (item, how many, paid in total, the buying price it becomes, paid from), and recent stock bought.
2. `/expenses` (screen 49):
   - The month switcher; stat cards (October so far, last month, **From the counter drawer: Rs 500, added by Zain**).
   - "Where it went" bars; the list with when, what for, type, paid from (Owner, Bank, **Drawer cash**) and added by.
   - The Add an expense aside: category chips; staff member chips (Shabir, Zain, Sajid, Add staff) for salaries and advances; Advance or Salary; paid from.
   - Owners can edit or remove a drawer expense (with a reason; recorded).
3. `/workers` (screen 50), new:
   - The `SignInTimeline` showing a 24 h bar per worker, the hatched "Nobody" gaps and the "Now" line, plus the gap explanation.
   - Worker cards: status (signed in now since…, or not signed in), the "Can sign in" time, last sign-in, actions, PIN status; Change time, Change PIN, Turn off sign-in.
   - The **Change time** aside with `TimeSlotPicker` (hour, minute, AM/PM; crossing midnight is allowed), the plain-words summary ("…every day from 2:00 AM to 10:00 AM. That is 8 hours."), and the end-of-time note.
   - Add worker (name and 4-digit PIN twice); Change PIN.
4. `/settings` (screen 51):
   - **Who can sign in:** Aqil and Adil with Change password; the **Private owner address** with Copy and Change address (a confirm dialog explains that all owners will be signed out); Workers (links to `/workers`); Sign out every device.
   - Payment methods (Cash always on; toggles; add a method).
   - Counter rules (charge-double minutes, paisa rounding, discounts, credit, lock time, room minimum).
   - Alerts on your phones (exactly the 5 from Q12).
   - Daily summary email ("Waiting for your email addresses"); language; backups (this computer, USB drive, back up now, download a copy); club details.

## Done when
- A changed sign-in time for Shabir takes effect on the counter's sign-in screen through the mock (for example 21:00–23:30 lets him in at 21:42).
- The drawer expense from P10 shows in Expenses as "Drawer cash, Zain".
- Changing the owner address in the mock shows the new address once and signs out.
- Screens 48–51 match their PNGs.

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).


## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run test:visual` for the screens above. Fix everything until they pass.
2. Start the app and compare each screen above with its PNG at the design size. List any difference you could not fix.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P16 Canteen, expenses, workers and sign-in times, settings"`.
