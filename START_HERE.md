# Stockers frontend: step-by-step build guide for Claude Code in VS Code

This kit has everything Claude Code needs to build the whole Stockers frontend: the counter touch screen, the owner portal on a computer, and the owner portal on a phone. The 58 approved screens are here as images and HTML. Every rule from the owners is written down. There are 21 numbered prompts to paste one by one.

You don't need to write the frontend yourself. Your job is to run each prompt, look at the result next to the design image, ask for fixes, and commit.

---

## 1. What is in the kit

```
stockers/                     ← your project folder (unzip the kit here)
├── START_HERE.md             ← this guide (for you)
├── CLAUDE.md                 ← rules Claude Code reads at the start of every session
├── PROGRESS.md               ← Claude Code fills this in after each step
├── docs/
│   ├── 01_PRODUCT.md         ← what the app is, who uses it, the main flows
│   ├── 02_DECISIONS.md       ← every owner decision (D1–D53) and answer (Q1–Q19)
│   ├── 03_ROUTES_AND_SCREENS.md ← every screen: number, route, image, HTML, parts
│   ├── 04_DESIGN_SYSTEM.md   ← colours, fonts, sizes, table tiles, status colours
│   ├── 05_COMPONENTS.md      ← the shared React components and their props
│   ├── 06_DATA_AND_API.md    ← TypeScript types, API calls, live events, mock data
│   ├── 07_RULES_FOR_SCREENS.md ← money and game rules the screens show, with worked examples
│   ├── 08_AUTH_AND_ACCESS.md ← private owner address, worker PINs, sign-in times, locking
│   ├── 09_URDU_RTL.md        ← Urdu, right-to-left, word list
│   ├── 10_TESTING_AND_QA.md  ← how every screen is checked against its image
│   └── 11_OPEN_QUESTIONS.md  ← what the owners still have to answer
├── design/
│   ├── screens/              ← 58 PNGs: 01-worker-sign-in.png … 58-alerts.png
│   ├── html/                 ← the same 58 screens as HTML you can open in a browser
│   ├── screens.json          ← list of all 58: number, name, route, size, demo time
│   ├── tokens.css            ← colour and font variables, ready to copy
│   ├── tailwind.preset.ts    ← Tailwind theme with the same tokens
│   └── tiles.reference.css   ← the exact CSS that draws the table tiles
├── mock/
│   └── seed.json             ← sample data for the evening of Sat 3 Oct 2026 (matches the screens)
└── prompts/
    ├── README.md             ← the order, and how to ask for fixes
    └── P00-setup.md … P20-handover.md   ← paste these into Claude Code in order
```

**Screen numbers** are the same everywhere: in `design/screens`, `design/html`, the docs, the prompts and the owners' feedback PDF. When you ask for a fix, say the screen number ("Screen 03 …").

---

## 2. Set up your computer (once)

You only install two things yourself. The first prompt (P00) makes Claude Code check and install the rest: Node.js, Git, every library and the test browser.

1. **VS Code**, from code.visualstudio.com (version 1.94 or newer).
2. **Claude Code in VS Code.** Press `Ctrl+Shift+X` (Mac: `Cmd+Shift+X`), search "Claude Code", click **Install**, and sign in with your Claude account (a paid plan). Install steps change, so follow the official guide if anything looks different: https://code.claude.com/docs/en/vscode
3. **Make a folder** called `stockers` and **unzip the kit into it**. `CLAUDE.md` must sit directly inside `stockers`, next to `docs/`, `design/`, `mock/` and `prompts/`. (P00 fixes it if the files end up one folder too deep.)
4. **Open the folder in VS Code** (File → Open Folder) and click the Spark icon at the top right of an open file to open Claude Code.
5. **Run P00** (section 3). It shows you a table of what it found and installed. If it needs administrator rights, it stops and tells you exactly what to install; do that, reopen VS Code and run P00 again. It asks for your name and email for Git if they aren't set.

Claude Code reads `CLAUDE.md` automatically when a session starts in this folder, so the rules there apply to every prompt. More on that: https://code.claude.com/docs/en/memory

---

## 3. How to run one step

Do this for each prompt, P00 to P20, in order:

