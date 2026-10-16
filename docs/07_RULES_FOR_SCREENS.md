# 07 · Rules the screens show

The backend owns the final numbers. The frontend still needs the same rules to show previews: the amount so far on a tile, "Double frame becomes Rs 500", "Cash in the drawer Rs 12,300 → Rs 11,800". So the rules are written once, as **pure functions in `packages/shared/src/rules`** with unit tests, and the backend reuses them later. Components never do this maths inline.

## 1. Formatting (`format.ts`)

| Function | Example |
|---|---|
| `formatRs(1350)` | `Rs 1,350` (Western grouping; Urdu: `1,350 روپے`) |
| `formatSigned(-50)` | `− 50` (true minus sign U+2212) / `+ 200` |
| `formatTimer(ms)` | `18:42`; from one hour, `1:12:05` |
| `formatClock(iso)` | `9:42 PM` |
| `formatDay(iso)` | `Sat 3 Oct`, long form `Saturday 3 October` |
| `formatSlot({start:'14:00', end:'23:00'})` | `2:00 PM to 11:00 PM` |
| `phoneTail('0300 7654512')` | `•••• 4512` |

## 2. Game charges (`charges.ts`)

| Rule | Function | Worked examples (tests) |
|---|---|---|
| Single frame: the table price, the loser pays (D8) | `frameCharge(price)` | Table 1 → 250; Table 4 → 200 |
| Double frame: 2 × price, split between the losing side (D9) | `doubleCharge(price, losers, split?)` | Table 5 (200) → 400, Imran 200 + Naveed 200; one player alone on a side pays all 400; custom split must add up to the total |
| Over the game's own time limit (Q2, D56): red card at ≥ its `maxMinutes`:00 (30 unless the owners set another); at the end, ask. It applies to every game charged per game: a single frame, a double frame, and a game of pool, foosball, carrom, ludo or PlayStation. **Not** Century or rooms | `isOverLimit(elapsedMs, maxMinutes)` · `isGameOverLimit(game, elapsedMs)` · `gameLimit(game)` · `hasTimeLimit(type)` · `isValidMaxMinutes(n)` · `overtimeOptions(price)` | Limit 30: 34:10 → true, 29:59 → false; limit 20: 20:00 → true; options Rs 200 or Rs 400. Double frame on Table 5 (Rs 400) at 31 min: Rs 400 or Rs 800, and the losing side splits it (Imran 400 + Naveed 400, or custom). A game of pool at Rs 300 with a limit of 20, at 21 min: Rs 300 or Rs 600. A running game keeps the limit it started with when the table's limit changes |
| Century: whole minutes × rate, under one player, no minimum (D11) | `centuryCharge(elapsedMs, rate)` | 42 min 35 s at Rs 15 → **42 × 15 = Rs 630**; 37:05 on the tile → Rs 555 |
| Room: 1 hour minimum, then hourly ÷ 60 × minutes, rounded to the nearest rupee (D12, Q9) | `roomCharge(elapsedMs, hourly)` | 1 h 40 min at 1,500 → **Rs 2,500**; 1 h 12 min at 1,500 → Rs 1,800; 6 min → Rs 1,500 (minimum); 1 h 40 min at 700 → Rs 1,167 |
| Other games: per game, loser pays; locked while the price is null (D13, Q3) | `gameCharge(price)` | price null → cannot start |
| Paused time is not charged (D14) | `elapsed(startedAt, now, pausedMs, pausedAt?)` | paused at 12:04 → stays 12:04 |
| Moved frame keeps the price of the table it started on (open question; default) | – | Table 1 (250) → Table 4: still Rs 250 |
| Undo within 2 minutes with no reason (D16) | `canUndo(startedAt, now)` | 1:42 left → true |
| Change game type within 5 minutes (D17) | `canChangeType(startedAt, now)` | started 9:50, now 9:53 → true, "2 minutes left" |

## 3. Money at checkout (`checkout.ts`)

