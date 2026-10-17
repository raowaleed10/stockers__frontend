import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { settle } from '../e2e/settle';
import { BUDGET, comparePngs, saveComparison, type Rect } from './compare';

/**
 * The full-screen visual tests (docs/10 §3). One test for each counter screen that is built: open its route with
 * the moment of the design (`now` in design/screens.json), put the page in the state the PNG shows, take a
 * screenshot at the design size and compare it with the approved PNG. Each steps adds its screens here.
 *
 * The side-by-side pictures (ours, the design, the difference in red) are in `test-results/screens`.
 */

interface ScreenEntry {
  n: number;
  name: string;
  app: string;
  route: string;
  file: string;
  size: string;
  now: string;
  scenario?: string;
}

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const ALL: ScreenEntry[] = JSON.parse(
  readFileSync(path.join(REPO, 'design/screens.json'), 'utf8'),
) as ScreenEntry[];

/**
 * What a screen needs before its picture is taken, and what to leave out of the comparison.
 * - Screen 1 is drawn with Zain picked and two digits typed.
 * - Screen 34's PNG shows 11:06 PM, a moment when Zain's time is already over (it ends at 11:00 PM), so the
 *   design's clock is a slip. Our big clock follows the app's clock (9:42 PM); that block is left out.
 * - Screens 4 and 5 draw an older action bar (no Expense, no Pause all, no "Backed up"). The developer chose the
 *   full bar everywhere (P05 plan), so the action bar is left out of those two comparisons.
 * - Screen 6 is Urdu: the names (players, the worker) and the "what for" lines of the waiting list are stored in English
 *   script, and the PNG draws them in Urdu script (P05 answer 2), so that text is left out of the comparison.
 */
const BUILT: Record<
  number,
  {
    prepare?: (page: Page) => Promise<void>;
    masks?: (page: Page) => Promise<Rect[]>;
    /** The seed's scenario that gives the screen its state (a game that is already running, for instance). */
    scenario?: string;
    /** Open this address instead of the design's, when the screen can only be reached from another one (screen 18). */
    route?: string;
    /** A moment other than the one in design/screens.json: the PNG's clock is whole minutes, its countdowns are not. */
    now?: string;
    /**
     * A dialog covers the whole screen, so what a person sees is the 1440 x 900 window, not the page behind it (the
     * board is taller than the screen and scrolls). The picture is taken of the window.
     */
    window?: boolean;
    /** Compare only this part of the design (a banner, a panel). The size of the page is then not compared. */
    crop?: Rect;
    /** Our picture is cut this far right and down from the design's: the real top bar is 83 px, the designs draw 70. */
    shift?: { x: number; y: number };
  }
