# 05 · Components

Shared, data-free components live in `apps/web/src/ui` and `apps/web/src/tiles`. Screens compose them; screens get data through hooks. Props below are the minimum; add what you need, but keep names.

## `src/ui`: building blocks

| Component | Props (TypeScript) | Used on screens |
|---|---|---|
| `Button` | `variant: 'primary' \| 'secondary' \| 'outline' \| 'danger' \| 'ghost'`, `size: 'counter-main' \| 'counter' \| 'owner' \| 'ownerSm'`, `theme: 'counter' \| 'owner'`, `icon?`, `children` | everywhere |
| `IconButton` | `label` (required, becomes aria-label), `icon`, `size`, `badge?: number` | top bars, close buttons |
| `StatusPill` | `status: TableStatus`, `label?` (override text, e.g. Urdu), `tone: 'dark' \| 'light'` | tiles, phone list, table panel |
| `Chip` (the "Pill/Chip" of this table) | `selected`, `onClick`, `children`, `size`, `theme` | filters, reasons, categories |
| `Card` | `tone: 'plain' \| 'amber' \| 'blue' \| 'green'`, `padding` | owner everywhere |
| `StatCard` | `label`, `value`, `note`, `tone` | 31, 36, 37, 43, 48, 49 |
| `CounterDialog` | `title`, `kicker?`, `icon?`, `tone: 'normal' \| 'warning'`, `actions`, `onClose`, `children` | 7–10, 12–15, 17–23, 27, 29 |
| `SidePanel` | `title`, `onClose`, `children` (counter right panel, 560–640 px) | 11 |
| `OwnerAside` | `title`, `children`, `actions` (blue-bordered side dialog; bottom sheet on phone) | 42, 46, 48, 49, 50 |
| `OptionCard` | `title`, `description`, `value` (big), `selected`, `badge?` ("Now") | 7, 12, 19, 22 |
| `PersonCard` | `name`, `phoneTail`, `note?`, `selected`, `status?` | 8, 9, 13, 15, 17, 20 |
| `Keypad` | `onDigit`, `onClear`, `onDelete`, `keys?` (adds "00") | 1, 10, 26, 34 |
| `PinDots` | `filled: 0..4` | 1, 34 |
| `MoneyText` | `value: number` (rupees), `size`, `strike?` → "Rs 1,350" or "1,350 روپے" | everywhere |
| `TimerText` | `startedAt`, `pausedMs`, `endedAt?`, `variant: 'plain' \| 'redCard'` (uses `useNow()`) | tiles, 11, 16 |
| `Toggle` | `checked`, `onChange`, `label` | 51 |
| `Segmented` | `options`, `value`, `onChange` (language, AM/PM) | 1, 50, 51 |
| `Field`, `MoneyInput`, `TextArea`, `Select` | label always visible above, error text below | owner forms, 15, 29 |
| `DataTable` | `columns`, `rows`, `align`, `stickyHeader`, `zebra` | 41, 42, 43, 48, 49, 38 |
| `StatementTable` | `lines: StatementLine[]`, `editable?` (owners: pencil per line) | 25, 30, 44, 56 |
| `EmptyState` | `title`, `action?` | lists |
| `Toast` | `message`, `action?` ("Undo, 1:56 left") | 14, 18 |
| `LanguageSwitch` | `value: 'en' \| 'ur'` | 1, 3, 51, 52 |
| `WorkerChip` | `worker`, `until` ("Until 11:00 PM"), `onSwitch` | counter top bar |
| `CounterTopBar` | `sheet`, `now`, `notifications`, `worker`, `onLock` | 3–6, 16 |
| `CounterActionBar` | `onCheckout`, `onCanteen`, `onPlayers`, `onToday`, `onExpense`, `onPauseAll`, `onCloseSheet`, `backedUpAt` | 3–6 |
| `CategoryTabs` | `categories: {id,label,inUse,total,selected}[]` | 3–6 |
| `OwnerSidebar` | `active`, `owner` (name, language switch at bottom) | 36–51 |
| `PhoneTopBar`, `PhoneTabBar` | `title?`, `back?`, `badge?` / `active` | 52–58 |
| `BarChartDays`, `LineChartMonth`, `BusyHours`, `HBarList` | thin wrappers on Recharts with the tokens | 36, 37, 49, 53 |
| `SignInTimeline` | `workers: {name, slot: {start, end}}[]`, `now` (24 h bar, gaps hatched) | 50 |
| `TimeSlotPicker` | `value: {start:'HH:MM', end:'HH:MM'}`, `onChange` (hour, minute, AM/PM; crosses midnight) | 50 |

