# 04 · Design system

The tokens live in `design/tokens.css` and `design/tailwind.preset.ts`. The tile CSS used in the approved designs is in `design/tiles.reference.css`. This page explains how to use them.

## 1. Two looks

| | Counter app | Owner portal |
|---|---|---|
| Background | walnut `--c-page #16110D` | light `--o-page #EEF2EF` |
| Text | ivory `--c-text #F3ECDD`, secondary `#B9AC97` | ink `--o-ink #1D1A16`, secondary `#5F5A52` |
| Main action | brass `#E0AE52` with dark text `#1B140D` | green `#1E6B45` with white text |
| Panels | `#211913` with border `#3B2F25` | white cards with border `#DCE3DE`, radius 18 |
| Navigation | top bar plus bottom action bar | walnut sidebar `#211913` (active item `#3A2D21`, bold); phone: white bottom tab bar |
| Designed at | 1440×900 (touch screen) | 1440 wide (fluid); phone 390 wide |

Both use **Barlow** for text and **Barlow Condensed** for numbers (table numbers, timers, the clock, big amounts, stats). Urdu uses **Noto Nastaliq Urdu**. Bundle the fonts locally with `@fontsource/barlow`, `@fontsource/barlow-condensed` and `@fontsource/noto-nastaliq-urdu`, because the club can be offline.

## 2. Type scale

| Use | Counter | Owner (desktop) | Owner (phone) |
|---|---|---|---|
| Page title | 32–34 px / 700 | 32 px / 700 | 24 px / 700 |
| Section title | 20–26 px / 700 | 20–22 px / 700 | 18 px / 700 |
| Body | 17–18 px | 16 px | 15–16 px |
| Secondary | 15 px, colour text-2 | 14–15 px, ink-2 | 13–14 px |
| Buttons | 18–20 px / 600–700 | 16 px / 600–700 | 16–17 px |
| Big numbers | timers 40 px, money 40–88 px (Barlow Condensed 600–700) | stats 40–42 px | 26–56 px |
| Table number on tile | 58 px Barlow Condensed 700, line-height 0.8 | – | – |

Numbers use tabular figures (`font-variant-numeric: tabular-nums`) wherever they tick or line up.

## 3. Spacing, radius, elevation
- Counter page padding 24 px; gaps 12–22 px. Owner main padding 26 px 30 px; gaps 14–18 px.
- Radius: tiles 18, dialogs 26, cards 18, buttons 12–16, inputs 10–12, pills 999.
- Shadows: counter dialogs `0 30px 80px rgba(0,0,0,.55)`; owner side dialogs `0 20px 50px rgba(20,40,80,.12)` with a 2 px blue `#2A6FD6` border.
- Dimmed background behind counter dialogs: page `#0D0A07` with the header at 55 % opacity (see screens 7, 17, 19, 29).

## 4. Touch and states
- Counter: every target is at least **56 px**. Main buttons are 60–80 px. PIN and number keys are **76 px**.
- **A counter control that a PNG draws smaller than 56 px** keeps the drawn size on screen, but its pressable area is still 56 px. *(Answered by the developer after P01.)* The `<button>` is the 56 px box (transparent, no border), the visible shape is drawn inside it at the PNG size, and a negative margin of (56 − drawn) / 2 gives the space back, so nothing else on the screen moves. The focus ring is drawn around the visible shape. The touch-size test measures the button's own box. In code this is the counter-only prop `drawn` on `Button`, `IconButton`, `Chip` and `Segmented` (`src/ui/touch-box.ts`); `LanguageSwitch` always uses it. What the screens draw:

  | Control | Drawn | `drawn` | Screens |
  |---|---|---|---|
  | Language switch buttons | 44 | `LanguageSwitch` (built in) | 1–6 |
  | Filter chips | 48 | `Chip drawn={48}` | 30 |
  | Remove ✕ and the − / + steppers | 48 (52 on the part-payment lines) | `IconButton drawn={48}` (`52`) | 8, 9, 26, 28 |
  | Bell | 52 × 52 | `IconButton drawn={52}` | 3–6 |
  | Lock and the worker chip in the top bar | 52 | `Button drawn={52}` | 3–6, 16 |
  | "Change" (the game on screen 22, the item on screen 28) | 52 on screen 22, 48 on screen 28 | `Button drawn={52}` (`48`) | 22, 28 |
  | The link "Check out first" | 52 | the same rule, as a link | 32 |
  | Choices in a row: "Half each / One pays all / Custom", "Since last zero / This month / All" | 52 | `Segmented size="lg" drawn={52}` | 20, 30 |
  | "Waiting to pay / Owes from before" | 54 | `Segmented size="lg" drawn={54}` | 24 |
  | Resume on a paused tile | 50 | `TileActionButton` | 16 |

  Two drawn controls less than 8 px apart would share a few pixels of pressable area; the later one in the page wins. Keep at least 8 px between them (the kit page checks this).
