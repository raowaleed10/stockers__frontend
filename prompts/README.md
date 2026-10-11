# Prompts for Claude Code

Paste these into Claude Code in order, **one per conversation** (start a new one with `Ctrl+Shift+Esc`, Mac `Cmd+Shift+Esc`). P00 installs everything the project needs, so run it first. Start each one in Plan mode with:

> Read `prompts/<file>` and do it. Plan first and show me the plan before you write code.

| # | File | Screens |
|---|---|---|
| 0 | `P00-setup.md` | – |
| 1 | `P01-design-system.md` | kit |
| 2 | `P02-table-tiles.md` | 3–6, 16, 54 |
| 3 | `P03-data-and-mocks.md` | – |
| 4 | `P04-counter-shell-and-signin.md` | 1, 2, 34 |
| 5 | `P05-live-board.md` | 3–6 |
| 6 | `P06-start-game.md` | 7–10, 12 |
| 7 | `P07-running-game.md` | 11, 13–16 |
| 8 | `P08-ending-games.md` | 17–23 |
| 9 | `P09-checkout.md` | 24–27 |
| 10 | `P10-canteen-expense-day.md` | 28–33 |
| 11 | `P11-owner-shell-and-signin.md` | 35, 52 |
| 12 | `P12-owner-dashboard-reports-activity.md` | 36–38, 53 |
| 13 | `P13-owner-sheets.md` | 39–42, 55 |
| 14 | `P14-owner-players.md` | 43, 44, 56 |
| 15 | `P15-owner-prices-games.md` | 45–47, 57 |
| 16 | `P16-owner-canteen-expenses-workers-settings.md` | 48–51 |
| 17 | `P17-owner-phone.md` | 52–58 |
| 18 | `P18-urdu-everywhere.md` | all |
| 19 | `P19-visual-qa.md` | 1–58 |
| 20 | `P20-handover.md` | – |

If a step is too big for one conversation, ask Claude Code to stop and write what is left in `PROGRESS.md`. Then start a new conversation with "Read PROGRESS.md and continue <step>".

**Fix requests work best with the screen number and the image:**

> Screen 25: the payment buttons should be 60 px tall and in one row, like design/screens/25-a-players-bill.png. Check design/html/25-a-players-bill.html for the sizes.
