# P08-ending-games · Ending frames, Century and rooms

**Goal:** Build the end of every game type: who lost, the next frame, the over-30-minutes double-charge question, double-frame splits, Century, and starting and ending rooms.

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/07_RULES_FOR_SCREENS.md` §2, `docs/02_DECISIONS.md` D8–D12, Q2, Q8, Q9

## Look at these screens before you write code
Open each PNG (it is the approved design) and read its HTML for exact sizes, colours and copy.
- Screen 17, End a frame: who lost? (1440×900, clock 9:51 PM): `design/screens/17-end-a-frame-who-lost.png` and `design/html/17-end-a-frame-who-lost.html` → `/table/t1/end`
- Screen 18, Frame charged, next frame (1440×900, clock 9:51 PM): `design/screens/18-frame-charged-next-frame.png` and `design/html/18-frame-charged-next-frame.html` → `/table/t1/next`
- Screen 19, Over 30 minutes: charge double? (1440×900, clock 9:46 PM): `design/screens/19-over-30-minutes-charge-double.png` and `design/html/19-over-30-minutes-charge-double.html` → `/table/t4/end/overtime`
- Screen 20, End a double frame (1440×900, clock 9:47 PM): `design/screens/20-end-a-double-frame.png` and `design/html/20-end-a-double-frame.html` → `/table/t5/end`
- Screen 21, End Century (1440×900, clock 9:47 PM): `design/screens/21-end-century.png` and `design/html/21-end-century.html` → `/table/t3/end`
- Screen 22, Start a room (1440×900, clock 9:52 PM): `design/screens/22-start-a-room.png` and `design/html/22-start-a-room.html` → `/room/r2/start`
- Screen 23, End a room (1440×900, clock 10:15 PM): `design/screens/23-end-a-room.png` and `design/html/23-end-a-room.html` → `/room/r1/end`

## Build
1. `/table/:id/end` (screen 17):
   - "Who lost this frame?" with two big person cards showing what each owes tonight.
   - "Keep playing" and "Nobody pays".
   - Tapping the loser charges the frame.
2. Over 30 minutes (screen 19):
   - If the frame ran 30 minutes or more, show the warning dialog "This frame took 36 minutes. Charge double?" with Normal price and Double price before charging.
   - A double charge creates an activity event.
3. `/table/:id/next` (screen 18):
   - The success header "Rs 250 added to Bilal Ahmed's bill" and the session score.
   - "Next frame, same players" (starts frame 4), "Change players", "Free the table".
   - The Undo toast, available for 2 minutes.
4. Double end (screen 20): which side lost, then the split: half each, one pays all, or custom (must add up). "Charge Imran and Naveed".
5. Century end (screen 21): time on the table, minutes charged (whole minutes), the rate set at the start, and paused time not charged. "End and charge Rs 630".
6. Rooms:
   - Start (screen 22): under one player, hourly price stepper starting at Rs 1,500, and examples.
   - End (screen 23): first hour (minimum), then by the minute, rounded.
7. All amounts come from `packages/shared/src/rules`.

## Done when
- Table 1: lose, then next frame; the score updates.
- Table 4 at 36 minutes asks to charge double, and Rs 400 goes to Zubair.
- Table 5's double splits 200/200.
- Table 3 Century at 42:35 charges Rs 630.
- Room 1 at 1:40:00 charges Rs 2,500.
- Screens 17–23 match their PNGs.

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).


## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run test:visual` for the screens above. Fix everything until they pass.
2. Start the app and compare each screen above with its PNG at the design size. List any difference you could not fix.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P08 Ending frames, Century and rooms"`.
6. If anything needs my answer, list the questions at the very end of your report (also in PROGRESS.md). I will answer in this same session; then apply the answers, update PROGRESS.md, run the checks and commit again as "P08 answers". The next step starts in a new session only after that.