- Owner: at least **44 px**. Primary buttons are 48 px.
- Selected item on the counter: brass border on background `#33271C` (token `--c-selected`), plus a brass tick circle on option cards. The big option cards of screens 7 and 19 use a **3 px** border (the padding gets 2 px smaller so the card does not grow); smaller selected items such as chips and payment methods use 2 px. *(Corrected in P01 to match the approved screens 7, 25 and 26; this page said 2 px for all.)*
- Selected item in the owner portal: 2 px green border with tint `#E3F0E8`.
- Focus ring: 3 px outline, ivory on the counter, blue `#2A6FD6` in the owner portal, offset 2 to 6 px.
- Disabled: 35–50 % opacity plus `cursor: not-allowed`, and the reason written next to it (for example "Price not set").
- Pressed: background one step lighter (`--c-raised-2`). Never rely on hover.

## 5. Table status (D7, Q2): one rule everywhere

| State | Ring outside the table | Pill (dark, text plus marker) | Surface | Extra |
|---|---|---|---|---|
| Free | 6 px green `#48C07F` | green dot, "Free" | cloth normal | balls or coins set up; "Tap to start a game" in `#BFF0CF` |
| Playing | 6 px red `#F0574F` | red dot, "Playing" | cloth lit (brighter centre) | timer and amount so far |
| Over 30 min | 8 px red with a red glow | small red card, "Over 30 min" | cloth lit | **timer on a solid red card** `#D92D20`, white text, 2 px darker bottom edge |
| Paused | 6 px yellow `#F2C14E` | yellow dot, "Paused" | cloth faded | timer stays; Resume button on the power-cut board |
| Out of order | 3 px dashed grey `#9AA0A6`, offset 3 | grey dot, "Out of order" | striped grey cover over the cloth of a snooker, room or pool table; a ludo board (and so the other games) keeps its picture, with only the dashed ring and the note *(corrected in P02 from screen 5)* | note, for example "Cloth change, marked by Adil at 4:15 PM" |
| Price not set | none | brass dot, "Price not set" | faded | disabled, "Locked until an owner sets the price" |

The ring is `box-shadow: 0 0 0 3px <page>, 0 0 0 6px <status>` (a page-coloured gap, then the colour). The pill is `rgba(10,8,6,.55)` with ivory text.

A **selected** table (`status="selected"` in `05_COMPONENTS.md`: a free table that has been picked) has a 7 px brass `#E0AE52` ring with a `#0D0A07` gap, and the same pill as a free table. *(From the reference CSS, class `r-sel`. No approved screen draws it yet, so check it when a screen needs it.)*

**On light backgrounds (the whole owner portal, screen 54)** the pill is the words on a tinted fill: no border and no dot, 13 px bold, padding `2px 8px`. *(Replaced after P01: the first version used a white pill with a 2 px border.)*

| Status | Text | Fill |
|---|---|---|
| Playing, Over 30 min | `#B42318` (`--sl-play`) | `#FBE7E5` (`--o-red-tint`) |
| Free | `--sl-free-ink` `#147B42` | `#E3F0E8` (`--o-green-tint`) |
| Paused | `--sl-pause-ink` `#966319` | `#FBF1DC` (`--o-amber-tint`) |
| Out of order | `--sl-ooo-ink` `#666D7A` | `#EEF0F2` (`--o-grey-tint`) |
| Price not set | `--o-amber-ink` | `#FBF1DC` |

