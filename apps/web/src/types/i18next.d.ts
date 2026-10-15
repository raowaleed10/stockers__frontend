import type alerts from '@/counter/locales/en/alerts.json';
import type board from '@/counter/locales/en/board.json';
import type frame from '@/counter/locales/en/frame.json';
import type lock from '@/counter/locales/en/lock.json';
import type signin from '@/counter/locales/en/signin.json';
import type data from '@/dev/locales/en/data.json';
import type kit from '@/dev/locales/en/kit.json';
import type preview from '@/dev/locales/en/preview.json';
import type tiles from '@/dev/locales/en/tiles.json';
import type common from '@/locales/en/common.json';

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
      frame: typeof frame; // counter: the top bar, the action bar and the sign-in time banner
      lock: typeof lock; // counter: the lock screen
      signin: typeof signin; // counter: the sign-in page
      data: typeof data; // dev-only: the /dev/data page
      kit: typeof kit; // dev-only: the /dev/kit page
      preview: typeof preview; // dev-only: the /dev/games-preview page
      tiles: typeof tiles; // dev-only: the /dev/tiles page
    };
  }
}