- **Bill total** = old credit + tonight's charges − advance held (D23, D26).
- **Payment:** the parts in several methods + credit = the bill. When paid > bill, the extra becomes **advance**.
- **Discount** (Q6): whole rupees, more than 0, **not more than the bill total** (old credit plus tonight's charges, less any advance used), with a required reason and an optional note. The new total = total − discount. It is saved with the worker's name, on the statement and in Activity (screen 38).
- **Rounding:** paisa rounds to the nearest rupee, only where division happens (rooms, custom splits).

Worked examples (from the screens):

| Case | Numbers |
|---|---|
| Bilal at 10:20 PM | Old credit 500 + frames 750 + tea ×2 100 = **1,350**. Discount 50 ("Rounded the bill") → **1,300**. Pays cash 600 + Easypaisa 400 = 1,000. **300** goes to credit. |
| Saad | Century 630, advance 200 used → pays **430** |
| Kamran | Old credit 1,100 + half a double 250 → **1,350** |
| Zubair | Frame 200 + frame charged double 400 → **600** at checkout (2 frames, one double) |

## 4. Credit and players (`credit.ts`)
- Credit is old when the oldest unpaid charge is more than **15 days** old (D25). It shows in amber; there is no warning and no block.
- At sheet close, unpaid bills move to credit and are marked "Left without checkout" (D27).
- A player's balance always equals the sum of his statement lines (a test).

## 5. Drawer cash (`drawer.ts`), new on 12 Oct (D53)

```
expected drawer cash = cash received on this sheet − expenses taken from the drawer
difference at close  = counted − expected      (negative = short, positive = extra; a note is required when not 0)
```

| Moment | Numbers |
|---|---|
| Zain adds an expense at 8:15 PM | drawer Rs 12,300 → **Rs 11,800** (screen 29) |
| Today's totals at 10:30 PM | cash received 18,450 − 500 = **Rs 17,950** in the drawer (screen 31) |
| Close at 3:40 AM | received 22,250 − 500 = expected **21,750**; counted 21,550 → **short Rs 200** (screen 32) |

## 6. Sign-in times (`slots.ts`), new on 12 Oct (D51)

```ts
// time of day only; dates are ignored; the end is exclusive; slots may cross midnight
isWithinSlot(now: Date, slot: { start: 'HH:MM'; end: 'HH:MM' }): boolean
minutesUntilSlotEnd(now, slot): number      // for the 10-minute warning
nextSlotStart(now, slot): Date              // "Shabir can sign in from 2:00 AM"
```

| Slot | Now | Result |
|---|---|---|
| Zain 14:00–23:00 | 21:42 | inside, 78 min left |
| Zain 14:00–23:00 | 22:51 | inside, **warning** (9 min left) |
| Zain 14:00–23:00 | 23:00 | outside, signed out |
| Shabir 02:00–10:00 | 21:42 | outside → "Not your time to sign in. Shabir can sign in from 2:00 AM to 10:00 AM." |
| 22:00–06:00 (crosses midnight) | 01:30 | inside |
| 22:00–06:00 | 06:00 | outside |

The server decides with its own clock. The frontend uses these functions only to show the warning and the message.

## 7. Sheets (`sheet.ts`)
- One sheet is open at a time. Close sheet opens the next straight away (D32).
- Games still running move to the new sheet (Q5).
- Earned = received for this sheet + new credit − old credit paid on this sheet.
- Profit (owners only) = earned − expenses − canteen buying cost (Q11).

## 8. Timers on the board
- Show `elapsed()` with `useNow()` (once per second).
- Only the clock text updates each second; do not re-render the whole board. Keep a ticking `<TimerText>` per tile.
- The amount so far on the tile uses the same rules: `frameCharge`, `centuryCharge` or `roomCharge`.
- *As built in P05:* the board itself does not tick. Each `BoardTile` reads the clock (`useNow(1000)`), so only its own tile re-renders: the timer ticks, the amount of a Century or a room grows, and a frame turns into the red card at 30:00. The red card follows `tableStatus` (a frame past 30 minutes), and the timer takes its variant from the status, so the pill, the ring and the timer always agree.
- *Where the words on a tile come from:* the "Frame 3, Ali leads 2–0" detail is `sessionStanding(game, session, now)` (only frames that have ended count; no leader gives just "Frame 3"); the tab counts are `boardTabs(categories)` (snooker tables and rooms are one tab); the waiting list's total is `waitingTotal(bills)` and its "what for" line is built from `billParts(lines)`. All four are pure functions in `packages/shared/src/rules`.

