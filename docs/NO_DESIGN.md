# Built without an approved design

Every piece of the app that was built **without an approved PNG**. The owners approved 58 screens; these parts are
not on any of them, so they were built from approved parts and the words already in the docs. Each one has the place
to see it, the words on it, and a screenshot. Send this file and the pictures to the owners in one batch.

- **Screenshots:** `docs/no-design/<id>.png`. They are made by `npm run shots:no-design` (it needs `npm run dev`
  running). Run it again after a change, and commit the new pictures.
- **To add a piece:** whenever you build something without a PNG (a state, a banner, a panel, a message), add a section
  here with its route, its words and a screenshot, and add its entry to `tests/no-design/no-design.counter.spec.ts`
  (or the owner version when there is one). A test, `src/no-design-doc.test.ts`, fails if a picture has no section or a
  section has no picture. The rule is also in `CLAUDE.md`.
- **Routes** are the development ones: the counter at `http://localhost:5173`, and `?now=` sets the demo clock
  (`docs/10_TESTING_AND_QA.md`).

| # | Piece | App | Built in |
|---|---|---|---|
| 1 | [Sign-in time banner](#1-sign-in-time-banner) | counter | P04 |
| 2 | [Switch worker offer](#2-switch-worker-offer) | counter | P04 |
| 3 | [Alerts panel (the bell)](#3-alerts-panel-the-bell) | counter | P04 answers |
| 4 | [Alerts panel with nothing in it](#4-alerts-panel-with-nothing-in-it) | counter | P04 answers |
| 5 | [Wrong PIN on the sign-in page](#5-wrong-pin-on-the-sign-in-page) | counter | P04 |
| 6 | ["Wait 5 minutes" on the sign-in page](#6-wait-5-minutes-on-the-sign-in-page) | counter | P04 |
| 7 | [The sign-in page when the workers cannot be loaded](#7-the-sign-in-page-when-the-workers-cannot-be-loaded) | counter | P04 |
| 8 | [Wrong PIN on the lock screen](#8-wrong-pin-on-the-lock-screen) | counter | P04 |
| 9 | [Foosball, carrom, ludo and PlayStation before a price is set](#9-foosball-carrom-ludo-and-playstation-before-a-price-is-set) | counter | P05 |
| 10 | [The board when the tables cannot be loaded](#10-the-board-when-the-tables-cannot-be-loaded) | counter | P05 |
| 11 | [Waiting to pay with nobody waiting](#11-waiting-to-pay-with-nobody-waiting) | counter | P05 |
| 12 | [The pages of pool, carrom, foosball, ludo and PlayStation once prices are set](#12-the-pages-of-pool-carrom-foosball-ludo-and-playstation-once-prices-are-set) | counter | P05 answers |

Below the numbered pieces there are also [the approved screens that change](#approved-screens-that-change-a-field-or-a-word) (the maximum time of a game). Those are built in P15 and P16, so they have no picture yet.

## 1. Sign-in time banner

- **What:** a strip across the top of every counter screen, from 10 minutes before a worker's sign-in time ends. It
  has no button: it goes when the worker is signed out at the end of his time.
- **Where:** any counter screen at that time, for example `/?now=2026-10-03T22:51:00%2B05:00` (Zain's time ends at 11:00 PM).
- **Words:** "Your sign-in time ends at 11:00 PM. Finish what you are doing." (the words are in `docs/08` §3).
  Urdu: "آپ کے سائن اِن کا وقت رات 11:00 پر ختم ہو رہا ہے۔ جو کام کر رہے ہیں وہ ختم کر لیں۔"
- **Built from:** the amber warning colours of screens 25 and 26.

![Sign-in time banner](no-design/session-banner.png)

## 2. Switch worker offer

- **What:** a small box under the worker chip in the top bar. Tapping the chip ("Zain, Until 11:00 PM") offers one
  button, "Switch worker", which signs the worker out and shows the sign-in page. A tap outside it, or Escape, closes it.
- **Where:** any counter screen, for example `/`; tap the worker chip.
- **Words:** "Switch worker" (from screen 34). Urdu: "کارکن بدلیں".
- **Built from:** the colours of the counter panels; the button is 56 px tall like every counter button.

![Switch worker offer](no-design/switch-worker-offer.png)

## 3. Alerts panel (the bell)

- **What:** tapping the bell opens a panel on the end side of the screen (the right in English, the left in Urdu), with
  the board dimmed behind it. It lists the counter's own alerts, newest first: a title, one line of text, the time at
  the end of the row, and an amount if the alert has one. An unread alert has a dot. "Mark all read" is in the
  header; closing the panel (the X, or Escape) goes back to the board. It shows **counter alerts only**, never the
  owners' notifications.
- **Where:** `/alerts`, or tap the bell on any counter screen.
- **Words:** "Alerts", "Mark all read". Urdu: "اطلاعات", "سب پڑھی ہوئی کریں". The titles and lines come from the club's
  data (for example "Chips running low", "3 left. Cigarette packs are sold out.").
- **Built from:** the counter side panel of screen 11 and the alert rows of screen 58 (the bar at the start of a row
  says what kind of alert it is). The owners' answer of 15 Oct 2026 describes it.

![Alerts panel](no-design/alerts-panel.png)

## 4. Alerts panel with nothing in it

- **What:** what the panel says when there are no alerts, and "Mark all read" has nothing to do.
- **Where:** `/alerts` when the list is empty. (The picture is made with the list answered empty.)
- **Words:** "No alerts yet". Urdu: "ابھی کوئی اطلاع نہیں".

![Alerts panel with nothing in it](no-design/alerts-panel-empty.png)

## 5. Wrong PIN on the sign-in page

- **What:** after a wrong PIN the four dots shake once and empty, and the line above them changes to the message, in red.
- **Where:** `/sign-in`, pick Zain, type 9999.
- **Words:** "Wrong PIN. Try again." (from `docs/08` §3). Urdu: "پن غلط ہے۔ دوبارہ کوشش کریں۔"

![Wrong PIN on the sign-in page](no-design/sign-in-wrong-pin.png)

## 6. "Wait 5 minutes" on the sign-in page

- **What:** after 5 wrong PINs the keypad stops for 5 minutes and the line above the dots says so.
- **Where:** `/sign-in`, pick Zain, type 9999 five times.
- **Words:** "Wait 5 minutes" (from `docs/08` §3). Urdu: "5 منٹ انتظار کریں".

![Wait 5 minutes on the sign-in page](no-design/sign-in-wait-5-minutes.png)

## 7. The sign-in page when the workers cannot be loaded

- **What:** if the list of workers does not load, the page says so and has a button to try again.
- **Where:** `/sign-in` when the club's computer cannot reach the server. (The picture is made with that call failing.)
- **Words:** "Could not load the workers.", "Try again". Urdu: "کارکنوں کی فہرست نہیں کھل سکی۔", "دوبارہ کوشش کریں".

![The sign-in page when the workers cannot be loaded](no-design/sign-in-workers-error.png)

## 8. Wrong PIN on the lock screen

- **What:** the same message as the sign-in page, under the keypad of the lock screen (it does not move the keys).
- **Where:** `/?locked=1`, type 0000.
- **Words:** "Wrong PIN. Try again." Urdu: "پن غلط ہے۔ دوبارہ کوشش کریں۔"

![Wrong PIN on the lock screen](no-design/lock-wrong-pin.png)

## 9. Foosball, carrom, ludo and PlayStation before a price is set

- **What:** screen 4 draws this only for pool. The other four games get the same page while their price is not set: the
  amber box, the locked tiles (the picture of each game, "Price not set", and "Locked until an owner sets the price"), and
  the two cards under them. Tapping a locked tile does nothing. Once an owner sets the prices the page shows the
  tiles as screen 5 draws them (a grid for each game, with no banner and no cards).
- **Where:** `/board/foosball`, `/board/carrom`, `/board/ludo`, `/board/playstation` (the picture shows foosball).
- **Words:** the title is "{games} have no price yet": "Foosball tables have no price yet", "Carrom boards have no price
  yet", "Ludo boards have no price yet", "PlayStation screens have no price yet". The line under it is the one on screen 4
  with "tables", "boards" or "screens" in it: "An owner sets the price in Games and prices. Until then these boards cannot
  be started." The two cards are word for word the ones on screen 4. Urdu: see `docs/URDU_TO_CHECK.md`.
- **Built from:** screen 4 (the banner, the locked tile, the two cards) and the tiles of screen 5.

![Foosball before a price is set](no-design/board-foosball-no-price.png)

## 10. The board when the tables cannot be loaded

- **What:** if the club's computer cannot reach the server, the board area says so and has a button to try again. While
  the tables are loading it says "Loading the tables…" in the same place. The top bar and the action bar stay.
- **Where:** `/` when the board call fails. (The picture is made with that call failing.)
- **Words:** "Could not load the tables.", "Try again", "Loading the tables…". Urdu: "ٹیبلز نہیں کھل سکے۔",
  "دوبارہ کوشش کریں", "ٹیبلز کھل رہے ہیں…".
- **Built from:** the same message and button as the sign-in page that cannot load the workers (section 7).

![The board when the tables cannot be loaded](no-design/board-error.png)

## 11. Waiting to pay with nobody waiting

- **What:** the "Waiting to pay" panel keeps its title, says "0 players", and says that nobody is waiting. The total
  line is not shown, because there is nothing to add up.
- **Where:** `/` when every bill is paid, for example `/?scenario=closed` (3:45 AM, after the sheet was closed).
- **Words:** "Nobody is waiting to pay". Urdu: "کسی کی ادائیگی باقی نہیں".
- **Built from:** the panel of screen 3.

![Waiting to pay with nobody waiting](no-design/waiting-panel-empty.png)

## 12. The pages of pool, carrom, foosball, ludo and PlayStation once prices are set

- **What:** no PNG draws the real page of these games with prices set (screen 5 is a preview, with a heading for each game).
  Once an owner has set the prices, `/board/<game>` shows that game's tiles in the grid of screen 5 under the tabs: no
  heading (the selected tab already names the game), no amber box and no cards. A table that still has no price stays
  locked with "Price not set". There is no waiting list on these tabs, as on screens 4 and 5.
- **Where:** `/board/carrom`, `/board/pool`, `/board/foosball`, `/board/ludo`, `/board/playstation` after the prices are set
  (the picture is made with Rs 50 on every carrom board).
- **Words:** the ones on the tiles of screen 5: "Carrom", "Rs 50 a game", "Tap to start", "The loser pays the game".
  Urdu: see `docs/URDU_TO_CHECK.md`.
- **Built from:** the tiles and the grid of screen 5 and the tab bar of screen 3.

![Carrom boards once the price is set](no-design/board-priced-carrom.png)

## Approved screens that change a field or a word

These are changes to screens the owners already approved. They are built in P15 and P16 (the owner screens), so there is no
picture yet; each one is listed here so the owners see it with the rest of the batch. They come from the owners' answer of
16 Oct 2026 (decision D56, `docs/02`).

### Screen 45, Games and prices: "Max 30 min" next to each price

- **Change:** every price that belongs to a game charged per game (a snooker table, pool, foosball, carrom, ludo, PlayStation)
  also shows its maximum time, for example "Rs 250 a frame · Max 30 min". A room has none.
- **Words:** "Max {{n}} min". Urdu: "زیادہ سے زیادہ {{n}} منٹ".

### Screen 46, Change a price: a "Maximum time" field next to the price

- **Change:** a number field "Maximum time" (whole minutes, 5 to 180) beside the price. "Also these tables" applies to both.
  Saving it is written in Activity with the owner's name ("Maximum time changed: Table 4, 30 min to 20 min. Games already
  started keep their limit."). A change applies to games started after it; a running game keeps the limit it started with.
- **Words:** "Maximum time", "minutes", and the error "The maximum time is a whole number of minutes from 5 to 180."
  Urdu: "زیادہ سے زیادہ وقت", "منٹ".

### Screen 47, Add a game or table: the same field

- **Change:** the new table gets a "Maximum time" field, filled in with the starting value from screen 51 (not for a room).

### Screen 51, Settings: the old line becomes a starting value

- **Change:** "Ask to charge double after 30 minutes" is now the starting maximum time for games added later (screen 47 fills
  it in). Tables that exist keep their own. The number is changeable (5 to 180 whole minutes).
- **Words:** the label becomes "Maximum time for new games" with the note "Each game's own maximum time is set with its
  price." Urdu: "نئے کھیلوں کا زیادہ سے زیادہ وقت".

### Screens 3 to 6, 16 and 34: the words for "over the limit"

- **Change:** the red card, the pill and the "charge double?" choice now follow each game's own limit, not always 30
  minutes. The pill says "Over 20 min" (Urdu "20 منٹ سے زیادہ"), and a table's screen reader name says "over 20 minutes".
  The lock screen (34) says "1 over 30 min" when the games over their limit share one limit, and "2 over the limit"
  (Urdu "حد سے زیادہ: 2") when they do not. A pill that is not told the limit says "Over the limit".
- **Applies to:** a single frame, a double frame, and a game of pool, foosball, carrom, ludo and PlayStation. Not Century or
  rooms, which are charged by the minute.