1. **Start fresh.** Open a new Claude Code conversation (`Ctrl+Shift+Esc`, Mac `Cmd+Shift+Esc`) so the last step doesn't fill up the context.
2. **Switch to Plan mode** with the mode button at the bottom of the prompt box.
3. **Give it the prompt.** Type:
   > Read `prompts/P05-live-board.md` and do it. Plan first and show me the plan before you write code.
4. **Check the plan.** It should list the files it will make, the screens it looked at and how it will test. If it skipped a screen image, say "Look at design/screens/03-live-board.png first."
5. **Let it build.** Approve the plan, then switch to **Edit automatically** (or stay in **Manual** to approve each change). Approve the commands it asks to run.
6. **Look at the result.** Claude Code tells you the addresses to open (usually `http://localhost:5173/` for the counter and `http://localhost:5173/owner-dev/` for the owner app). In Chrome press `F12`, then `Ctrl+Shift+M`, and set 1440×900 (390×844 for phone screens). Put the app next to the PNG from `design/screens`.
7. **Ask for fixes using the screen number.** For example:
   > Screen 03: the "Waiting to pay" panel is narrower than in the image and the timer font is too small. Match design/screens/03-live-board.png and the sizes in design/html/03-live-board.html.

   To show it an image, paste a screenshot (`Win+Shift+S`) into the prompt box, or hold `Shift` and drag the PNG in.
8. **Checks and saving are in the prompt.** Every prompt ends by running `npm run typecheck`, `npm run lint`, `npm test` (and `npm run test:visual` from P05), updating `PROGRESS.md` and committing to Git. After fixes, say "run the checks again and commit".
9. **Read PROGRESS.md.** It says what is done, what is left, and any question for you. Answer the questions before the next step.

If a step is too big for one conversation, say "Stop here, update PROGRESS.md with what is left". Then start a new conversation with "Read PROGRESS.md and continue P07".

---

## 4. The steps

| Step | Prompt | What gets built | Screens | Rough time |
|---|---|---|---|---|
| 0 | `P00-setup.md` | Checks and installs Node.js, Git, every library and the test browser; then the project, two apps (counter and owner), Tailwind, fonts, routing, i18n, tests, mock server | – | half a day |
| 1 | `P01-design-system.md` | Colours, type, buttons, pills, dialogs, keypad, cards, a kit page to see them all | all | 1 day |
| 2 | `P02-table-tiles.md` | Snooker, room, pool, carrom, foosball, ludo and PlayStation tiles in every state | 3–6, 16 | 1–2 days |
| 3 | `P03-data-and-mocks.md` | Types, money helpers, demo clock, mock API with the sample data, live updates | – | 1 day |
| 4 | `P04-counter-shell-and-signin.md` | Counter frame, worker sign-in with sign-in times, lock, auto sign-out | 1, 2, 34 | 1 day |
| 5 | `P05-live-board.md` | Live board, game tabs, waiting-to-pay panel, Urdu board | 3–6 | 1 day |
| 6 | `P06-start-game.md` | Start a game, players, double frame, new player, change type | 7–10, 12 | 1–2 days |
| 7 | `P07-running-game.md` | Table panel, move and swap, discard, dispute, undo, damage, power cut | 11, 13–16 | 1–2 days |
| 8 | `P08-ending-games.md` | Who lost, next frame, over 30 minutes, double end, Century, rooms | 17–23 | 1–2 days |
| 9 | `P09-checkout.md` | Checkout list, bill, part payment and split, discount | 24–27 | 1–2 days |
| 10 | `P10-canteen-expense-day.md` | Canteen sale, drawer expense, players, today's totals, close sheet | 28–33 | 1–2 days |
| 11 | `P11-owner-shell-and-signin.md` | Owner app at the private address, sign-in, sidebar, phone tab bar | 35, 52 | 1 day |
| 12 | `P12-owner-dashboard-reports-activity.md` | Dashboard, reports and charts, activity | 36–38 | 2 days |
| 13 | `P13-owner-sheets.md` | Month folders, days, sheet view, correct an entry | 39–42 | 1–2 days |
| 14 | `P14-owner-players.md` | Players and credit, player page and statement | 43–44 | 1 day |
| 15 | `P15-owner-prices-games.md` | Prices, change price, add a game or table | 45–47 | 1 day |
| 16 | `P16-owner-canteen-expenses-workers-settings.md` | Canteen and stock, expenses, workers and sign-in times, settings | 48–51 | 2 days |
| 17 | `P17-owner-phone.md` | The owner portal on the phone | 52–58 | 1–2 days |
| 18 | `P18-urdu-everywhere.md` | Urdu and right-to-left on every screen | all | 1 day |
| 19 | `P19-visual-qa.md` | Screenshot every route, compare with the images, fix, accessibility | all | 1–2 days |
| 20 | `P20-handover.md` | List of every API call the backend must provide, clean-up, README | – | half a day |

