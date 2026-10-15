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
      await page.goto(shot.url);
      await page.waitForSelector('[data-app="counter"]', { timeout: 30_000 });
      await settle(page);
      await shot.prepare?.(page);
      await settle(page);
      await page.screenshot({ path: path.join(OUT, `${shot.id}.png`), clip: shot.clip });
    });
  }
});