`--sl-free`, `--sl-pause` and `--sl-ooo` are under 4.5:1 on their own tints (3.75, 3.24 and 4.23), so the text uses the same hues darkened in small steps until each reaches 4.5:1 (4.54, 4.57, 4.56). Red already passes (5.53). `StatusPill.contrast.test.tsx` reads `tokens.css` and checks every pair, so a changed colour fails the test.

## 6. Table tiles (`src/tiles`)

Each tile **is** the object seen from above, with the details laid on top. Exact CSS is in `design/tiles.reference.css`; reference images are screens 3, 4, 5, 6, 16 and 11 (faded in the background).

| Tile | Shape | Key measurements | Free shows | Seen on screens |
|---|---|---|---|---|
| `SnookerTile` | walnut rail (13 px) around green cloth; 6 pockets 22 px; baulk line at 21 % with the D (r 32 px) | min-height of cloth 176 px; cloth padding 13/18/11 px; tile flex-basis 300 px | 10 reds in a four-row triangle at 68 %, pink, black, blue, and brown/green/yellow on the baulk line, cue ball *(10 reds, not 15: corrected in P02 from screen 3)* | 3, 6, 16 |
| `RoomTile` | room wall 3 px `#8A7660`, padding 9 px; snooker table plus a 28 px maroon sofa along one side | number 46 px; label "Room / Rs 1,500/hr" | 10 reds, the blue, pink and black; no baulk colours and no cue ball *(corrected in P02 from screen 3)* | 3, 6, 16 |
| `PoolTile` | dark rail 14 px, blue cloth, 6 pockets 24 px, diamond sights (6 per long rail, 3 per short), head string at 25 % | same as snooker | 15 balls rack (stripes and solids), cue ball at 25 % | 4, 5 |
| `CarromTile` | square (`aspect-ratio: 1`), wood frame 16 px, plywood board, 4 corner pockets 26 px, baselines at 9 %/12.5 % with red ends, centre circle, corner arrows; dark text | content padding 40 px | 19 coins (queen red, white and black rings) in the centre | 5 |
| `FoosballTile` | black cabinet with handles sticking out top and bottom; striped pitch, white lines, goals, 8 rods with red and blue players (faint) | pitch min-height 168 px | – | 5 |
| `LudoTile` | wooden tabletop; 128 px ludo board on the start side, details beside it | board SVG 150×150 viewBox | – | 5 |
| `PlayStationTile` | TV bezel with stand; details on the screen; screen dark when free (controller icon) | screen min-height 156 px | controller icon | 5 |
| `MiniTable` | 58×36 table glyph with the number on the cloth (phone list) | rail 4 px | – | 54 |

**Content on every tile** (`TileContent`):
- **Top row:** big number, a two-line label (kind, then price), and the status pill at the end. The row wraps when narrow.
- **Middle:** game type in bold, with a detail such as "Frame 3, Ali leads 2–0"; then the players ("Ali Raza vs Bilal Ahmed" or "Under Saad Hussain").
- **Bottom:** the timer at the start and the amount at the end; or the call to action for free tables; or the note for out of order.

Text on cloth gets `text-shadow: 0 1px 2px rgba(0,0,0,.55)`. Text on the carrom board is dark `#2A1A0C` with a light halo. Every word on a tile has its shadow (a test measures it on all of them); the status pill and the Resume button have none, as in the design. The contrast numbers for text on the lit cloth ignore the shadow, and the owners approved the look. If the text is hard to read on the real counter screen, the stronger shadow of the foosball pitch (`.ff .ct`: `0 1px 2px rgba(0,0,0,.7), 0 0 6px rgba(0,0,0,.45)`) is the fallback (`11_OPEN_QUESTIONS.md`, question 14).

**How the tiles are built (P02):**
- A tile is a real `<button>` (or a `<div role="group">` when it holds its own buttons). Inside it, `.tile-surface` is the object and carries the status ring; the words (`TileContent`) sit on top. Foosball and PlayStation have a wrapper for the handles and the stand.
- The words on a foosball pitch and on a TV screen sit at the top; the extra height stays empty below them (the approved screens do this). On a snooker, pool or carrom table and on a ludo board the timer and amount sit at the bottom.
- The carrom board is a square. Its status pill always wraps under the number (screen 5).
- The out-of-order dashed ring is drawn on `::after`, so the keyboard focus ring (3 px ivory, offset 6) can still show.
- The timer is a red card only on a frame past 30 minutes. A Century and a room run longer and stay plain (screen 3, tables 3 and R1).
- In Urdu the sofa of a room moves to the other side because it is a flex item (screen 6); the cloth, pockets, baulk line, D, balls, coins and rods do not move.
- Colours are tokens. P02 added the `--tile-*`, `--ov-*` (white and black at a given opacity), ball, coin, foosball, TV, sofa and `--mini-*` tokens at the end of `tokens.css`.

