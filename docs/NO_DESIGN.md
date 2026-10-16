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
| 13 | [Mark out of order: the note](#13-mark-out-of-order-the-note) | counter | P06 |
| 14 | [A table that cannot be started](#14-a-table-that-cannot-be-started) | counter | P06 |
| 15 | [Starting pool, foosball, carrom, ludo and PlayStation](#15-starting-pool-foosball-carrom-ludo-and-playstation) | counter | P06 |
| 16 | [Starting a Century: one player](#16-starting-a-century-one-player) | counter | P06 |
| 17 | [The players screen before anything is typed](#17-the-players-screen-before-anything-is-typed) | counter | P06 |
| 18 | [Add a new player: the number is not whole](#18-add-a-new-player-the-number-is-not-whole) | counter | P06 |
| 19 | [Change the game type: who plays after the change](#19-change-the-game-type-who-plays-after-the-change) | counter | P06 |
| 20 | [The panel of a Century, a room or a double](#20-the-panel-of-a-century-a-room-or-a-double) | counter | P07 |
| 21 | [The panel in the first 5 minutes: Change game type](#21-the-panel-in-the-first-5-minutes-change-game-type) | counter | P07 |
| 22 | [Move a room, and the players to pick from](#22-move-a-room-and-the-players-to-pick-from) | counter | P07 |
| 23 | [Stop a frame: the dispute and the cancel](#23-stop-a-frame-the-dispute-and-the-cancel) | counter | P07 |
| 24 | [Damage charge: nothing picked yet](#24-damage-charge-nothing-picked-yet) | counter | P07 |
| 25 | [Undo done](#25-undo-done) | counter | P07 |
| 26 | [Pause all from the action bar](#26-pause-all-from-the-action-bar) | counter | P07 |
| 27 | [Put a table back in order](#27-put-a-table-back-in-order) | counter | P07 answers |
| 28 | [A table an owner marked](#28-a-table-an-owner-marked) | counter | P07 answers |
| 29 | [Which side lost: one pays all, and a custom split](#29-which-side-lost-one-pays-all-and-a-custom-split) | counter | P08 |
| 30 | [Charge double? for a double frame](#30-charge-double-for-a-double-frame) | counter | P08 |
| 31 | [Start a room: nobody picked yet](#31-start-a-room-nobody-picked-yet) | counter | P08 |
| 32 | [Undo on the next-frame screen](#32-undo-on-the-next-frame-screen) | counter | P08 |

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

## 13. Mark out of order: the note

- **What:** the "Mark out of order" button of screen 7 asks for a note before it does anything. The table then turns grey with the note
  on the board, and the counter's bell gets an alert. Only a free table can be marked. The event is written in Activity with the worker's name.
  A worker can put back a table another worker marked ([27](#27-put-a-table-back-in-order)); answered by the developer on 17 Oct 2026.
- **Where:** `/table/t2/start/out-of-order` (from "Mark out of order" on `/table/t2/start`).
- **Words:** "Mark Table 2 out of order", "Write why, for example “Cloth change”. Everyone sees it on the table.", "Note (required)",
  "Mark out of order", "Cancel". Urdu: see `docs/URDU_TO_CHECK.md`.
- **Built from:** the dialog of screen 7 with the round brass ball and wrench of screen 15, and the note box of screens 14 and 15.

![The note for Mark out of order](no-design/start-out-of-order-note.png)

## 14. A table that cannot be started

- **What:** a table with no price cannot start a game. Its start dialog says why and has one way out. The board does not open this
  dialog by a tap (those tiles do nothing), so it is only reached by the address. A table that is out of order is different: a tap
  opens the dialog that puts it back in order ([27](#27-put-a-table-back-in-order)), and its `/start` address goes there.
- **Where:** a pool table with no price: `/board/pool/table/po1/start`.
- **Words:** "Pool table 1 has no price yet" with "Locked until an owner sets the price" (the words of screen 4), and "Cancel".
- **Built from:** the dialog of screen 7.

![Pool table 1 cannot be started](no-design/start-table-cannot-start.png)

## 15. Starting pool, foosball, carrom, ludo and PlayStation

- **What:** these games have one kind of game, so there is no type step: the tap opens the two players straight away (screen 8), with
  "Game, Rs 300. The loser pays." under the title, no Back button and no "Step 2 of 2". Closing goes back to the tab you were on.
- **Where:** `/board/pool/table/po1/start/players` once an owner has set the price (the picture is made with Rs 300 on every pool table).
- **Words:** "Who is playing on Pool table 1?", "Game, Rs 300. The loser pays.", then the words of screen 8.
- **Built from:** screen 8.
- **When the game ends:** the same "Who lost this game?" as screen 17 ("Pool table 1, game ended at 9:42 PM after 12 minutes"), with
  "game" where it says "frame". The loser is charged the game price and the table is free; there is no next-frame screen. Past the game's
  own limit it asks "Charge double?" first (screen 19).

![Starting a game of pool](no-design/start-pool-players.png)

## 16. Starting a Century: one player

- **What:** a Century is charged under one player (D11), so the players screen has one slot instead of two and Start is ready once he is
  picked. The title line says the rate chosen on screen 7.
- **Where:** `/table/t2/start`, pick Century, "Next: pick players".
- **Words:** "Century, Rs 15 a minute. Charged under one player." and "Player 1".
- **Built from:** screen 8.

![Starting a Century](no-design/start-century-players.png)

## 17. The players screen before anything is typed

- **What:** screen 8 is drawn with a search typed in. Before that, the box says what it is for, the list under it is empty (the
  space is kept, so the dialog does not move when the first letter is typed), and the players who played here recently are on the end
  side. Each result also has one plain line at its end, the first that applies: where he is playing ("Playing on Table 1", "In Room 1"),
  what he owes ("Owes Rs 1,200"), or when he last played ("Last played today", "Last played yesterday", "Last played Thursday" within
  six days, then "Last played 24 Sep"). It is information, never a warning. The count says "7 found" where screen 8 draws "4 found": the
  seed has seven names that start a word with "ali", counting Hamid Ali and Rizwan Ali.
- **Where:** `/table/t2/start/players`.
- **Words:** "Search players by name or phone" (the box), "Search or tap a name" (the empty slot), "{{count}} found", "Last played today",
  "Last played yesterday", "Last played {{day}}".
- **Built from:** screen 8.

![The players screen with nothing typed](no-design/start-search-empty.png)

## 18. Add a new player: the number is not whole

- **What:** screen 10 draws "Add player" ready with "0302 81" typed, which is not a whole number. Tapping it then saves nothing and says
  what is missing under the phone box. A name with no number at all uses "Skip phone for now". Whole means 10 or 11 digits.
- **Where:** `/players/new?for=t2`, type a name and six digits, tap "Add player".
- **Words:** "Type the whole number, or tap “Skip phone for now”." Urdu: see `docs/URDU_TO_CHECK.md`.
- **Built from:** the red line of the PIN pad (screen 1) and the dialog of screen 10.

![A phone number that is not whole yet](no-design/new-player-whole-number.png)

## 19. Change the game type: who plays after the change

- **What:** on screen 12 "Change to Century" cannot know who pays for the Century, or who is on which side of a double, so it goes on to
  the players (screen 8 or 9) with the game's own players already in the slots: the first player for a Century, the current pairs for a
  double, one player from each side for a single frame. The last button says "Change to Century" again and does the change. The game
  keeps its start time and counts from there. Back returns to the three choices. Every change between snooker types needs a name or the
  sides, so this step is always there. Answered by the developer on 17 Oct 2026.
- **Where:** `/table/t2/change-type?scenario=newGame` at 9:53 PM, pick Century, "Change to Century".
- **Words:** "Who is playing on Table 2?", "Change to Century", "Change to Double frame", "Back to game type".
- **Built from:** screens 8 and 9.

![Who plays after the type changes](no-design/change-type-players.png)

## 20. The panel of a Century, a room or a double

- **What:** screen 11 draws a single frame. The same panel serves every game on a table: a Century (title "Table 3, Century",
  "Century, Rs 15 a minute", "Under Saad Hussain", "End Century", no session score, a timer that is never the red card), a room
  ("Room, Rs 1,500 an hour", "End room"), a double frame (the two sides as first names) and a game of pool or the others. A frame
  past its limit has the red card in the panel too. A game that is not a frame says "Discard game" where a frame says "Discard
  frame". A paused game shows "Paused since 9:58 PM" in yellow and a Resume button in place of Pause.
- **Where:** `/table/t3` (a Century), `/table/r1` (a room), `/table/t5` (a double).
- **Words:** "Table 3, Century", "Century, {{price}} a minute", "Room, {{price}} an hour", "Under {{name}}", "End Century", "End room",
  "End game", "Discard game", "Resume", "Paused since {{time}}". Urdu: see `docs/URDU_TO_CHECK.md`.
- **Built from:** screen 11.

![The panel of a Century](no-design/panel-century.png)

## 21. The panel in the first 5 minutes: Change game type

- **What:** screen 11 shows a dashed note once the 5 minutes are over ("Change game type was open until 9:28 PM"). Inside the 5
  minutes the note is replaced by a button, "Change game type", with the minutes left beside it. It opens screen 12. Only snooker
  tables have it (the other games have one kind of game).
- **Where:** `/table/t2?scenario=newGame` at 9:53 PM.
- **Words:** "Change game type", "2 minutes left to change", "1 minute left to change".
- **Built from:** screen 11 and the outline button of screen 7.

![The panel with the change button](no-design/panel-change-type-open.png)

## 22. Move a room, and the players to pick from

- **What:** a game moves only to a free table of the same kind, so a room is offered the other rooms and a snooker table the other
  snooker tables. With nothing typed, "Who is coming in?" offers the four players who played here lately (never the ones already in
  the game), so a replacement can be picked with one tap. If there is no other table, the panel says so.
- **Where:** `/table/r1/move`.
- **Words:** "Move Room 1 to another table", "Rs 1,500/hr, same price", "There is no other table of this kind to move to." and the
  words of screen 13.
- **Built from:** screen 13.

![Moving a room](no-design/move-a-room.png)

## 23. Stop a frame: the dispute and the cancel

- **What:** screen 14 draws Discard frame picked. The other two choices use the same dialog. The button says what will happen:
  "Discard frame" (or "Discard game" for a Century, a room or a game), "Mark as dispute", "Cancel game". A reason is always asked
  for; the note is optional. What is written for the owners is the reason in English whatever language the counter is in, with the
  note after it. A dispute and a cancel are sent as one text: the reason, then the note. **Exception, answered on 17 Oct 2026:** "Cancel,
  started by mistake" in the first 2 minutes of the worker's own game acts exactly like Undo: no reason is asked, nothing is charged,
  and Activity shows "Game undone". The card says "Wrong table or wrong players. In the first 2 minutes it works like Undo: no reason,
  nothing charged." and the dialog says "Started less than 2 minutes ago, so this works like Undo: no reason is needed and nothing is
  charged." After 2 minutes, or on another worker's game, a reason is asked as before.
- **Where:** `/table/t6/stop`, pick "Unpaid, dispute".
- **Words:** "Mark as dispute", "Cancel game", "Discard game".
- **Built from:** screen 14.

![Stopping a frame as a dispute](no-design/stop-dispute.png)

## 24. Damage charge: nothing picked yet

- **What:** screen 15 draws Ali, Cue and Rs 1,500 already picked. It is money, so the dialog starts with nothing picked (who pays,
  what was damaged, the amount, the note); the button says "Add to the bill" and stays off until all four are filled in, and then says
  what it will do ("Add Rs 1,500 to Ali’s bill"). A Century has one player, so he is the only one offered. Approved by the developer on
  17 Oct 2026; the visual test leaves the picked state out of the comparison.
- **Where:** `/table/t1/damage`.
- **Words:** "Add to the bill", "Shows on the player’s statement as a damage charge. Owners see it in Activity."
- **Built from:** screen 15.

![The damage charge with nothing picked](no-design/damage-nothing-picked.png)

## 25. Undo done

- **What:** after "Undo" on the toast of screen 14, the toast says what happened for four seconds, then goes. The table is free again
  and the owners see the undo in Activity with the worker's name (D16). A worker can undo only his own game: the toast shows only the
  game he started, and the server refuses another worker's undo (answered on 17 Oct 2026).
- **Where:** any counter screen within 2 minutes of starting a game, for example `/?scenario=newGame` at 9:50:18 PM, then Undo.
- **Words:** "Game undone on Table 2."
- **Built from:** the toast of screen 14.

![The toast after Undo](no-design/undo-done.png)

## 26. Pause all from the action bar

- **What:** the "Pause all" button pauses every running game at once and the board becomes the power-cut board of screen 16. While
  it is on, the button is off (there is nothing left to pause); "Resume all games" on the banner is the way back. Tiles that were
  paused one by one show "paused 3 min ago" as before; after Pause all they show the Resume button of screen 16.
- **Where:** `/`, then "Pause all" in the action bar.
- **Words:** the words of screen 16.
- **Built from:** screen 16.

![The board after Pause all](no-design/pause-all-pressed.png)

## 27. Put a table back in order

- **What:** a tap on a grey table opens a dialog. If a **worker** marked the table, another worker (or the same one) can put it back
  with a short note: the dialog has a note box and "Put back in order", which stays off until the note is written. Both the marking
  and the putting back are written in Activity with the worker's name. Answered by the developer on 17 Oct 2026. A table that is not
  grey has nothing to put back, and a grey table's `/start` address opens this dialog.
- **Where:** mark Table 2 out of order from `/table/t2/start`, then tap the grey tile.
- **Words:** "Table 2 is out of order" with the note and "Marked by Zain at 9:42 PM", "Note (required)", "Write what was done, for
  example “Cloth changed”. Everyone sees it.", "Put back in order", "Cancel". Urdu: see `docs/URDU_TO_CHECK.md`.
- **Built from:** the dialog of screen 7 with the round brass ball and wrench of screen 15, and the note box of section 13.

![A table a worker marked, with the note box](no-design/back-in-order-worker.png)

## 28. A table an owner marked

- **What:** the same dialog for a table an **owner** marked (Adil on Table 7): it says who marked it and that only an owner can put it
  back (in Games and prices). It has no note box and no put-back button; the server refuses a worker's call as well.
- **Where:** `/table/t7/back-in-order`, or tap the grey Table 7.
- **Words:** "Table 7 is out of order" with "Cloth change. Marked by Adil at 4:15 PM", "Adil marked this table. Only an owner can put
  it back.", "Cancel". Urdu: see `docs/URDU_TO_CHECK.md`.
- **Built from:** section 27.

![A table an owner marked](no-design/back-in-order-owner.png)

## 29. Which side lost: one pays all, and a custom split

- **What:** screen 20 draws Side B picked with "Half each". Before a side is chosen there is no split box and the brass button says
  "Choose the side that lost" and stays off. After it, the split box offers three choices. **Half each** shows what each pays as
  words. **One pays all** makes each player's row a button: the one tapped pays the whole price ("Charge Naveed") and the other pays
  nothing. **Custom** makes the two amounts fields; typing in one sets the other to what is left, so they always add up to the price
  (the server refuses a split that does not, D9). A side with one player has no split to choose: he pays all of it.
- **Where:** `/table/t5/end?now=2026-10-03T21:47:00%2B05:00`, tap "Side B", then "One pays all".
- **Words:** "Choose the side that lost", "One pays all", "Naveed pays", "Charge Naveed", "The amounts add up to Rs 390, not Rs 400."
- **Built from:** screen 20.

![One pays all](no-design/end-double-one-pays-all.png)

## 30. Charge double? for a double frame

- **What:** the over-the-limit question (screen 19) is also asked for a double frame (Q2, `docs/11` 15). It comes after the side and
  the split, because the split is the worker's, and before anything is charged. The question names the two sides ("Imran Shah and
  Naveed Akhtar lost to Kamran Iqbal and Faisal Mehmood. Choose what they pay.") and offers the whole price (Rs 400) or double
  (Rs 800). A custom split doubles with it, so it still adds up (300 + 100 becomes 600 + 200).
- **Where:** `/table/t5/end?now=2026-10-03T22:00:00%2B05:00`, tap "Side B", then "Charge Imran and Naveed".
- **Words:** "This frame took 40 minutes. Charge double?", "Choose what they pay."
- **Built from:** screen 19.

![Charge double for a double frame](no-design/end-double-overtime.png)

## 31. Start a room: nobody picked yet

- **What:** screen 22 draws Danish Iqbal already picked. Before anybody is, "Under" holds the player search of screen 8 (with "Add
  as a new player"), and "Start Room 2" stays off. Picking a player shows the green card of the screen with "Change", which takes
  him off again.
- **Where:** `/room/r2/start?now=2026-10-03T21:52:00%2B05:00`.
- **Words:** "Search the player the room is under" (the name of the box).
- **Built from:** screens 8 and 22.

![Start a room with nobody picked](no-design/room-start-nobody.png)

## 32. Undo on the next-frame screen

- **What:** screen 18 draws "Tapped the wrong player? Undo, 1:56 left" and no document says what it does. It takes the charge
  back (the line on the player's statement, his numbers, the session score and the sheet's totals) and asks "Who lost this frame?"
  again, with the frame running as if it had not ended (the time since is not counted). Only the worker who charged the frame can
  do it, only for 2 minutes, and only while no other game has started on the table (DEFAULT, needs answer, in `PROGRESS.md`).
  Activity shows "Frame undone on Table 1" with his name. A Century, a room or a double frame has no Undo.
- **Where:** `/table/t1/end?now=2026-10-03T21:51:00%2B05:00`, tap Bilal Ahmed, then "Undo". The picture is the screen it comes back to.
- **Words:** "Undo, 1:56 left" (the words of screen 18).
- **Built from:** screens 17 and 18.

![Who lost, after Undo](no-design/next-frame-undone.png)

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

### Screen 8, Start a game: pick the players: the count and the order

- **Change:** the PNG says "4 found" and lists Ali Akbar, Ali Haider, Ali Raza and Ali Hassan. With the seed there are seven names that
  start a word with "ali" (Ali Shah, who is on screen 10, Hamid Ali and Rizwan Ali too), so the count is 7 and the list scrolls inside
  four rows, with "Add “ali” as a new player" always under it. The four of the PNG are the first four apart from Ali Shah, who is free
  and comes before the two who are playing. A new seed name, Ali Shah, and Hamid Ali's number (5047 as drawn) were added to the seed to
  match the screens.

### Screen 10, Add a new player: similar names

- **Change:** the PNG shows two similar names for "Ali Shahzad" (Ali Shah and Ali Haider). The rule is: a saved name that starts with the
  typed one, that the typed one starts with, or that is a letter or two away. It gives Ali Shah only; Ali Haider is not similar.

### Screen 7, Start a game: choose the type: the Century rate row

- **Change:** the rate row is always there (so the dialog keeps its height) but its minus, plus and number work only while Century is
  picked. A frame is picked to begin with.

### Screen 11, A game that is running: more than a single frame

- **Change:** the panel also serves a Century, a room, a double and a game, and has a "Change game type" button in the first 5
  minutes (section 21). The six buttons are always the same six; "Replace player" and "Move table" both open screen 13, which has
  both panels. "Canteen item" opens the canteen (P10).

### Screen 14, Stop a frame: the toast

- **Change:** the cream toast is the one the PNG draws, not the dark `Toast`: it is built for the counter only (`UndoToast`), it finds
  the game from the board (the worker's own latest game started in the last 2 minutes), so it is on every screen and survives a
  reload, and a dialog on screen leaves room for it underneath.

### Screen 16, Power cut: what is compared

- **Change:** none to the screen. The PNG leaves out the tabs, the waiting list and the action bar of the live board (the developer
  chose the full bar everywhere in P05), so the visual test compares the banner and the tiles, not the whole page.
