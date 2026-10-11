# 01 · Product

## The club
- **Stockers**, Mian Plaza. Owners: **Aqil Farooq** and **Adil Farooq**. Open 24 hours, 7 days.
- Games at launch: **snooker tables 1–7** (Tables 1, 2, 3, 6 at Rs 250 a frame; Tables 4, 5, 7 at Rs 200), **Rooms 1–2** (a snooker table with sofa seating, Rs 1,500 an hour), **pool tables ×4, foosball ×3, carrom ×3, ludo ×4, PlayStation ×5** (no prices yet, shown but locked).
- A canteen sells tea, cold drinks, snacks and cigarettes.

## Who uses it

| Person | Where | Signs in with | Can do |
|---|---|---|---|
| **Shabir** (worker) | Counter touch screen, or any device at the counter address | Own 4-digit PIN, **only 2:00 AM–10:00 AM** | Run games, checkout, canteen, drawer expenses, close sheet, see today's cash and online totals. No profit, no prices, no owner screens. |
| **Zain** (worker) | Same | Own PIN, **only 2:00 PM–11:00 PM** | Same as Shabir |
| **Aqil Farooq** (owner) | Private owner address, computer or phone | Own password | Everything: money, sheets, edits, players, prices, games, canteen, expenses, workers and sign-in times, settings |
| **Adil Farooq** (owner) | Same | Own password | Same as Aqil |

Sign-in times are examples set by the owners in **Workers** (screen 50); they can change them any time.

## Two apps, one codebase
- **Counter app** at the club address root (`/`). It has no owner sign-in, no link to the owner portal, and no owner code in its bundle.
- **Owner app** only at the private address (`/<secret>/`). It is responsive: sidebar on a computer, bottom tabs on a phone.

## The main flows (counter)
1. **Sign in.** The worker taps his name and enters his PIN. Outside his time he sees "Not your time to sign in" (screens 1, 2).
2. **Live board.** All tables are drawn as real tables with status rings, timers and amounts. On the right is "Waiting to pay" (screen 3). The tabs show the other games (4, 5). The language switches to Urdu (6).
3. **Start a game.** Tap a free table, choose single frame, double frame or Century, then pick the players or add a new one (7–10).
4. **While playing.** Open the table panel to end, pause, move, swap a player, add canteen, add a damage charge or discard (11, 13–15). The game type can be changed within 5 minutes (12). Pause all for a power cut (16).
5. **End.** Choose who lost; that player pays (17). Start the next frame with one tap (18). Over 30 minutes the timer shows a red card, and at the end the worker chooses normal or double price (19). For a double, the losing side splits it (20). Century ends with whole minutes (21). Rooms have a 1 hour minimum, then charge by the minute (22, 23).
6. **Checkout.** Choose who is paying (24). The bill shows the old balance plus tonight (25). The player pays in full, pays part with a split across methods (26), or puts it on credit. A discount needs a reason (27).
7. **Canteen sale** to a player's bill, or for cash with no name (28).
8. **Drawer expense.** Cash taken for food, petrol and the like (29). It lowers the expected drawer cash.
9. **Players and statements** (30). **Today's totals** (31). **Close the sheet** with a cash count (32). A new sheet opens straight away (33).
10. **Lock.** The screen locks after 5 minutes without a tap. The signed-in worker unlocks it, or the other worker signs in (34).

## The main flows (owners)
- **Sign in** at the private address (35, 52).
- **Dashboard**, **Reports**, **Activity** with names and disputes (36–38).
- **Sheets**: month folders, days, the full sheet, corrections with history (39–42).
- **Players and credit**, a player's page and statement (43, 44).
- **Games and prices**: change a price, add a game or table (45–47).
- **Canteen and stock**, **Expenses** including drawer expenses, **Workers and sign-in times**, **Settings** (48–51).
- **Phone**: home, live tables, sheets, player statement, prices, alerts (53–58).

## Words used in the app (glossary)

| Word | Meaning |
|---|---|
| Frame | One game of snooker. Single frame: 1 vs 1, the loser pays the table price. |
| Double frame | 2 vs 2 (or 1 vs 2). Double price; the losing side splits it. |
| Session | The same players playing frame after frame on one table. Shown as "Frame 4, Ali 3–0 Bilal". |
| Century | Snooker by the minute under one player's name. Whole minutes only. |
| Room | A private room with a snooker table. Hourly price, 1 hour minimum, then by the minute. |
| Sheet | One working day, from "open" to "Close sheet". It has a number (sheet 48). |
| Waiting to pay | Charges from tonight not yet paid. |
| Credit | Money a player owes. Old after 15 days. No limits, no warnings. |
| Advance | Money a player paid ahead; it is used first at his next checkout. |
| Drawer cash | Cash that should be in the counter drawer = cash received − expenses taken from the drawer. |
| Red card | The timer turns into a solid red card when a frame passes 30 minutes. |
