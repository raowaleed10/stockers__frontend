import type alerts from '@/counter/locales/en/alerts.json';
import type board from '@/counter/locales/en/board.json';
import type canteen from '@/counter/locales/en/canteen.json';
import type checkout from '@/counter/locales/en/checkout.json';
import type close from '@/counter/locales/en/close.json';
import type closed from '@/counter/locales/en/closed.json';
import type end from '@/counter/locales/en/end.json';
import type expense from '@/counter/locales/en/expense.json';
import type frame from '@/counter/locales/en/frame.json';
import type lock from '@/counter/locales/en/lock.json';
import type players from '@/counter/locales/en/players.json';
import type signin from '@/counter/locales/en/signin.json';
import type start from '@/counter/locales/en/start.json';
import type table from '@/counter/locales/en/table.json';
import type today from '@/counter/locales/en/today.json';
import type data from '@/dev/locales/en/data.json';
import type kit from '@/dev/locales/en/kit.json';
import type preview from '@/dev/locales/en/preview.json';
import type tiles from '@/dev/locales/en/tiles.json';
import type common from '@/locales/en/common.json';
import type login from '@/owner/locales/en/login.json';
import type shell from '@/owner/locales/en/shell.json';

// Makes t('...') check its keys against the English files. Type-only, so nothing here reaches a bundle.
// Adding a namespace file in counter/locales or owner/locales? Add one `import type` line for it
// above and one entry below (see docs/09_URDU_RTL.md). Namespace names are unique across both apps.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      alerts: typeof alerts; // counter: the bell's side panel
      board: typeof board; // counter: the live board, its tabs, tiles and the waiting list
      canteen: typeof canteen; // counter: the canteen sale
      close: typeof close; // counter: closing the sheet
      closed: typeof closed; // counter: "Sheet 48 is closed"
      expense: typeof expense; // counter: an expense from the drawer
      players: typeof players; // counter: the players list and their statements
      today: typeof today; // counter: today's totals
      checkout: typeof checkout; // counter: the checkout list, a player's bill, the part payment and the discount
      end: typeof end; // counter: ending a frame, a double, a Century or a room, the next frame, starting a room
      frame: typeof frame; // counter: the top bar, the action bar and the sign-in time banner
      lock: typeof lock; // counter: the lock screen
      signin: typeof signin; // counter: the sign-in page
      start: typeof start; // counter: starting a game, adding a player, changing the type
      table: typeof table; // counter: the table panel, move, stop, damage, the undo toast and Pause all
      login: typeof login; // owner: the sign-in page (screens 35 and 52)
      shell: typeof shell; // owner: the sidebar, the phone bars and the page titles
      data: typeof data; // dev-only: the /dev/data page
      kit: typeof kit; // dev-only: the /dev/kit page
      preview: typeof preview; // dev-only: the /dev/games-preview page
      tiles: typeof tiles; // dev-only: the /dev/tiles page
    };
  }
}