### As built in P01 (read this before using the components)

All of the above exist in `src/ui` except the charts, the timeline, and the top bars, action bar, tabs and sidebars (P04, P05, P11, P12, P16, P17). What differs from the table:

- **`Button` size is `'ownerSm'`, not `'owner-sm'`.** `Button` is shared, so it is in the counter bundle, and `check:bundles` forbids the text `owner-` there.
- `theme` is required on every component whose look differs. `Keypad`, `PinDots`, `OptionCard`, `PersonCard`, `CounterDialog` and `SidePanel` are counter-only; `OwnerAside` is owner-only.
- `Chip` is the only "Pill/Chip" component (there is no static pill). `size` is `'md' | 'lg'`.
- `StatusPill` uses `TableStatus`, now in `packages/shared/src/types.ts` (`free | playing | over30 | paused | outOfOrder | noPrice`). `tone="dark"` (the counter and the tiles) has a marker and words; `tone="light"` (the owner portal) is the words on a tinted fill with no border and no marker, as on screen 54 (colours in `04_DESIGN_SYSTEM.md` §5).
- **`drawn` (counter only) on `Button`, `IconButton`, `Chip` and `Segmented`:** `drawn={44 | 48 | 50 | 52 | 54}` keeps the height a screen draws while the pressable box stays 56 px (`src/ui/touch-box.ts`, table of sizes in `04_DESIGN_SYSTEM.md` §4). The `<button>` is the box and carries `data-drawn`; the shape inside it is `[data-visible]` and carries the look and the focus ring. Pass `className` for layout (it goes on the box); the look cannot be changed from outside. `LanguageSwitch` is always drawn at 44 on the counter. Without `drawn`, nothing changes. The owner look ignores it.
- `Keypad`: `keys?: 'pin' | 'amount'` (`'amount'` adds `00` and has no `onClear`).
- `CounterDialog` adds `lead` (big number), `subtitle`, `titleSize`, `size`, `showClose` and `static` (draw in place, for the kit). `SidePanel` and `OwnerAside` also take `static`. `OptionCard` adds `layout: 'type' | 'price'` and `tone: 'danger'`. `PersonCard` adds `variant: 'row' | 'tile' | 'large'`.
- `DataTable` needs `caption` (the screen-reader name) and `getRowKey`; columns take `nowrap`. `StatementTable` takes `caption`, `variant: 'bill' | 'statement'`, `showDoneBy` and `footer`. A scrolling table is a focusable region, so keyboard users can scroll it.
- `Field` takes its control as a function: `{(control) => <MoneyInput {...control} />}`. `TextInput` was added next to `MoneyInput`, `TextArea` and `Select`.
- `Card` and `StatCard` also take the counter theme (the dark boxes on screens 25, 26 and 31) and the tones `soft`, `solid` and `dark`.
- `TimerText` switches to the red card by itself at 30:00 (`variant: 'auto'`, the default).
- Dialogs: `useDialog` (`src/ui/use-dialog.ts`) traps focus, closes on Escape and returns focus. `OwnerAside` is a bottom sheet below 768 px.

## `src/tiles`: table tiles (see `04_DESIGN_SYSTEM.md` §6)

```ts
type TileProps = {
  status: 'free' | 'playing' | 'over30' | 'paused' | 'outOfOrder' | 'noPrice' | 'selected';
  number: string;                 // "1", "R1", "8"
  label: [string, string];        // ["Table", "Rs 250 a frame"]
  pillLabel?: string;             // overrides the status text (Urdu)
  gameLine?: { main: string; detail?: string };   // "Single frame", "Frame 3, Ali leads 2–0"
  players?: { a: string; b?: string; under?: boolean }; // "Ali Raza vs Bilal Ahmed" | "Under Saad Hussain"
  timer?: React.ReactNode;        // <TimerText/>
  amount?: number;
  cta?: { title: string; hint?: string };          // free tables
  note?: { title: string; detail?: string };       // out of order
  trailing?: React.ReactNode;     // e.g. Resume button on the power-cut board
  as?: 'button' | 'div';          // div when it contains its own buttons
  onPress?: () => void;
  ariaLabel: string;              // "Table 4, over 30 minutes"
};
```