## 7. Shared components (visual)
- **Counter top bar:**
  - Brand ball, "Stockers", sheet number and open time; then the clock (Barlow Condensed 34 px) and date.
  - Language switch, bell with brass count badge, the worker chip (avatar initial, name, "Until 11:00 PM"), and Lock.
- **Counter category tabs:** 56 px pills; the selected one has a brass border, bold label and brass count ("6 of 9 in use").
- **Counter action bar:**
  - Checkout (brass, 64 px), Canteen, Players, Today's totals, **Expense**, Pause all.
  - Then a spacer, "Backed up 9:00 PM", and Close sheet (outlined).
- **Waiting to pay panel:** rows of 64 px showing name, phone tail and what for, with the amount at the end. The total is at the bottom.
- **Counter dialog:** centred, max-width 1000–1060 px, panel colour, border 1 px `#4A3B2E` normally and 2 px red `#A8403A` for warnings, icon ball 64 px on the start side. *(Corrected in P01 to match screens 7 and 19; this page said a 2 px brass border for a normal dialog.)* Width: 1046 px for the standard dialog (screen 7), 1240 px for the two-column ones (screen 8). Cancel is outlined; the main action is brass.
- **Keypad:** 3×4 grid of 76 px keys in Barlow Condensed 36 px, with Clear and Delete. The PIN shows as 4 dots. The amount keypad (screens 10, 26, 29) has 72 px keys and a "00" key instead of Clear. The pad keeps 1-2-3 from the left in Urdu.
- **Owner sidebar:**
  - 240 px wide: brand at the top, then 11 items of 48 px. The active item has a `#3A2D21` background and bold text.
  - Order: Dashboard, Live tables, Sheets, Players and credit, Reports, Games and prices, Canteen, Expenses, Activity, **Workers**, Settings.
- **Owner stat card:** white, radius 18, label 16 px in colour, value in Barlow Condensed 40 px, a 15 px note. Amber variant for warnings.
- **Owner table:**
  - White card with a header row in `#F6F8F7` (14 px, ink-2, 600). Rows have 12–14 px padding and a 1 px `#EEF2EF` divider.
  - Numbers align to the end, with tabular figures. On narrow screens the table scrolls sideways inside its card.
- **Owner side dialog (aside):** sits next to the content on desktop and becomes a bottom sheet on the phone. Blue 2 px border; a title, then fields, an info box, and Cancel plus the main action.
- **Chips (filters):** 40–44 px pills; selected has a 2 px green border with green tint.
- **Toggle:** 54×32 switch, green when on.
- **Phone bottom tabs:** Home, Live, Sheets, Players, More. 60 px tall, active in green and bold.
- **Charts (Recharts):**
  - One hue `#178A4A`; today's bar hatched; the comparison line in blue `#2A6FD6`.
  - Thin marks with 4 px rounded data ends; light gridlines `#EEF2EF`.
  - Direct labels only on the key points; a tooltip on tap or hover.

## 8. Icons
Use lucide-react with stroke 2 and round caps, at 20–24 px in buttons and 30–36 px in dialog icon balls. The pictures in the designs are the same family: lock, bell, wallet, coffee, users, bar chart, pause, file-check, clock, wrench, banknote, search, chevrons and x.

## 9. Motion
Keep it minimal:
- 150 ms colour and transform on press.
- Dialogs fade and scale from 0.98.
- The red-card timer may pulse once when it first turns red. Respect `prefers-reduced-motion`.
- No looping animations on the board: it must stay calm on a counter screen all day.

## 10. Right to left
Use logical properties only (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`). In Urdu, the whole layout mirrors (see screen 6), but table drawings do not mirror. Numbers stay in Western digits; currency is written "250 روپے". See `docs/09_URDU_RTL.md`.
