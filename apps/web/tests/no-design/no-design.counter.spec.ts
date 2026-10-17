import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { settle } from '../e2e/settle';

/**
 * The screenshots of docs/NO_DESIGN.md: every piece that is built without an approved PNG, in the state the
 * owners should look at. Run `npm run shots:no-design` to make them again. Each one saves a picture to
 * `docs/no-design/<id>.png`.
 *
 * Add an entry here whenever something is built without a PNG (CLAUDE.md), and a row in docs/NO_DESIGN.md with the
 * same id. `src/no-design-doc.test.ts` fails if the two do not match.
 */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const OUT = path.join(REPO, 'docs/no-design');
const NIGHT = encodeURIComponent('2026-10-03T21:42:00+05:00');

type Clip = { x: number; y: number; width: number; height: number };

interface Shot {
  id: string;
  url: string;
  /** Put the page in the state to show. */
  prepare?: (page: Page) => Promise<void>;
  /** A part of the 1440 × 900 screen; the whole screen if left out. */
  clip?: Clip;
  /** Answers the page's own calls differently, to reach a state the mock never gives. */
  fetchOverride?: { match: string; status: number; body?: unknown };
  /** Sets a price on every table of these kinds in the board's answer, as if an owner had set it (P15 builds that). */
  priceKinds?: Record<string, number>;
}

const key = (page: Page, digit: string) => page.getByRole('button', { name: digit, exact: true });
async function type(page: Page, digits: string) {
  for (const digit of digits) await key(page, digit).click();
}
/** What a tap leaves behind: focus on the key. A picture should show the screen, not a focus ring. */
const blur = (page: Page) =>
  page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

