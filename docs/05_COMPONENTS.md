# 05 · Components

Shared, data-free components live in `apps/web/src/ui` and `apps/web/src/tiles`. Screens compose them; screens get data through hooks. Props below are the minimum; add what you need, but keep names.

## `src/ui`: building blocks

| Component | Props (TypeScript) | Used on screens |
|---|---|---|
| `Button` | `variant: 'primary' \| 'secondary' \| 'outline' \| 'danger' \| 'ghost'`, `size: 'counter-main' \| 'counter' \| 'owner' \| 'owner-sm'`, `theme: 'counter' \| 'owner'`, `icon?`, `children` | everywhere |
| `IconButton` | `label` (required, becomes aria-label), `icon`, `size`, `badge?: number` | top bars, close buttons |
| `StatusPill` | `status: TableStatus`, `label?` (override text, e.g. Urdu), `tone: 'dark' \| 'light'` | tiles, phone list, table panel |
| `Pill`/`Chip` | `selected`, `onClick`, `children`, `size`, `theme` | filters, reasons, categories |
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

## Rules for components
- `ui` and `tiles` never fetch data and never read the clock directly (`TimerText` uses `useNow()`, which is allowed).
- All text comes in through props or `t()`; no English hard-coded inside shared components.
- Every interactive component works with a keyboard and has a visible focus ring.
- Add a Vitest + Testing Library test for each component's states, plus the gallery or kit page for visual checks.
