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