That comes to about 4 to 5 weeks of full-time work for the frontend. The backend (server, database, real money rules) is the next stage. It replaces the mock API without changing the screens.

---

## 5. Checking a screen against its design

- **Open the HTML version.** `design/html/03-live-board.html` opens in Chrome. Set the window to 1440×900; for phone screens use DevTools device mode at 390×844. These files are the exact reference for spacing, font sizes and copy.
- **The automatic check.** From P05 on, `npm run test:visual` opens every finished route at its design size and at the moment that design shows (most counter screens at 9:42 PM on Sat 3 Oct 2026, checkout at 10:20 PM, closing at 3:40 AM; the time for each screen is in `design/screens.json`), takes a screenshot and compares it with the PNG. Small differences are fine; a whole panel missing or moved is not.
- **The demo clock.** The app always starts at the same moment as the designs, so timers and amounts match. To see another moment, add it to the address, for example `/checkout?now=2026-10-03T22:20:00%2B05:00&scenario=checkout`. Turn the demo clock off with `VITE_DEMO_CLOCK=off` when you want the real time.

---

## 6. Tips for working with Claude Code

- **One step per conversation.** Clear between steps. Long conversations get slower and start forgetting the rules.
- **Point at the image.** "Match screen 25" works much better than describing the design in words.
- **Plan first for big steps.** Say "plan first". You can also switch Claude Code to plan mode for the start of a step.
- **If it drifts** (new colours, different words, extra features), say: "Re-read CLAUDE.md and docs/04_DESIGN_SYSTEM.md, then fix screen NN to match the image."
- **If it wants to change a rule,** for example a price calculation, say no unless the owners agreed. The rules live in `docs/02_DECISIONS.md` and `docs/07_RULES_FOR_SCREENS.md`.
- **Commit after every step** so you can always go back (`git log`, `git checkout`).
- **Update the docs first when the owners change something:**
  > The owners changed X. Update docs/02_DECISIONS.md and docs/07_RULES_FOR_SCREENS.md first, then change the screens.

  That way the docs and the app never disagree.

---

## 7. What changed in this version (owners' requests, 12 Oct)

1. **Private owner address.** The owner portal opens only at a secret address, for example `stockers.pk/owner-k7m2q9`. The counter screen has no owner button and no link to it, and the counter app's code does not contain the address. See `docs/08_AUTH_AND_ACCESS.md` and screens 35, 51 and 52.
2. **Two workers, Shabir and Zain,** each with his own PIN (screens 1 and 50).
3. **Sign-in times.** The owners set a daily sign-in time for each worker, for example Shabir 2:00 AM to 10:00 AM and Zain 2:00 PM to 11:00 PM. Outside that time the counter says "Not your time to sign in" (screens 2 and 50). Only the time of day is compared, never the date, and it can cross midnight.
4. **Every action is saved with the name** of who did it: "Started by Zain", "Closed by Shabir". You can see it in Activity, sheet history and expenses (screens 38, 41, 42 and 49).
5. **Expense button on the counter.** A worker records cash taken from the drawer for food, petrol and similar. It comes off the cash the drawer should have, and owners see it with his name (screens 3, 29, 31, 32 and 49).

---

## 8. Still open with the owners

See `docs/11_OPEN_QUESTIONS.md`. None of these block the frontend; the screens use sensible defaults until the answers arrive.