Export: `SnookerTile`, `RoomTile`, `PoolTile`, `CarromTile`, `FoosballTile`, `LudoTile`, `PlayStationTile`, `MiniTable`, and `GameTile` (picks the right one from `game.kind`). Build a **tile gallery** route (`/dev/tiles`, dev only) that shows every tile in every state, in English and Urdu.

### As built in P02 (read this before using the tiles)

Built: `SnookerTile`, `RoomTile`, `PoolTile`, `CarromTile`, `FoosballTile`, `LudoTile`, `PlayStationTile`, `GameTile` (`kind: TableKind` plus the tile props), `MiniTable`, `TileContent`, and `TileActionButton`. Import from `@/tiles`. The gallery is at `/dev/tiles` (counter app, development only). What differs from the table above:

- **More props:** `lockReason` (why a table is locked; the tile is then disabled and the reason is its accessible description), `className` (the flex or grid size from the page, for example `flex-[1_1_300px] min-w-0`), `cta.title` is optional (the power-cut board shows only the hint), and `note.title` is optional (without it the detail is drawn larger, as for "Dice missing").
- **`as="div"`** makes the tile `<div role="group">` with the same name and no press. Put `TileActionButton` (the Resume button of screen 16, drawn 50 px inside a 56 px box) in `trailing`.
- **Words:** `label`, `gameLine`, `cta`, `note`, `lockReason` and `pillLabel` are written by the caller, already translated. "vs" and "Under" come from the `tile.versus` and `tile.under` words in `common` (in Urdu "Under" goes after the name: "سعد حسین کے نام").
- **Timer:** pass a `<TimerText/>`. Use `variant="redCard"` or `"auto"` only for a frame; a Century and a room use `variant="plain"`, because the red card means "a frame has run over 30 minutes" (screen 3). On the power-cut board the timer is yellow: add `className="text-tile-frozen"`.
- **Amount:** pass whole rupees in `amount`; the tile writes it with `MoneyText`, so Urdu reads "250 روپے".
- **`status`:** `STATUS_LOOK` in `status.ts` is the one table of what each status looks like (ring, cloth, pill, locked, striped). A selected table looks like a free one with a brass ring.
- **`MiniTable`** (`number`, `status`, `room`): the 58 × 36 glyph of screen 54. It is hidden from screen readers; the row names the table in words. It is not in the counter bundle unless a counter screen imports it.
- **Tokens:** all colours are tokens (`--tile-*`, `--ov-*`, balls, coins, foosball, TV, sofa, `--mini-*`); the drawings are in `src/tiles/tiles.css` and `layout.ts` (where the balls, coins and rods go).

### As built in P04 (the counter frame, sign-in and lock)

These are counter screens, so they are in `src/counter`, not `src/ui`.

- **`components/`:** `CounterFrame` (banner, top bar, `<Outlet/>`, action bar, idle lock, lock screen), `CounterTopBar` (`sheet`, `notifications`, `worker`, `until`, `onLock`, `onSwitchWorker`, `onNotifications?`), `WorkerChip` (`worker`, `until`, `onSwitch`), `CounterActionBar` (the seven `on…` callbacks of the table above, and `backedUpAt`), `SessionTiming` (the 10-minute banner and the end-of-time check), `IdleLock`, `LockScreen`, `ClockPanel`, `WorkerCards`, `NotYourTimeAlert`, `BigClock`, `Brand`, `WorkerAvatar`, `CounterLanguageSwitch`, `TopBarButton`, `RichText`.
- **`session/`:** `RequireWorker` (the route guard), `lock-store` (Zustand, kept in `sessionStorage`), `idle` (the 5 minutes and the dev-only `?lockAfter`), `use-leave-session` (`useSwitchWorker`).
- **The bell, the worker chip and Lock are not `IconButton` or `Button`.** The top bar draws them with 12 px corners, a 16 px Lock label and a badge inside the corner, so `TopBarButton` builds the same 56 px box with a 52 px shape (the `drawn` rules, docs/04 §4) with the top bar's own look. The action bar buttons are plain buttons for the same reason (64 px, 22 px side padding, 18 px text).
- **`Keypad keys="lock"`** (80 px keys, `onSwitch`) and **`PinDots shake`** are new in `src/ui`. Give `PinDots` a new `key` to shake again.
- **`RichText`** renders a counter word that has a time, a name or bold text in it (`<ltr>`, `<name>`, `<b>`), so times and names keep their order inside Urdu. Plain words use `t()`.
- **`.screen-text`** (in `base.css`) gives a screen the design's own line height; put it on the root of a counter screen. Urdu keeps its tall lines.
- **`AlertsPanel`** (the bell, `/alerts`): `SidePanel` with its new `actions` slot ("Mark all read" before the close button), 560 px on the end side, the board dimmed behind it, one row for each counter alert. `CounterAlert` has an optional `amount`. A row of alert data has `dir="auto"`, so English text inside an Urdu page keeps its full stops. Details and the other pieces without a PNG: `docs/NO_DESIGN.md`.
- **`useFormat()`** (`src/lib/use-format.ts`) gives `clock`, `day`, `slot` and `parts` in the page language. Use it, not `formatClock` directly, in a component.
- **Shared rules for the board (P05 reuses them):** `tableStatus(table, now)` and `summarizeTables(tables, now)` in `packages/shared/src/rules/board.ts`. A paused table counts with "playing"; a table with no price is left out.

