# P10-canteen-expense-day · Canteen, drawer expense, players, today, close sheet

**Goal:** Build the rest of the counter: canteen sales, the new drawer expense, players and statements, today's totals, and closing the sheet.

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/07_RULES_FOR_SCREENS.md` §4, §5 and §7; `docs/02_DECISIONS.md` D27, D31–D34, D53, Q5, Q10

## Look at these screens before you write code
Open each PNG (it is the approved design) and read its HTML for exact sizes, colours and copy.
- Screen 28, Canteen sale (1440×900, clock 9:55 PM): `design/screens/28-canteen-sale.png` and `design/html/28-canteen-sale.html` → `/canteen`
- Screen 29, Expense from the drawer (1440×900, clock 8:15 PM): `design/screens/29-expense-from-the-drawer.png` and `design/html/29-expense-from-the-drawer.html` → `/expense`
- Screen 30, Players and their statements (1440×900, clock 10:25 PM): `design/screens/30-players-and-their-statements.png` and `design/html/30-players-and-their-statements.html` → `/players/kamran`
- Screen 31, Today’s totals (1440×900, clock 10:30 PM): `design/screens/31-todays-totals.png` and `design/html/31-todays-totals.html` → `/today`
- Screen 32, Close the sheet (1440×924, clock 3:40 AM, scenario `closing`): `design/screens/32-close-the-sheet.png` and `design/html/32-close-the-sheet.html` → `/close-sheet`
- Screen 33, New sheet opened (1440×900, clock 3:40 AM, scenario `closed`): `design/screens/33-new-sheet-opened.png` and `design/html/33-new-sheet-opened.html` → `/sheet-closed`

## Build
1. `/canteen` (screen 28):
   - Item grid with category tabs; stock left, low or sold out.
   - "Charge to": a player (search) or a cash sale with no name.
   - The basket with − and + buttons, then "Add Rs 300 to Usman's bill", or take cash now for a cash sale.
2. `/expense` (screen 29), new:
   - "Added by Zain" and "Expense from the drawer".
   - What for: Food, Petrol, Tea and milk, Cleaning, Repairs, Other.
   - A required note, the amount with quick buttons, and the cash-in-the-drawer preview (before → after).
   - "Take Rs 500 from the drawer". It is saved with the worker's name and shows in owner Expenses and Activity.
3. `/players` and `/players/:id` (screen 30): list with filters (All, Owe money, Advance) and the selected player's statement. "Checkout Kamran".
4. `/today` (screen 31):
   - "Cash that should be in the drawer Rs 17,950", explained as cash received minus drawer expenses.
   - Online money by method, frames played, Century minutes, put on credit, old credit collected.
   - Still waiting to pay (6 bills, Rs 5,100), with Go to checkout.
   - The line about drawer expenses tonight. No profit.
5. `/close-sheet` (screen 32):
   1. Count the cash drawer: expected after expenses, counted, short or extra, and a required note when not zero.
   2. Online money by method.
   3. When you close: left-without-checkout players, running games that move to the next sheet, and the summary email.
   - The sheet summary card; "Close sheet 48".
6. `/sheet-closed` (screen 33): what moved, credit moved, the cash check result, "Summary emailed to Aqil and Adil", "Back to tables".

## Done when
- A drawer expense of 500 lowers the expected cash on `/today` and `/close-sheet`; the owner sees it with the name (checked in P16).
- Closing with counted 21,550 needs a note, opens sheet 49, and moves the running Century.
- Screens 28–33 match their PNGs.

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).


## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run test:visual` for the screens above. Fix everything until they pass.
2. Start the app and compare each screen above with its PNG at the design size. List any difference you could not fix.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P10 Canteen, drawer expense, players, today, close sheet"`.
