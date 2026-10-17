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
const BASE = '/owner-dev';

type Clip = { x: number; y: number; width: number; height: number };

interface Shot {
  id: string;
  url: string;
  /** The screen size; a computer (1440 × 900) if left out. */
  size?: { width: number; height: number };
  prepare?: (page: Page) => Promise<void>;
  clip?: Clip;
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
];

test.describe('screenshots for docs/NO_DESIGN.md (owner portal)', () => {
  test.beforeAll(() => mkdirSync(OUT, { recursive: true }));

  for (const shot of SHOTS) {
    test(shot.id, async ({ page }, testInfo) => {
      // The same pictures are made once: the `phone` project would only make them again.
      test.skip(testInfo.project.name !== 'owner', 'made on the owner project');
      await page.setViewportSize(shot.size ?? { width: 1440, height: 900 });
      await page.goto(shot.url);
      await page.waitForSelector('[data-app="owner"]', { timeout: 30_000 });
      await settle(page);
      await shot.prepare?.(page);
      await settle(page);
      await page.screenshot({ path: path.join(OUT, `${shot.id}.png`), clip: shot.clip });
    });
  }
});
