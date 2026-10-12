# P09-checkout · Checkout

**Goal:** Build checkout: who is paying, the player's bill with old credit and advance, paying in full, in part or on credit, split payments across methods, and discounts with a reason.

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/07_RULES_FOR_SCREENS.md` §3, `docs/02_DECISIONS.md` D23–D27, Q6, Q19

## Look at these screens before you write code
Open each PNG (it is the approved design) and read its HTML for exact sizes, colours and copy.
- Screen 24, Checkout: who is paying? (1440×900, clock 10:20 PM, scenario `checkout`): `design/screens/24-checkout-who-is-paying.png` and `design/html/24-checkout-who-is-paying.html` → `/checkout`
- Screen 25, A player’s bill (1440×900, clock 10:20 PM, scenario `checkout`): `design/screens/25-a-players-bill.png` and `design/html/25-a-players-bill.html` → `/checkout/bilal`
- Screen 26, Part payment (1440×900, clock 10:22 PM, scenario `checkout`): `design/screens/26-part-payment.png` and `design/html/26-part-payment.html` → `/checkout/bilal/part`
- Screen 27, Give a discount (1440×900, clock 10:21 PM, scenario `checkout`): `design/screens/27-give-a-discount.png` and `design/html/27-give-a-discount.html` → `/checkout/bilal/discount`

## Build
1. `/checkout` (screen 24):
   - Search, plus the tabs "Waiting to pay (8)" and "Owes from before".
   - Bill cards with name, phone tail, what for and total; the selected card has a brass border.
   - The footer "Waiting tonight Rs 6,880" and the note about "Left without checkout".
2. `/checkout/:playerId` (screen 25):
   - The bill as a statement: old credit with its date and age, tonight's lines, the total to pay.
   - On the right: Paid in full, Paid part, Put all on credit.
   - "Paid by": Cash, Bank transfer, Easypaisa, JazzCash (a simple choice, Q19).
   - "Give a discount".
3. `/checkout/:playerId/part` (screen 26):
   - Money received now, as rows per method.
   - The keypad (with 00); total, paid now, stays as credit.
   - Overpaying shows the extra as advance.
4. `/checkout/:playerId/discount` (screen 27):
   - Amount with quick chips; reason chips (Rounded the bill, Frame ended early, Table problem, Owner allowed, Other), required; an optional note.
   - Bill → discount → new total.
5. After saving, the waiting list and the board update, and the statement gets payment lines with "Zain".

## Done when
- Bilal's example works end to end: 1,350 → discount 50 → cash 600 + Easypaisa 400 → 300 to credit, with the right statement lines.
- Saad uses his Rs 200 advance and pays 430.
- Screens 24–27 match their PNGs.

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).


## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run test:visual` for the screens above. Fix everything until they pass.
2. Start the app and compare each screen above with its PNG at the design size. List any difference you could not fix.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P09 Checkout"`.
6. If anything needs my answer, list the questions at the very end of your report (also in PROGRESS.md). I will answer in this same session; then apply the answers, update PROGRESS.md, run the checks and commit again as "P09 answers". The next step starts in a new session only after that.
