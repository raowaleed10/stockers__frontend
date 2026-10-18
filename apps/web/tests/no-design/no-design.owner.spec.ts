import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { settle } from '../e2e/settle';

/**
 * The screenshots of docs/NO_DESIGN.md for the owner portal: every piece of it that is built without an approved PNG, in the
 * state the owners should look at. `npm run shots:no-design` makes them again with the counter's. Each one saves a picture to
 * `docs/no-design/<id>.png`. Add an entry here and a section in docs/NO_DESIGN.md with the same id
 * (`src/no-design-doc.test.ts` fails if the two do not match).
 */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const OUT = path.join(REPO, 'docs/no-design');
const NIGHT = encodeURIComponent('2026-10-03T22:30:00+05:00');
const AFTER = encodeURIComponent('2026-10-04T03:45:00+05:00');
const BASE = '/owner-dev';

type Clip = { x: number; y: number; width: number; height: number };

interface Shot {
  id: string;
  url: string;
  /** The screen size; a computer (1440 × 900) if left out. */
  size?: { width: number; height: number };
  /** Runs before the page opens: a change to what the page asks for, to reach a state the mock never gives. */
  beforeLoad?: (page: Page) => Promise<void>;
  prepare?: (page: Page) => Promise<void>;
  clip?: Clip;
  /** The clip is a part of the whole page, not of the first screen. */
  fullPage?: boolean;
}

/** What a tap leaves behind: focus on the control. A picture should show the screen, not a focus ring. */
const blur = (page: Page) =>
  page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

const SHOTS: Shot[] = [
  {
    id: 'owner-signin-wrong',
    url: `${BASE}/sign-in?now=${NIGHT}&as=none`,
    prepare: async (page) => {
      await page.getByRole('textbox', { name: 'Password' }).fill('x');
      await page.getByRole('textbox', { name: 'Password' }).fill('');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page.getByRole('alert')).toHaveText('Wrong password. Try again.');
      await blur(page);
    },
  },
  {
    id: 'owner-signin-wait',
    url: `${BASE}/sign-in?now=${NIGHT}&as=none`,
    prepare: async (page) => {
      const button = page.getByRole('button', { name: 'Sign in', exact: true });
      for (let i = 0; i < 5; i += 1) await button.click();
      await expect(page.getByRole('alert')).toHaveText('Too many tries. Wait 15 minutes.');
      await blur(page);
    },
  },
  {
    id: 'owner-sidebar-signout',
    url: `${BASE}/live?now=${NIGHT}`,
    prepare: async (page) => {
      await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
      await blur(page);
    },
    clip: { x: 0, y: 700, width: 260, height: 200 },
  },
  {
    id: 'owner-more-sheet',
    url: `${BASE}/live?now=${NIGHT}`,
    size: { width: 390, height: 844 },
    prepare: async (page) => {
      await page
        .getByRole('navigation', { name: 'Main' })
        .getByRole('button', { name: 'More' })
        .click();
      await expect(page.getByRole('dialog', { name: 'More' })).toBeVisible();
      await blur(page);
    },
  },
  // P12: the states the owners' screens leave out.
  {
    id: 'dashboard-needs-nothing',
    url: `${BASE}/?now=${NIGHT}`,
    // The mock's night always has something to look at, so the answer of the dashboard is changed to say it has not.
    beforeLoad: async (page) => {
      await page.addInitScript(() => {
        const original = window.fetch.bind(window);
        window.fetch = async (input, init) => {
          const response = await original(input, init);
          const url =
            typeof input === 'string'
              ? input
              : input instanceof Request
                ? input.url
                : String(input);
          if (!url.includes('/api/owner/dashboard')) return response;
          const body = (await response.clone().json()) as Record<string, unknown>;
          return new Response(JSON.stringify({ ...body, needsLook: [] }), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' },
          });
        };
      });
    },
    prepare: async (page) => {
      await expect(page.getByText('Nothing needs a look.')).toBeVisible();
      await blur(page);
    },
    fullPage: true,
    clip: { x: 1030, y: 1160, width: 400, height: 300 },
  },
  {
    id: 'dashboard-chart-tooltip',
    url: `${BASE}/?now=${NIGHT}`,
    prepare: async (page) => {
      const chart = page.getByRole('img', { name: /^Bar chart of daily earnings/ });
      const box = await chart.boundingBox();
      if (!box) throw new Error('The chart is not on the page');
      await page.mouse.move(box.x + box.width * 0.78, box.y + box.height * 0.6);
      await expect(page.getByRole('status')).toBeVisible();
    },
    fullPage: true,
    clip: { x: 241, y: 520, width: 1200, height: 320 },
  },
  {
    id: 'activity-decided',
    url: `${BASE}/activity?now=${AFTER}&scenario=closed`,
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Faisal pays' }).click();
      await expect(page.getByText('Dispute on Table 3 decided')).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'activity-none-for-filter',
    url: `${BASE}/activity?now=${AFTER}&scenario=closed`,
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Damage charges 1' }).click();
      await page.getByRole('button', { name: 'Adil', exact: true }).click();
      await expect(page.getByText('Nothing here for this filter.')).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'activity-phone',
    url: `${BASE}/activity?now=${AFTER}&scenario=closed`,
    size: { width: 390, height: 844 },
    prepare: async (page) => {
      await expect(page.getByRole('region', { name: 'Waiting for an owner' })).toBeVisible();
      await blur(page);
      // A tall picture of the page: the bar that stays at the bottom of the screen would sit in the middle of it.
      await page.evaluate(() => {
        for (const el of document.querySelectorAll<HTMLElement>('body *')) {
          if (getComputedStyle(el).position === 'fixed') el.style.display = 'none';
        }
      });
    },
    // The banner, the chips and the first rows of the list.
    fullPage: true,
    clip: { x: 0, y: 0, width: 390, height: 1320 },
  },
  {
    id: 'reports-year',
    url: `${BASE}/reports?now=${NIGHT}`,
    prepare: async (page) => {
      await page.getByRole('radio', { name: 'Year' }).click();
      await expect(page.getByText('Earned through the year, month by month')).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'reports-day',
    url: `${BASE}/reports?now=${NIGHT}`,
    prepare: async (page) => {
      await page.getByRole('radio', { name: 'Day' }).click();
      await expect(page.getByText('Credit pending at day end')).toBeVisible();
      await blur(page);
    },
  },
  {
    id: 'reports-phone',
    url: `${BASE}/reports?now=${NIGHT}`,
    size: { width: 390, height: 844 },
    prepare: async (page) => {
      await expect(page.getByRole('region', { name: 'Totals' })).toBeVisible();
      await blur(page);
    },
  },
];

test.describe('screenshots for docs/NO_DESIGN.md (owner portal)', () => {
  test.beforeAll(() => mkdirSync(OUT, { recursive: true }));

  for (const shot of SHOTS) {
    test(shot.id, async ({ page }, testInfo) => {
      // The same pictures are made once: the `phone` project would only make them again.
      test.skip(testInfo.project.name !== 'owner', 'made on the owner project');
      await page.setViewportSize(shot.size ?? { width: 1440, height: 900 });
      await shot.beforeLoad?.(page);
      await page.goto(shot.url);
      await page.waitForSelector('[data-app="owner"]', { timeout: 30_000 });
      await settle(page);
      await shot.prepare?.(page);
      await settle(page);
      await page.screenshot({
        path: path.join(OUT, `${shot.id}.png`),
        clip: shot.clip,
        fullPage: shot.fullPage,
      });
    });
  }
});