> = {
  3: {},
  4: { masks: actionBar },
  5: { masks: actionBar },
  6: {
    // The names and the "what for" lines of the waiting list, and the worker's name, are stored in English script, and
    // the PNG draws them in Urdu script (P05 answer 2): that text is left out, so the amounts, the header, the total
    // and the rows are compared.
    masks: async (page) => {
      const boxes = await page.locator('aside li button > span:first-child').evaluateAll((nodes) =>
        nodes.map((node) => {
          const { x, y, width, height } = node.getBoundingClientRect();
          return { x, y: y + window.scrollY, width, height };
        }),
      );
      // The worker's name in the top bar is stored the same way (Zain, not زین).
      const chip = await page.getByRole('button', { name: /^سائن اِن/ }).boundingBox();
      return chip ? [...boxes, chip] : boxes;
    },
  },
  1: {
    prepare: async (page) => {
      await page.getByRole('button', { name: /Zain/ }).click();
      await page.getByRole('button', { name: '1', exact: true }).click();
      await page.getByRole('button', { name: '1', exact: true }).click();
      // The pad keeps focus on the key that was tapped; the PNG has no focus ring.
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    },
  },
  2: {},
  // Screens 7 to 12 are dialogs over the board. The PNG draws the header at 55 % behind them; a real dialog dims the whole
  // page with one layer (docs: Differences), so the comparison covers the dialog and a thin dark band for the page.
  7: {
    window: true,
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Century/ }).click();
      await blur(page);
    },
  },
  8: {
    window: true,
    prepare: async (page) => {
      const search = page.getByRole('searchbox', { name: 'Search players by name or phone' });
      await search.fill('ahmed');
      await page.getByRole('button', { name: /^Ahmed Nawaz/ }).click();
      await search.fill('ali');
      await page.getByRole('button', { name: /^Ali Akbar/ }).waitFor();
      await blur(page);
    },
    // "4 found" is a count the PNG got wrong for this seed ("ali" is also in Hamid Ali and Rizwan Ali).
    masks: async (page) => {
      const box = await page.getByRole('status').boundingBox();
      return box ? [box] : [];
    },
  },
  9: {
    window: true,
    prepare: async (page) => {
      const search = page.getByRole('searchbox', { name: /^Search a name or phone for side/ });
      for (const [typed, who] of [
        ['ahmed', /^Ahmed Nawaz/],
        ['ali ak', /^Ali Akbar/],
        ['imran', /^Imran Shah/],
      ] as const) {
        await search.fill(typed);
        await page.getByRole('button', { name: who }).click();
      }
      await blur(page);
    },
  },
  10: {
    window: true,
    prepare: async (page) => {
      await page.getByLabel('Full name').fill('Ali Shahzad');
      for (const digit of '030281') {
        await page.getByRole('button', { name: digit, exact: true }).click();
      }
      await blur(page);
    },
  },
  12: {
    window: true,
    scenario: 'newGame',
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Century/ }).click();
      await blur(page);
    },
  },
  // Screen 11: the panel of a running table. The designs draw a 70 px header and no bottom bar, so only the panel is
  // compared, with ours moved up by the 13 px the real top bar is taller.
  11: {
    window: true,
    crop: { x: 880, y: 70, width: 560, height: 817 },
    shift: { x: 0, y: 13 },
  },
  // Screen 13: the move and replace panels. Search "usm" and pick Ali, then Usman Tariq, as the PNG does.
  13: {
    window: true,
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Ali Raza/ }).click();
      await page.getByRole('searchbox', { name: 'Search the new player' }).fill('usm');
      await page.getByRole('button', { name: /^Usman Tariq/ }).click();
      await blur(page);
    },
  },
  // Screen 14: the PNG's toast says 1:42 left, 18 seconds after the game started at 9:50 on Table 2.
  14: {
    window: true,
    scenario: 'newGame',
    now: '2026-10-03T21:50:18+05:00',
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Players left halfway' }).click();
      await page.getByLabel('Note (optional)').fill('Tariq got a call and left after 12 minutes');
      await expect(page.getByText(/^Undo for \d:\d\d more$/)).toBeVisible();
      await blur(page);
    },
    // The countdown keeps running while the page loads, so the words with the seconds are left out.
    masks: async (page) => {
      const box = await page.getByText(/^Undo for/).boundingBox();
      return box ? [box] : [];
    },
  },
  // Screen 15 draws Ali, Cue, Rs 1,500 and a note already picked. Money starts empty on ours (D59, answered 17 Oct 2026),
  // so the page is not touched and the places where the PNG shows a picked state are left out of the comparison.
  15: {
    window: true,
    masks: async (page) => {
      const places = [
        page.getByRole('group', { name: 'Who pays?' }),
        page.getByRole('group', { name: 'What was damaged?' }),
        page.getByLabel('Note (required)'),
        page.getByText('Amount', { exact: true }).locator('..'),
        page.getByText(/statement as a damage charge/),
        page.getByRole('button', { name: 'Add to the bill' }),
      ];
      const boxes = await Promise.all(places.map((place) => place.boundingBox()));
      return boxes.filter((box): box is Rect => box !== null);
    },
  },
  // Screens 17 to 23 (P08). Each is a dialog over the live board, so the 1440 x 900 window is compared. The designs draw a
  // bare header at 55 %; the real page behind the scrim has the board (the same difference as screens 7 to 15).
  17: { window: true },
  // Screen 18 is reached by charging Bilal on screen 17, as a worker does. The countdown on Undo keeps running, so it is left out.
  18: {
    window: true,
    route: '/table/t1/end',
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Bilal Ahmed/ }).click();
      await expect(page.getByRole('dialog', { name: /added to Bilal Ahmed/ })).toBeVisible();
      await blur(page);
    },
    masks: async (page) => {
      const box = await page.getByRole('button', { name: /^Undo, / }).boundingBox();
      return box ? [box] : [];
    },
  },
  // Table 4 is 36 minutes into its frame at 9:44 PM (the PNG's clock says 9:46, a design slip: at 9:46 the frame is 38).
  19: {
    window: true,
    route: '/table/t4/end',
    now: '2026-10-03T21:44:00+05:00',
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Zubair Khan/ }).click();
      await expect(page.getByRole('dialog', { name: /^This frame took 36 minutes/ })).toBeVisible();
      await blur(page);
    },
  },
  // The PNG draws Side B picked, with half each.
  20: {
    window: true,
    prepare: async (page) => {
      await page.getByRole('button', { name: /Imran Shah and Naveed Akhtar/ }).click();
      await blur(page);
    },
  },
  // 42 min 35 sec: the seed starts the Century at 9:04:55 PM (37:05 on screen 3), the PNG at 9:04:25, so the moment is 9:47:30.
  21: { window: true, now: '2026-10-03T21:47:30+05:00' },
  // Danish Iqbal is picked, as the PNG draws it.
  22: {
    window: true,
    prepare: async (page) => {
      await page
        .getByRole('searchbox', { name: 'Search the player the room is under' })
        .fill('danish');
      await page
        .getByRole('list', { name: 'Search results' })
        .getByRole('button', { name: /^Danish Iqbal/ })
        .click();
      await blur(page);
    },
  },
  23: { window: true, scenario: 'roomEnd' },
  // Screens 24 to 27 (P09): the checkout pages draw their own header, so the whole 1440 x 900 page is compared (27 is a dialog).
  // Bilal's card has the brass border because his bill was opened last, as the PNG draws it.
  24: {
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Bilal Ahmed/ }).click();
      await page.getByRole('button', { name: 'Checkout' }).click();
      await expect(page.getByRole('button', { name: /^Bilal Ahmed/ })).toHaveAttribute(
        'aria-current',
        'true',
      );
      await blur(page);
    },
  },
  25: {},
  // Screen 26 is reached as the PNG is: a Rs 50 discount, then Paid part with Rs 600 cash and Rs 400 on Easypaisa. The PNG's
  // second line says "(regular player)", which is not one of the five reasons, so the sentence is left out.
  26: {
    route: '/checkout/bilal',
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Give a discount' }).click();
      const dialog = page.getByRole('dialog', { name: 'Give Bilal a discount' });
      await dialog.getByLabel('Discount amount').fill('50');
      await dialog.getByRole('button', { name: 'Rounded the bill' }).click();
      await dialog.getByRole('button', { name: 'Apply Rs 50 discount' }).click();
      await page.getByRole('button', { name: 'Paid part' }).click();
      for (const digit of '600')
        await page.getByRole('button', { name: digit, exact: true }).click();
      await page.getByRole('button', { name: '+ Easypaisa' }).click();
      for (const digit of '400')
        await page.getByRole('button', { name: digit, exact: true }).click();
      await expect(page.getByText('Typing the Easypaisa amount')).toBeVisible();
      await blur(page);
    },
    masks: async (page) => {
      const box = await page.getByText(/^Total Rs 1,300 after/).boundingBox();
      return box ? [box] : [];
    },
  },
  // Screen 27 draws 50, "Rounded the bill" and a note already filled in. Money starts empty on ours (nothing is chosen for
  // the worker), so the places where the PNG shows that state are left out.
  27: {
    window: true,
    masks: async (page) => {
      const places = [
        page.getByLabel('Discount amount'),
        page.getByRole('group', { name: 'Reason (required)' }),
        page.getByLabel('Note (optional)'),
        page.getByText('Discount', { exact: true }).locator('..'),
        page.getByText('New total').locator('..'),
        page.getByRole('button', { name: /^Apply/ }),
      ];
      const boxes = await Promise.all(places.map((place) => place.boundingBox()));
      return boxes.filter((box): box is Rect => box !== null);
    },
  },
  // Screen 16: the real board has tabs, a waiting list and the action bar that the PNG leaves out (P05 answer 1), so the
  // power-cut banner is compared, and the tiles are compared in tiles.counter.spec.ts.
  16: {
    crop: { x: 24, y: 99, width: 1392, height: 104 },
    shift: { x: 0, y: 2 },
  },
  // Screens 28 to 33 (P10).
  28: {
    // The PNG has Usman Tariq picked and a cold drink twice and chips once in the order.
    prepare: async (page) => {
      await page.getByRole('searchbox', { name: 'Search the player to charge' }).fill('usman');
      await page.getByRole('button', { name: /^Usman Tariq/ }).click();
      await page.getByRole('button', { name: /^Cold drink/ }).click();
      await page.getByRole('button', { name: /^Cold drink/ }).click();
      await page.getByRole('button', { name: /^Chips/ }).click();
      await blur(page);
    },
  },
  29: {
    window: true,
    // The PNG has Food, a note and Rs 500 picked.
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Food', exact: true }).click();
      await page.getByLabel('Note (required)').fill('Dinner for staff');
      await page.getByRole('button', { name: '500', exact: true }).click();
      await blur(page);
    },
    // The drawer figures are the story's 12,300 and 11,800 at 8:15 PM; the seed holds the whole night (17,950).
    masks: async (page) => {
      const box = await page.getByText('Cash in the drawer').locator('xpath=..').boundingBox();
      return box ? [box] : [];
    },
  },
  30: {
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Owe money/ }).click();
      await blur(page);
    },
    // The list is the story's five players with the amounts of 10:25 PM (Bilal has paid, Rs 300); the seed's list of the
    // players who owe is longer and its amounts differ, and the counts are 312, 41 and 6 in the PNG.
    masks: async (page) => {
      const list = await page.getByRole('list', { name: 'Player list' }).boundingBox();
      const chips = await page.getByRole('group', { name: 'Filter' }).boundingBox();
      return [list, chips].filter((box): box is NonNullable<typeof box> => box !== null);
    },
  },
  31: {
    // The PNG's waiting line (6 bills, Rs 5,100) is the checkout night after two payments; the seed's base night is different.
    masks: async (page) => {
      const box = await page
        .getByRole('button', { name: 'Go to checkout' })
        .locator('xpath=..')
        .boundingBox();
      return box ? [box] : [];
    },
  },
  32: {
    prepare: async (page) => {
      await page.getByLabel('Cash counted').fill('21550');
      await page
        .getByLabel(/^Note about the difference/)
        .fill('Gave Rs 200 change from the drawer for a bank payment');
      await blur(page);
    },
  },
  33: {},
  34: {
    masks: async (page) => {
      const box = await page.getByTestId('big-clock').boundingBox();
      return box ? [box] : [];
    },
  },
};

