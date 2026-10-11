# 10 · Testing and checking against the designs

## 1. Commands
| Command | What it does |
|---|---|
| `npm run typecheck` | `tsc --noEmit` for all workspaces |
| `npm run lint` | ESLint (including the counter/owner import rule) and Prettier check |
| `npm test` | Vitest: shared rules (`packages/shared/src/rules/*.test.ts`) and components |
| `npm run test:e2e` | Playwright flows against the mock API |
| `npm run test:visual` | Playwright: each finished route vs its PNG in `design/screens` |
| `npm run check:bundles` | After build: fails if `dist/counter` contains `owner-`, `/api/owner` or any owner screen name |

## 2. Viewports and the demo clock
| Surface | Viewport | Demo clock |
|---|---|---|
| Counter (screens 1–34) | 1440×900, device scale 1 | `2026-10-03T21:42:00+05:00` by default; each screen's own time is `now` in `design/screens.json` (e.g. 19 → 21:46, 24 → 22:20, 29 → 20:15, 32 → 04 Oct 03:40) |
| Owner desktop (35–51) | 1440×900, full-page screenshot | `2026-10-03T22:30:00+05:00` by default; activity, sheets and players use `2026-10-04T03:45:00+05:00` with `scenario=closed` |
| Owner phone (52–58) | 390×844, full page | same as owner (`now` and `scenario` in `design/screens.json`) |

- The demo clock is a single module (`src/lib/clock.ts`). In tests, set it with `?now=2026-10-03T21:42:00%2B05:00`.
- In the demo it ticks from the start time. Turn it off with `VITE_DEMO_CLOCK=off`.
- Fonts must be loaded before a screenshot is taken (`await document.fonts.ready`).

## 3. Visual tests (`tests/visual/screens.spec.ts`)
- One test per screen, generated from `design/screens.json`: open `route` with `?now=<now>` and, when the entry has one, `&scenario=<scenario>` (owner routes under `/owner-dev`), set the viewport to the width in `size` (height 900 on desktop, 844 on the phone), wait for the fonts, take a full-page screenshot, compare with `design/screens/<file>.png`.
- Use Playwright `toHaveScreenshot` with the PNG copied in as the baseline, and `maxDiffPixelRatio: 0.06`. The goal is "same layout and look"; small text and number differences are allowed.
- Keep the diff images in `test-results`. Open them, and fix whatever is visibly different: missing panels, wrong colours, wrong sizes, wrong copy.
- Run the Urdu variant (`?lang=ur`) for the counter board and two owner screens as well. There is no baseline; save the screenshots for a person to review.

## 4. Flow tests (`tests/e2e/*.spec.ts`)

| Flow | Steps |
|---|---|
| Sign-in times | Zain signs in at 21:42 ✓. Shabir at 21:42 → "Not your time to sign in". At 22:51, Zain sees the warning banner. At 23:00, Zain is signed out. |
| Start and end a frame | Free Table 2 → Single frame → Ahmed Nawaz vs Ali Akbar → board shows Table 2 playing → End frame → Ali Akbar lost → Rs 250 on his bill → Next frame |
| Over 30 minutes | Table 4 at 34:10 shows the red card → End → charge double? → Rs 400 |
| Century | Table 3 at 42:35 → End Century → 42 min, Rs 630 |
| Room | Room 1 at 1:40:00 → End → Rs 2,500 |
| Checkout with split | Bilal: 1,350 → discount 50 with reason → cash 600 + Easypaisa 400 → 300 to credit |
| Drawer expense | Expense → Food → 500 → note → drawer expected goes down by 500; the owner Expenses list shows "Zain" and "Drawer cash" |
| Close sheet | Expected 21,750, counted 21,550 → a note is required → sheet 49 opens, running Century moves |
| Owner privacy | `/owner-dev/` signs in as Aqil. Counter routes never link there. `/anything-else` → "Page not found". The counter bundle check passes. |
| Who did what | After the flows above, Activity shows the right names in "Done by" |

## 5. Accessibility
- Run `@axe-core/playwright` on every screen route. There must be no serious or critical issues.
- Keyboard: Tab reaches every control, dialogs trap focus, and Escape closes dialogs (not the sign-in screen).
- Touch sizes: a test fails if any button on a counter route is under 56 px tall, or under 44 px on an owner route.

## 6. Manual check before calling a step done
- [ ] Looks like the PNG at the design size (side by side)
- [ ] Copy is word-for-word the same as the design
- [ ] Works in Urdu, with nothing clipped
- [ ] Empty, loading and error states exist and are plain-worded
- [ ] Names shown where an action is recorded
- [ ] No owner text, link or code reachable from the counter
- [ ] `PROGRESS.md` updated
