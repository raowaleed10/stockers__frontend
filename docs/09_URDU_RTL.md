# 09 · Urdu and right-to-left

The owners want the English/Urdu switch on the counter **and** in the owner portal (Q17). Screen 6 is the reference for the Urdu layout.

## Setup
- `react-i18next`, with `src/locales/en.json` and `src/locales/ur.json`. Use namespaces per area: `common`, `board`, `game`, `checkout`, `canteen`, `sheet`, `owner`, `auth`.
- Switching language sets `<html lang="ur" dir="rtl">` (or `lang="en" dir="ltr"`) and swaps the font: `font-urdu` for text. **Numbers, timers and table numbers stay in Barlow Condensed with Western digits.**
- Each device remembers its language (localStorage is fine for this one preference). The default comes from Settings (counter: English).
- Urdu text needs more height: line-height 1.6–1.9 for Nastaliq. Do not fix heights on text containers. Let them grow, and let rows wrap (the tile pill moves under the number when narrow, as on screen 6).

## Layout rules
- Use logical utilities only: `ms-/me-/ps-/pe-`, `start-/end-`, `text-start/text-end`, `rounded-s-/rounded-e-`, `border-s/border-e`.
- In Urdu, the whole page mirrors:
  - The waiting panel moves to the left.
  - The brand moves to the right.
  - Tiles flow from the right.
  - The action bar starts from the right.
- **Do not mirror** table drawings (pockets, baulk line, rack), charts, the clock, or phone numbers.
- Icons that show direction (back chevron, arrows) do flip. Others (lock, bell, wallet) do not.

## Money and numbers
- English: `Rs 1,350`. Urdu: `1,350 روپے` (number first, then روپے).
- Signs: `− 500` / `+ 200` in both languages.
- Times: English `9:42 PM`; Urdu `رات 9:42` / `صبح 11:10` (morning صبح, afternoon دوپہر, evening شام, night رات).

## Word list (from the approved Urdu board)

| English | Urdu |
|---|---|
| Sheet 48 | شیٹ 48 |
| Open since 11:10 AM, Sat 3 Oct | کھلی: صبح 11:10، ہفتہ 3 اکتوبر |
| Lock | لاک |
| Until 11:00 PM | رات 11:00 تک |
| Snooker and rooms · 6 of 9 in use | اسنوکر اور رومز · 9 میں سے 6 مصروف |
| Pool · Foosball · Carrom · Ludo · PlayStation | پول · فوس بال · کیرم · لڈو · پلے اسٹیشن |
| Table | ٹیبل |
| Rs 250 a frame | فریم 250 روپے |
| Playing | کھیل جاری |
| Free | خالی |
| Over 30 min | 30 منٹ سے زیادہ |
| Paused | رکا ہوا |
| Out of order | خراب |
| Single frame | سنگل فریم |
| Double frame | ڈبل فریم |
| Century | سنچری |
| Rs 15 a minute | 15 روپے فی منٹ |
| vs | بمقابلہ |
| Under Saad Hussain | سعد حسین کے نام |
| Start a game | گیم شروع کریں |
| Double Rs 500. Century Rs 15 a minute. | ڈبل 500 روپے۔ سنچری 15 روپے فی منٹ۔ |
| Room | روم |
| Rs 1,500/hr | 1,500 روپے/گھنٹہ |
| Hourly | گھنٹے کے حساب سے |
| Start a room | روم شروع کریں |
| 1 hour minimum | کم از کم 1 گھنٹہ |
| Cloth change | کپڑا تبدیل ہو رہا ہے |
| Marked by Adil at 4:15 PM | عادل نے شام 4:15 بجے لگایا |
| Waiting to pay | ادائیگی باقی |
| 5 players | 5 کھلاڑی |
| 2 frames lost, 2 teas | 2 فریم ہارے، 2 چائے |
| 1 frame lost | 1 فریم ہارا |
| Half of a double | ڈبل کا آدھا |
| Not paid yet today | آج ابھی تک ادا نہیں ہوا |
| Checkout | چیک آؤٹ |
| Canteen | کینٹین |
| Players | کھلاڑی |
| Today's totals | آج کا حساب |
| Expense | خرچہ |
| Pause all | سب روکیں |
| Backed up 9:00 PM | بیک اپ: رات 9:00 |
| Close sheet | شیٹ بند کریں |

For every other screen:
1. Translate the English copy into simple, spoken Urdu: short words a counter worker uses.
2. Keep the English names of games (snooker, Century, PlayStation) in Urdu script, as above.
3. Put every new string into `ur.json`.
4. Mark the strings you are unsure about in `docs/URDU_TO_CHECK.md` so the owners can check them.

## Checks
- Every screen, in Urdu, at its design size: no clipped Urdu text, no overlapping pills, the timer still readable.
- A Playwright test runs each route in both languages (`?lang=ur`) and saves screenshots for review.