### As built in P05 (the live board)

All counter-only, so in `src/counter`, not `src/ui`.

- **`screens/Board.tsx`** is the layout route of `/` and `/board/:category`. It draws `CategoryTabs`, the page, and an `<Outlet/>` **last, inside a `relative` box that fills the area between the two bars**, so the bell's panel (`/alerts`) and later the table panels draw over the finished board. While a panel is open the board behind it is `inert` and `aria-hidden`. `/` calls `useBoard()` and shares its query with the frame, so the board is asked for once. `/board/snooker` and `/board/room` redirect to `/`; an unknown game type shows "Page not found".
- **`components/`:** `CategoryTabs` (`tabs`, `selectedId`, `onSelect`), `BoardTile` (one `BoardTable` → `GameTile`; reads the clock itself), `WaitingPanel` (`bills`, `onOpen`), `BillWords` and `bill-words.ts` (the "what for" line from `BillPart`s; `canteenWords`, `partWords`), `PriceBanner`, `LookBanner` and `InfoCard` (`InfoBanner.tsx`), `TileRow`, `TileGrid` and `TILE_FLEX` (`TileGrid.tsx`: the board's wrapping row with 22 px gaps and the 26 px grids of screen 5).
- **`BoardTile`** does not take the words from the caller: it writes the label, price, game line, detail, hint, note and aria name from the table, the players and the page language (`locales/{en,ur}/board.json`). Press: free → `/table/:id/start` (`/room/:id/start` for a room), running or paused → `/table/:id`. A table out of order or with no price has no press, and the tile itself ignores a tap on it (`TileFrame`: `aria-disabled`, its note or lock reason as description; the out-of-order tile stays focusable, the no-price tile is `disabled`).
- **The widths are the design's.** The design HTML has no CSS reset, so its 640 px section and 320 px aside are content-box widths (652 and 358 px wide). `Board` and `WaitingPanel` use `box-content` on those two flex items to get the same 319 px tiles and 358 px panel.
- **Urdu:** `rtl:` utilities carry screen 6's own spacing (tabs 12/4 px, panel 14/18 px, text 17/16/13 px, line height 1.7). The top bar (10 px) and the action bar (12/16 px, 19 and 17 px text) got the same `rtl:` overrides. Only the selected tab shows its count in Urdu.
- **`/dev/games-preview`** (`screens/dev/GamesPreview.tsx`, development only) is screen 5: the tabs with none selected, `LookBanner`, and five sections, using the gallery's `SCREEN_5` samples and `Sample` (`src/dev/tiles/Sample.tsx`, moved out of `TilesPage`). Its three dev words are in `src/dev/locales/{en,ur}/preview.json`.
- **`CounterFrame`** now gives a locked screen exactly the height of the screen (`h-screen overflow-hidden`), because a board taller than the screen scrolls and the lock must not.
- **Shared rules added:** `boardTabs`, `SNOOKER_TAB`, `sessionStanding` (`rules/board.ts`); `billParts`, `waitingTotal` (`rules/checkout.ts`); `BillPart`, `WaitingBill.parts` and `StatementLine.item` (types).

## Rules for components
- `ui` and `tiles` never fetch data and never read the clock directly (`TimerText` uses `useNow()`, which is allowed).
- All text comes in through props or `t()`; no English hard-coded inside shared components.
- Every interactive component works with a keyboard and has a visible focus ring.
- Add a Vitest + Testing Library test for each component's states, plus the gallery or kit page for visual checks.
