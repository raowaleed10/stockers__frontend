# P01-design-system · Design system and UI kit

**Goal:** Build the shared, data-free UI components in `src/ui` so every screen can be put together from them, plus a `/dev/kit` page that shows them all in both themes.

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/04_DESIGN_SYSTEM.md` (all of it) and `docs/05_COMPONENTS.md` (the `src/ui` table)

## Look at these screens before you write code
Open each PNG (it is the approved design) and read its HTML for exact sizes, colours and copy.
- Screen 1, Worker sign-in (1440×900, clock 9:42 PM): `design/screens/01-worker-sign-in.png` and `design/html/01-worker-sign-in.html` → `/sign-in`
- Screen 3, Live board (1440×952, clock 9:42 PM): `design/screens/03-live-board.png` and `design/html/03-live-board.html` → `/`
- Screen 7, Start a game: choose the type (1440×900, clock 9:46 PM): `design/screens/07-start-a-game-choose-the-type.png` and `design/html/07-start-a-game-choose-the-type.html` → `/table/t2/start`
- Screen 19, Over 30 minutes: charge double? (1440×900, clock 9:46 PM): `design/screens/19-over-30-minutes-charge-double.png` and `design/html/19-over-30-minutes-charge-double.html` → `/table/t4/end/overtime`
- Screen 25, A player’s bill (1440×900, clock 10:20 PM, scenario `checkout`): `design/screens/25-a-players-bill.png` and `design/html/25-a-players-bill.html` → `/checkout/bilal`
- Screen 26, Part payment (1440×900, clock 10:22 PM, scenario `checkout`): `design/screens/26-part-payment.png` and `design/html/26-part-payment.html` → `/checkout/bilal/part`
- Screen 36, Dashboard (1440×1479, clock 10:30 PM): `design/screens/36-dashboard.png` and `design/html/36-dashboard.html` → `/owner-dev/`
- Screen 43, Players and credit (1440×900, clock 3:45 AM, scenario `closed`): `design/screens/43-players-and-credit.png` and `design/html/43-players-and-credit.html` → `/owner-dev/players`
- Screen 49, Expenses (1440×1127, clock 10:30 PM): `design/screens/49-expenses.png` and `design/html/49-expenses.html` → `/owner-dev/expenses`
- Screen 50, Workers and sign-in times (1440×1078, clock 10:30 PM): `design/screens/50-workers-and-sign-in-times.png` and `design/html/50-workers-and-sign-in-times.html` → `/owner-dev/workers`
- Screen 51, Settings (1440×1936, clock 10:30 PM): `design/screens/51-settings.png` and `design/html/51-settings.html` → `/owner-dev/settings`
- Screen 53, Home (390×1715, clock 10:30 PM): `design/screens/53-home.png` and `design/html/53-home.html` → `/owner-dev/`

## Build
1. Build the components listed in `docs/05_COMPONENTS.md` under "`src/ui`: building blocks", except the charts and the timeline (P12, P16). That means: Button, IconButton, StatusPill, Pill/Chip, Card, StatCard, CounterDialog, SidePanel, OwnerAside, OptionCard, PersonCard, Keypad, PinDots, MoneyText, TimerText, Toggle, Segmented, Field, MoneyInput, TextArea, Select, DataTable, StatementTable, EmptyState, Toast, LanguageSwitch.
2. Each component takes `theme: 'counter' | 'owner'` where the look differs:
   - Counter: dark, brass main action, 56–80 px targets.
   - Owner: light, green main action, 44–48 px targets.
3. Match the screens: dialog look from screens 7 and 19, Keypad and PinDots from 1, OptionCard from 7, StatementTable from 25, StatCard from 36 and 43, OwnerAside from 49 and 50, Toggle and Segmented from 51, the phone versions from 53.
4. `MoneyText` uses `formatRs` from `packages/shared/src/rules/format.ts`:
   - Write `format.ts` now, with the functions in `docs/07_RULES_FOR_SCREENS.md` §1, and tests.
   - In Urdu it shows `1,350 روپے`.
5. Every interactive component:
   - Keyboard focus ring; `aria-label` for icon-only buttons.
   - Dialogs trap focus, close on Escape, and return focus.
6. `/dev/kit` route in both apps (dev only): every component in every variant, English and Urdu side by side.

## Done when
- `/dev/kit` in the counter app and the owner app shows every component, and each one matches the screens listed above.
- Unit tests cover the states of Button, Keypad, StatusPill, MoneyText, TimerText (ticking with the demo clock), StatementTable and Toggle.
- An axe check of `/dev/kit` has no serious issues.

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).


## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run test:visual` for the screens above. Fix everything until they pass.
2. Start the app and compare each screen above with its PNG at the design size. List any difference you could not fix.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P01 Design system and UI kit"`.