const SHOTS: Shot[] = [
  {
    id: 'session-banner',
    url: `/?now=${encodeURIComponent('2026-10-03T22:51:00+05:00')}`,
    prepare: async (page) => {
      await expect(page.getByRole('status')).toBeVisible();
    },
    clip: { x: 0, y: 0, width: 1440, height: 150 },
  },
  {
    id: 'switch-worker-offer',
    url: `/?now=${NIGHT}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: /Signed in: Zain/ }).click();
      await expect(page.getByRole('button', { name: 'Switch worker', exact: true })).toBeVisible();
    },
    clip: { x: 760, y: 0, width: 680, height: 170 },
  },
  {
    id: 'alerts-panel',
    url: `/?now=${NIGHT}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Notifications, 3 new' }).click();
      await expect(page.getByRole('dialog', { name: 'Alerts' })).toBeVisible();
      await expect(page.getByRole('listitem')).toHaveCount(3);
      await blur(page);
    },
  },
  {
    id: 'alerts-panel-empty',
    url: `/alerts?now=${NIGHT}`,
    fetchOverride: { match: '/api/counter/alerts', status: 200, body: { alerts: [], unread: 0 } },
    prepare: async (page) => {
      await expect(page.getByText('No alerts yet')).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'sign-in-wrong-pin',
    url: `/sign-in?now=${NIGHT}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: /Zain/ }).click();
      await type(page, '9999');
      await expect(page.getByText('Wrong PIN. Try again.')).toBeVisible();
      await blur(page);
    },
    clip: { x: 700, y: 0, width: 740, height: 900 },
  },
  {
    id: 'sign-in-wait-5-minutes',
    url: `/sign-in?now=${NIGHT}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: /Zain/ }).click();
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await type(page, '9999');
        await expect(page.getByRole('img', { name: '0 of 4 digits entered' })).toBeVisible();
      }
      await expect(page.getByText('Wait 5 minutes')).toBeVisible();
      await blur(page);
    },
    clip: { x: 700, y: 0, width: 740, height: 900 },
  },
  {
    id: 'sign-in-workers-error',
    url: `/sign-in?now=${NIGHT}`,
    fetchOverride: { match: '/api/counter/workers/public', status: 500 },
    prepare: async (page) => {
      // The page asks once more before it gives up.
      await expect(page.getByText('Could not load the workers.')).toBeVisible({ timeout: 10_000 });
    },
    clip: { x: 700, y: 280, width: 740, height: 340 },
  },
  {
    id: 'lock-wrong-pin',
    url: `/?locked=1&now=${NIGHT}`,
    prepare: async (page) => {
      await type(page, '0000');
      await expect(page.getByText('Wrong PIN. Try again.')).toBeVisible();
      await blur(page);
    },
    clip: { x: 760, y: 150, width: 680, height: 700 },
  },
  {
    id: 'board-foosball-no-price',
    url: `/board/foosball?now=${encodeURIComponent('2026-10-03T21:44:00+05:00')}`,
    prepare: async (page) => {
      await expect(page.getByText('Foosball tables have no price yet')).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'board-priced-carrom',
    url: `/board/carrom?now=${encodeURIComponent('2026-10-03T21:44:00+05:00')}`,
    priceKinds: { carrom: 50 },
    prepare: async (page) => {
      await expect(page.getByRole('button', { name: 'Carrom board 1, free' })).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'board-error',
    url: `/?now=${NIGHT}`,
    fetchOverride: { match: '/api/counter/board', status: 500 },
    prepare: async (page) => {
      // The page asks once more before it gives up.
      await expect(page.getByText('Could not load the tables.')).toBeVisible({ timeout: 15_000 });
    },
    clip: { x: 0, y: 83, width: 1440, height: 260 },
  },
  {
    id: 'waiting-panel-empty',
    // 3:45 AM after the sheet was closed: nobody is waiting to pay.
    url: `/?scenario=closed&now=${encodeURIComponent('2026-10-04T03:45:00+05:00')}`,
    prepare: async (page) => {
      await expect(page.getByText('Nobody is waiting to pay')).toBeVisible();
      await blur(page);
    },
    clip: { x: 1040, y: 150, width: 400, height: 260 },
  },
  // P06: starting a game
  {
    id: 'start-out-of-order-note',
    url: `/table/t2/start/out-of-order?now=${NIGHT}`,
    prepare: async (page) => {
      await page.getByLabel('Note (required)').fill('Cloth change');
      await blur(page);
    },
  },
  {
    id: 'start-table-cannot-start',
    url: `/board/pool/table/po1/start?now=${NIGHT}`,
    prepare: async (page) => {
      await expect(
        page.getByRole('dialog', { name: 'Pool table 1 has no price yet' }),
      ).toBeVisible();
      await blur(page);
    },
  },
  // P07 answers: putting a table back in order (D60)
  {
    id: 'back-in-order-worker',
    url: `/table/t2/start/out-of-order?now=${NIGHT}`,
    prepare: async (page) => {
      await page.getByLabel('Note (required)').fill('Cloth change');
      await page.getByRole('button', { name: 'Mark out of order' }).click();
      await page.getByRole('button', { name: 'Table 2, out of order' }).click();
      const dialog = page.getByRole('dialog', { name: 'Table 2 is out of order' });
      await dialog.getByLabel('Note (required)').fill('Cloth changed');
      await blur(page);
    },
  },
  {
    id: 'back-in-order-owner',
    url: `/table/t7/back-in-order?now=${NIGHT}`,
    prepare: async (page) => {
      await expect(page.getByRole('dialog', { name: 'Table 7 is out of order' })).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'start-pool-players',
    url: `/board/pool/table/po1/start/players?now=${NIGHT}`,
    priceKinds: { pool: 300 },
    prepare: async (page) => {
      await expect(
        page.getByRole('dialog', { name: 'Who is playing on Pool table 1?' }),
      ).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'start-century-players',
    url: `/table/t2/start?now=${NIGHT}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Century/ }).click();
      await page.getByRole('button', { name: 'Next: pick players' }).click();
      const search = page.getByRole('searchbox', { name: 'Search players by name or phone' });
      await search.fill('saad');
      await page
        .getByRole('list', { name: 'Search results' })
        .getByRole('button', { name: /^Saad Hussain/ })
        .click();
      await blur(page);
    },
  },
  {
    id: 'start-search-empty',
    url: `/table/t2/start/players?now=${encodeURIComponent('2026-10-03T21:46:00+05:00')}`,
    prepare: async (page) => {
      await expect(page.getByText('Search or tap a name').last()).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'new-player-whole-number',
    url: `/players/new?for=t2&now=${NIGHT}`,
    prepare: async (page) => {
      await page.getByLabel('Full name').fill('Ali Shahzad');
      for (const digit of '030281') await key(page, digit).click();
      await page.getByRole('button', { name: 'Add player' }).click();
      await expect(page.getByRole('alert')).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'change-type-players',
    url: `/table/t2/change-type?scenario=newGame&now=${encodeURIComponent('2026-10-03T21:53:00+05:00')}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Century/ }).click();
      await page.getByRole('button', { name: 'Change to Century' }).click();
      await expect(page.getByRole('dialog', { name: 'Who is playing on Table 2?' })).toBeVisible();
      await blur(page);
    },
  },
  // P08: ending games and rooms
  {
    id: 'end-double-one-pays-all',
    url: `/table/t5/end?now=${encodeURIComponent('2026-10-03T21:47:00+05:00')}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: /Imran Shah.*Naveed Akhtar/ }).click();
      await page.getByRole('radio', { name: 'One pays all' }).click();
      await page.getByRole('button', { name: 'Naveed pays' }).click();
      await blur(page);
    },
  },
  {
    id: 'end-double-overtime',
    url: `/table/t5/end?now=${encodeURIComponent('2026-10-03T22:00:00+05:00')}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: /Imran Shah.*Naveed Akhtar/ }).click();
      await page.getByRole('button', { name: 'Charge Imran and Naveed' }).click();
      await expect(page.getByRole('dialog', { name: /^This frame took 40 minutes/ })).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'room-start-nobody',
    url: `/room/r2/start?now=${encodeURIComponent('2026-10-03T21:52:00+05:00')}`,
    prepare: async (page) => {
      await expect(page.getByRole('dialog', { name: 'Start Room 2' })).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'next-frame-undone',
    url: `/table/t1/end?now=${encodeURIComponent('2026-10-03T21:51:00+05:00')}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Bilal Ahmed/ }).click();
      await page.getByRole('button', { name: /^Undo, / }).click();
      await expect(page.getByRole('dialog', { name: 'Who lost this frame?' })).toBeVisible();
      await expect(page.getByText('Rs 250 is on Bilal Ahmed’s bill now.')).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'correct-nobody-pays',
    url: `/table/t1/end?now=${encodeURIComponent('2026-10-03T21:51:00+05:00')}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Bilal Ahmed/ }).click();
      await page.getByRole('button', { name: /^Undo, / }).click();
      await page.getByRole('button', { name: 'Nobody pays' }).click();
      const dialog = page.getByRole('dialog', { name: 'Nobody pays for this frame' });
      await dialog.getByRole('button', { name: 'Table problem' }).click();
      await blur(page);
    },
  },
  {
    id: 'undo-charge-toast',
    url: `/table/t1/end?now=${encodeURIComponent('2026-10-03T21:51:00+05:00')}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Bilal Ahmed/ }).click();
      await page.getByRole('button', { name: /^Next frame, same players/ }).click();
      await expect(page.getByText('Rs 250 added to Bilal Ahmed’s bill')).toBeVisible();
      await blur(page);
    },
    clip: { x: 0, y: 560, width: 1440, height: 340 },
  },
  // P09: checkout
  {
    id: 'checkout-paid-note',
    url: `/checkout?scenario=checkout&now=${encodeURIComponent('2026-10-03T22:20:00+05:00')}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Saad Hussain/ }).click();
      await page.getByRole('button', { name: /^Paid in full/ }).click();
      await page.getByRole('button', { name: 'Yes' }).click();
      await expect(page.getByText('Saad Hussain paid Rs 430.', { exact: true })).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'checkout-confirm',
    url: `/checkout/bilal/part?scenario=checkout&now=${encodeURIComponent('2026-10-03T22:22:00+05:00')}`,
    prepare: async (page) => {
      const pad = page.locator('main > section').nth(1);
      for (const digit of '600')
        await pad.getByRole('button', { name: digit, exact: true }).click();
      await page.getByRole('button', { name: '+ Easypaisa' }).click();
      for (const digit of '400')
        await pad.getByRole('button', { name: digit, exact: true }).click();
      await page.getByRole('button', { name: /^Save payment/ }).click();
      await expect(
        page.getByRole('dialog', {
          name: 'Rs 1,000 paid: Cash 600, Easypaisa 400, Rs 350 to credit?',
        }),
      ).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'undo-payment-toast',
    url: `/checkout/bilal?scenario=checkout&now=${encodeURIComponent('2026-10-03T22:20:00+05:00')}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Paid in full/ }).click();
      await page.getByRole('button', { name: 'Yes' }).click();
      await expect(page.getByText('Payment saved: Bilal Ahmed paid Rs 1,350.')).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'checkout-owes-before',
    url: `/checkout?scenario=checkout&now=${encodeURIComponent('2026-10-03T22:20:00+05:00')}`,
    prepare: async (page) => {
      await page.getByRole('radio', { name: 'Owes from before' }).click();
      await expect(page.getByRole('button', { name: /^Waqas/ })).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'checkout-search',
    url: `/checkout?scenario=checkout&now=${encodeURIComponent('2026-10-03T22:20:00+05:00')}`,
    prepare: async (page) => {
      await page.getByRole('searchbox', { name: 'Search any player' }).fill('waq');
      await expect(page.getByRole('button', { name: /^Waqas/ })).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'checkout-advance',
    url: `/checkout/saad?scenario=checkout&now=${encodeURIComponent('2026-10-03T22:20:00+05:00')}`,
    prepare: async (page) => {
      await expect(page.getByRole('region', { name: 'Bill' })).toContainText('Advance held');
      await blur(page);
    },
  },
  {
    id: 'checkout-part-advance',
    url: `/checkout/kamran/part?scenario=checkout&now=${encodeURIComponent('2026-10-03T22:22:00+05:00')}`,
    prepare: async (page) => {
      const pad = page.locator('main > section').nth(1);
      for (const digit of '1500')
        await pad.getByRole('button', { name: digit, exact: true }).click();
      await expect(page.getByText('Kept as advance', { exact: true })).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'checkout-discount-edit',
    url: `/checkout/bilal?scenario=checkout&now=${encodeURIComponent('2026-10-03T22:21:00+05:00')}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Give a discount' }).click();
      const dialog = page.getByRole('dialog', { name: 'Give Bilal a discount' });
      await dialog.getByRole('button', { name: 'Rs 50' }).click();
      await dialog.getByRole('button', { name: 'Rounded the bill' }).click();
      await dialog.getByRole('button', { name: 'Apply Rs 50 discount' }).click();
      await page.getByRole('button', { name: 'Give a discount' }).click();
      await expect(page.getByRole('button', { name: 'Remove discount' })).toBeVisible();
      await blur(page);
    },
  },
  // P10: the canteen, the drawer, the players and closing the sheet
  {
    id: 'canteen-nobody',
    url: `/canteen?now=${encodeURIComponent('2026-10-03T21:55:00+05:00')}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Biscuits,/ }).click();
      await page.getByRole('button', { name: /^Biscuits,/ }).click();
      await expect(page.getByRole('button', { name: 'Pick a player first' })).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'canteen-cash-sale',
    url: `/canteen?now=${encodeURIComponent('2026-10-03T21:55:00+05:00')}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Coffee,/ }).click();
      await page.getByRole('radio', { name: 'Cash sale, no name' }).click();
      await page.getByRole('button', { name: 'Easypaisa' }).click();
      await expect(page.getByRole('button', { name: 'Take Rs 120 now (Easypaisa)' })).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'expense-empty',
    url: `/expense?now=${encodeURIComponent('2026-10-03T20:15:00+05:00')}`,
    prepare: async (page) => {
      await expect(page.getByRole('dialog', { name: 'Expense from the drawer' })).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'expense-saved-note',
    url: `/?now=${encodeURIComponent('2026-10-03T20:15:00+05:00')}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Expense' }).click();
      const dialog = page.getByRole('dialog', { name: 'Expense from the drawer' });
      await dialog.getByRole('button', { name: 'Food' }).click();
      await dialog.getByLabel('Note (required)').fill('Dinner for staff');
      await dialog.getByRole('button', { name: '500', exact: true }).click();
      await dialog.getByRole('button', { name: 'Take Rs 500 from the drawer' }).click();
      await expect(page.getByText('Rs 500 taken from the drawer: Dinner for staff.')).toBeVisible();
      await blur(page);
    },
    clip: { x: 0, y: 700, width: 1440, height: 200 },
  },
  {
    id: 'players-none-picked',
    url: `/players?now=${encodeURIComponent('2026-10-03T22:25:00+05:00')}`,
    prepare: async (page) => {
      await expect(page.getByText('Pick a player on the left to see his account.')).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'players-advance',
    url: `/players/saad?now=${encodeURIComponent('2026-10-03T22:25:00+05:00')}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Advance / }).click();
      await expect(page.getByText('Advance with the club')).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'close-note-needed',
    url: `/close-sheet?scenario=closing&now=${encodeURIComponent('2026-10-04T03:40:00+05:00')}`,
    prepare: async (page) => {
      await page.getByLabel('Cash counted').fill('21800');
      await expect(
        page.getByText('Write a note about the difference before you close.'),
      ).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'close-confirm',
    url: `/close-sheet?scenario=closing&now=${encodeURIComponent('2026-10-04T03:40:00+05:00')}`,
    prepare: async (page) => {
      await page.getByLabel('Cash counted').fill('21550');
      await page
        .getByLabel(/^Note about the difference/)
        .fill('Gave Rs 200 change from the drawer for a bank payment');
      await page.getByRole('button', { name: /^Close sheet 48/ }).click();
      await expect(
        page.getByRole('dialog', { name: 'Close sheet 48 with Rs 21,550 counted?' }),
      ).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'closed-nothing',
    url: `/close-sheet?scenario=empty&as=shabir&now=${encodeURIComponent('2026-10-04T03:40:00+05:00')}`,
    prepare: async (page) => {
      await page.getByLabel('Cash counted').fill('17950');
      await page.getByRole('button', { name: /^Close sheet/ }).click();
      await page.getByRole('button', { name: 'Yes, close it' }).click();
      await expect(page.getByText('Nothing was running')).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'today-nobody-waiting',
    url: `/today?scenario=empty&now=${encodeURIComponent('2026-10-03T22:30:00+05:00')}`,
    prepare: async (page) => {
      await expect(page.getByText('Nobody is waiting to pay.')).toBeVisible();
      await blur(page);
    },
  },
  // P07: a running table
  {
    id: 'panel-century',
    url: `/table/t3?now=${NIGHT}`,
    prepare: async (page) => {
      await expect(page.getByRole('dialog', { name: 'Table 3, Century' })).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'panel-change-type-open',
    url: `/table/t2?scenario=newGame&now=${encodeURIComponent('2026-10-03T21:53:00+05:00')}`,
    prepare: async (page) => {
      await expect(page.getByRole('dialog', { name: 'Table 2, single frame' })).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'move-a-room',
    url: `/table/r1/move?now=${encodeURIComponent('2026-10-03T21:43:00+05:00')}`,
    prepare: async (page) => {
      await expect(
        page.getByRole('region', { name: 'Move Room 1 to another table' }),
      ).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'stop-dispute',
    url: `/table/t6/stop?now=${encodeURIComponent('2026-10-03T21:50:00+05:00')}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Unpaid, dispute/ }).click();
      await page.getByRole('button', { name: 'Other' }).click();
      await blur(page);
    },
  },
  {
    id: 'damage-nothing-picked',
    url: `/table/t1/damage?now=${encodeURIComponent('2026-10-03T21:45:00+05:00')}`,
    prepare: async (page) => {
      await expect(page.getByRole('dialog', { name: 'Add a damage charge' })).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'undo-done',
    url: `/?scenario=newGame&now=${encodeURIComponent('2026-10-03T21:50:18+05:00')}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Undo', exact: true }).click();
      await expect(page.getByText('Game undone on Table 2.')).toBeVisible();
      await blur(page);
    },
    clip: { x: 0, y: 700, width: 1440, height: 200 },
  },
  {
    id: 'pause-all-pressed',
    url: `/?now=${NIGHT}`,
    prepare: async (page) => {
      await page.getByRole('contentinfo').getByRole('button', { name: 'Pause all' }).click();
      await expect(
        page.getByRole('alert').filter({ hasText: 'All games are paused' }),
      ).toBeVisible();
      await blur(page);
    },
  },
];

test.describe('screenshots for docs/NO_DESIGN.md', () => {
  test.beforeAll(() => mkdirSync(OUT, { recursive: true }));

  for (const shot of SHOTS) {
    test(shot.id, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      if (shot.fetchOverride) {
        const { match, status, body } = shot.fetchOverride;
        // The mock server answers inside the page, so the call is changed in the page, before it is sent.
        await page.addInitScript(
          ({ match, status, body }) => {
            const original = window.fetch.bind(window);
            window.fetch = (input, init) => {
              const url =
                typeof input === 'string'
                  ? input
                  : input instanceof Request
                    ? input.url
                    : String(input);
              if (url.includes(match)) {
                return Promise.resolve(
                  new Response(body === undefined ? null : JSON.stringify(body), {
                    status,
                    headers: { 'Content-Type': 'application/json' },
                  }),
                );
              }
              return original(input, init);
            };
          },
          { match, status, body },
        );
      }
      if (shot.priceKinds) {
        // The page asks for the board; the answer gets the prices, so the tiles show as they do once prices are set.
        await page.addInitScript((kinds) => {
          const original = window.fetch.bind(window);
          window.fetch = async (input, init) => {
            const response = await original(input, init);
            const url =
              typeof input === 'string'
                ? input
                : input instanceof Request
                  ? input.url
                  : String(input);
            if (!url.includes('/api/counter/board')) return response;
            const board = (await response.clone().json()) as {
              tables: { kind: string; price: number | null }[];
            };
            for (const table of board.tables) {
              if (table.kind in kinds) table.price = kinds[table.kind]!;
            }
            return new Response(JSON.stringify(board), {
              status: response.status,
              headers: { 'Content-Type': 'application/json' },
            });
          };
        }, shot.priceKinds);
      }
      await page.goto(shot.url);
      await page.waitForSelector('[data-app="counter"]', { timeout: 30_000 });
      await settle(page);
      await shot.prepare?.(page);
      await settle(page);
      await page.screenshot({ path: path.join(OUT, `${shot.id}.png`), clip: shot.clip });
    });
  }
});