/** What a tap leaves behind: focus on the control. The PNG shows the screen, not a focus ring. */
const blur = (page: Page) =>
  page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

/** The action bar's box, to leave it out of a comparison. */
async function actionBar(page: Page): Promise<Rect[]> {
  const box = await page.locator('footer').last().boundingBox();
  return box ? [box] : [];
}

/** The route of the design with the demo clock added. Some routes show more than the path ("/  (= /board/snooker)"). */
function urlOf(screen: ScreenEntry): string {
  const built = BUILT[screen.n];
  const route = (built?.route ?? screen.route).split(/\s/)[0];
  const query = [`now=${encodeURIComponent(built?.now ?? screen.now)}`];
  const scenario = built?.scenario ?? screen.scenario;
  if (scenario) query.push(`scenario=${scenario}`);
  return route + (route.includes('?') ? '&' : '?') + query.join('&');
}

const screens = ALL.filter((screen) => screen.app === 'counter' && BUILT[screen.n]);

test.describe('counter screens against their PNGs', () => {
  let scratch: Page;
  test.beforeAll(async ({ browser }) => {
    scratch = await browser.newPage();
  });
  test.afterAll(async () => {
    await scratch.close();
  });

  for (const screen of screens) {
    test(`screen ${screen.n}: ${screen.name}`, async ({ page }) => {
      const [width, height] = screen.size.split('×').map(Number);
      await page.setViewportSize({ width, height });
      const problems: string[] = [];
      page.on('pageerror', (error) => problems.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error' && !/status of (40\d|429)/.test(message.text())) {
          problems.push(message.text());
        }
      });

      await page.goto(urlOf(screen));
      await page.waitForSelector('[data-app="counter"]', { timeout: 30_000 });
      await settle(page);
      await BUILT[screen.n].prepare?.(page);
      await settle(page);

      const masks = (await BUILT[screen.n].masks?.(page)) ?? [];
      const png = readFileSync(path.join(REPO, 'design/screens', `${screen.file}.png`));
      const shot = await page.screenshot({ fullPage: !BUILT[screen.n].window });
      const { crop, shift } = BUILT[screen.n];
      const result = await comparePngs(scratch, shot, png, { masks, crop, oursShift: shift });
      const picture = `${String(screen.n).padStart(2, '0')}-${screen.file}`;
      saveComparison('screens', picture, result);

      expect(problems, 'the page logged errors').toEqual([]);

      // The page must be the size the design draws; a different size means the layout moved.
      if (!BUILT[screen.n].crop) expect(result.ours, 'size of the page').toEqual(result.design);
      expect(
        result.ratio,
        `${(result.ratio * 100).toFixed(1)} % of the pixels differ (see test-results/screens)`,
      ).toBeLessThanOrEqual(BUDGET);
    });
  }
});
