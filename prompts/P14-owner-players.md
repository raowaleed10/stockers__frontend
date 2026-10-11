# P14-owner-players · Players and credit

**Goal:** Build the players list with credit and the player page with the bank-statement view, payments and opening balances.

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/02_DECISIONS.md` D20–D22, D25, D26, D28, D29; `docs/07_RULES_FOR_SCREENS.md` §4

## Look at these screens before you write code
Open each PNG (it is the approved design) and read its HTML for exact sizes, colours and copy.
- Screen 43, Players and credit (1440×900, clock 3:45 AM, scenario `closed`): `design/screens/43-players-and-credit.png` and `design/html/43-players-and-credit.html` → `/owner-dev/players`
- Screen 44, A player’s page (1440×900, clock 3:45 AM, scenario `closed`): `design/screens/44-a-players-page.png` and `design/html/44-a-players-page.html` → `/owner-dev/players/kamran`
- Screen 56, A player’s statement (390×1136, clock 3:45 AM, scenario `closed`): `design/screens/56-a-players-statement.png` and `design/html/56-a-players-statement.html` → `/owner-dev/players/kamran`

## Build
1. `/players` (screen 43):
   - Stat cards: owed to the club, older than 15 days (amber), advance held.
   - Search; filters (All, Owe money, Old 15+ days, Advance, No phone).
   - The table: player, phone, owes, oldest unpaid, last visit, frames won, Open.
   - Buttons: Enter old credit, Download list, Add player. No limits or warnings (D25).
2. `/players/:id` (screen 44):
   - The profile card and the note.
   - Record a payment; Add old credit from the register (opening balance); Edit name, phone or note.
   - The statement with This month / Last 30 days / All time, PDF and Excel, and a pencil per line for owner corrections (reason required).
   - "Oldest unpaid charge…".
3. Phone (screen 56): profile, owes card, **Call** and **Download PDF** (no WhatsApp, D29), Record a payment, the statement list.

## Done when
- A recorded payment lowers the balance and adds a statement line with the owner's name.
- Screens 43, 44 and 56 match their PNGs.

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).


## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run test:visual` for the screens above. Fix everything until they pass.
2. Start the app and compare each screen above with its PNG at the design size. List any difference you could not fix.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P14 Players and credit"`.
