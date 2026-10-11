# Progress

Claude Code updates this file at the end of every step. The developer reads it before starting the next one.

## Steps

| Step | What | Status | Notes |
|---|---|---|---|
| P00 | Install everything and set up the project | ☐ |  |
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

## Differences from the designs that could not be fixed

(Screen number, what is different, why.)

## Log

| Date | Step | What was done | Tests |
|---|---|---|---|
