import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { settle } from './settle';

/**
 * The sign-in flows of P04 (docs/10 §4, "Sign-in times"): Zain signs in at 21:42 and lands on the board,
 * Shabir gets screen 2, the warning shows at 22:51, Zain is signed out at 23:00, and the screen locks after a
 * while and opens with the right PIN. Also axe, touch sizes and sideways scrolling on every screen of the step.
 */

const NIGHT = encodeURIComponent('2026-10-03T21:42:00+05:00');

/** Opens a counter page and watches for errors the page logs (a refused sign-in is not one). */
async function open(page: Page, url: string) {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/status of (40\d|429)/.test(message.text())) {
      problems.push(message.text());
    }
  });
  await page.goto(url);
  await page.waitForSelector('[data-app="counter"]', { timeout: 30_000 });
  await settle(page);
  return problems;
}

const key = (page: Page, digit: string) => page.getByRole('button', { name: digit, exact: true });

async function type(page: Page, digits: string) {
  for (const digit of digits) await key(page, digit).click();
}

test.describe('worker sign-in (screens 1 and 2)', () => {
  test('Zain signs in with 2222 at 21:42 and lands on / inside the frame', async ({ page }) => {
    const problems = await open(page, `/sign-in?now=${NIGHT}`);
    await expect(page.getByRole('heading', { name: 'Who is working?' })).toBeVisible();
    await expect(
      page.getByText('Sheet 48 is open since 11:10 AM. 6 of 9 tables in use.'),
    ).toBeVisible();
    await page.getByRole('button', { name: /Zain/ }).click();
    await expect(page.getByText('Zain, enter your 4-digit PIN')).toBeVisible();
    await type(page, '2222');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: /Signed in: Zain/ })).toContainText(
      'Until 11:00 PM',
    );
    await expect(page.getByRole('button', { name: 'Notifications, 3 new' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Checkout' })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('Shabir at 21:42 gets "Not your time to sign in", and OK clears the selection', async ({
    page,
  }) => {
    const problems = await open(page, `/sign-in?now=${NIGHT}`);
    await page.getByRole('button', { name: /Shabir/ }).click();
    await type(page, '1111');
    const alert = page.getByRole('alert');
    await expect(alert.getByRole('heading', { name: 'Not your time to sign in' })).toBeVisible();
    await expect(alert).toContainText('Shabir can sign in from 2:00 AM to 10:00 AM.');
    await expect(alert).toContainText('It is 9:42 PM now.');
    await expect(alert).toContainText('Only an owner can change sign-in times.');
    await expect(page).toHaveURL(/\/sign-in/);
    await alert.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Shabir/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(problems).toEqual([]);
  });

  test('the deep link /sign-in?worker=shabir opens on that alert', async ({ page }) => {
    await open(page, `/sign-in?worker=shabir&now=${NIGHT}`);
    await expect(page.getByRole('alert')).toContainText(
      'Shabir can sign in from 2:00 AM to 10:00 AM.',
    );
    await expect(page.getByRole('button', { name: /Shabir/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('a wrong PIN says "Wrong PIN. Try again." and empties the dots', async ({ page }) => {
    await open(page, `/sign-in?now=${NIGHT}`);
    await page.getByRole('button', { name: /Zain/ }).click();
    await type(page, '9999');
    await expect(page.getByText('Wrong PIN. Try again.')).toBeVisible();
    await expect(page.getByRole('img', { name: '0 of 4 digits entered' })).toBeVisible();
    await expect(page.getByRole('img', { name: '0 of 4 digits entered' })).toHaveClass(/pin-shake/);
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('five wrong tries say "Wait 5 minutes"', async ({ page }) => {
    await open(page, `/sign-in?now=${NIGHT}`);
    await page.getByRole('button', { name: /Zain/ }).click();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await type(page, '9999');
      await expect(page.getByRole('img', { name: '0 of 4 digits entered' })).toBeVisible();
    }
    await expect(page.getByText('Wait 5 minutes')).toBeVisible();
  });

  test('has no way to sign in as an owner, and no link at all', async ({ page }) => {
    await open(page, `/sign-in?now=${NIGHT}`);
    await expect(page.getByRole('link')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /owner/i })).toHaveCount(0);
    expect((await page.locator('body').innerText()).toLowerCase()).not.toContain('owner');
    expect(await page.locator('body [href]').count()).toBe(0);
  });

  test('a page with no session goes to the sign-in page, and Page not found names no owner area', async ({
    page,
  }) => {
    await open(page, `/checkout?as=none&now=${NIGHT}`);
    await expect(page).toHaveURL(/\/sign-in/);
    await page.goto('/owner-dev/sign-in');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });
});

test.describe('the end of a worker’s time (D51)', () => {
  test('at 22:51 Zain sees the banner across the top and nothing else changes', async ({
    page,
  }) => {
    await open(page, `/?now=${encodeURIComponent('2026-10-03T22:51:00+05:00')}`);
    const banner = page.getByRole('status');
    await expect(banner).toHaveText(
      'Your sign-in time ends at 11:00 PM. Finish what you are doing.',
    );
    // It runs across the top, above the top bar.
    const bannerBox = (await banner.boundingBox())!;
    const barBox = (await page.getByRole('banner').boundingBox())!;
    expect(bannerBox.y).toBe(0);
    expect(bannerBox.width).toBe(1440);
    expect(bannerBox.y + bannerBox.height).toBeLessThanOrEqual(barBox.y + 1);
    await expect(page.getByRole('button', { name: /Signed in: Zain/ })).toBeVisible();
  });

  test('at 21:42 there is no banner', async ({ page }) => {
    await open(page, `/?now=${NIGHT}`);
    await expect(page.getByRole('button', { name: /Signed in: Zain/ })).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
  });

  test('at 23:00 he is signed out and the app returns to the sign-in page', async ({ page }) => {
    test.slow();
    await open(page, `/?now=${encodeURIComponent('2026-10-03T22:59:48+05:00')}`);
    await expect(page.getByRole('status')).toBeVisible();
    await page.waitForURL('**/sign-in', { timeout: 40_000 });
    await expect(page.getByRole('heading', { name: 'Who is working?' })).toBeVisible();
    // His time is over, so he is "Not now" on the cards, from the server's clock.
    await expect(page.getByRole('button', { name: /Zain/ })).toContainText('Not now');
  });
});

test.describe('the lock (screen 34)', () => {
  test('locks after a while without a touch and opens with the right PIN', async ({ page }) => {
    test.slow();
    // ?lockAfter shortens the 5 minutes, in development only.
    await open(page, `/?lockAfter=3&now=${NIGHT}`);
    const lock = page.getByRole('dialog', { name: 'Zain, enter your PIN' });
    await expect(lock).toBeVisible({ timeout: 15_000 });
    await expect(lock.getByText('Tables right now')).toBeVisible();
    await expect(lock.getByText('5 playing')).toBeVisible();
    await expect(lock.getByText('1 over 30 min')).toBeVisible();
    await expect(lock.getByText('2 free')).toBeVisible();
    await expect(lock.getByText('1 out of order')).toBeVisible();
    await type(page, '0000');
    await expect(lock.getByText('Wrong PIN. Try again.')).toBeVisible();
    await type(page, '2222');
    await expect(lock).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Signed in: Zain/ })).toBeVisible();
  });

  test('a touch inside the time keeps the screen open', async ({ page }) => {
    await open(page, `/?lockAfter=4&now=${NIGHT}`);
    for (let tap = 0; tap < 4; tap += 1) {
      await page.waitForTimeout(2000);
      await page.getByRole('button', { name: 'Notifications, 3 new' }).click();
    }
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('the Lock button locks at once, and a reload does not get around it', async ({ page }) => {
    await open(page, `/?now=${NIGHT}`);
    await page.getByRole('button', { name: 'Lock' }).click();
    await expect(page.getByRole('dialog', { name: 'Zain, enter your PIN' })).toBeVisible();
    await page.reload();
    await page.waitForSelector('[data-app="counter"]');
    await expect(page.getByRole('dialog', { name: 'Zain, enter your PIN' })).toBeVisible();
  });

  test('Switch worker on the lock screen goes to the sign-in page, and the lock is gone there', async ({
    page,
  }) => {
    await open(page, `/?locked=1&now=${NIGHT}`);
    await page.getByRole('button', { name: 'Switch worker', exact: true }).click();
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByRole('heading', { name: 'Who is working?' })).toBeVisible();
    await page.getByRole('button', { name: /Zain/ }).click();
    await type(page, '2222');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('Escape does not close the lock, and Tab stays inside it', async ({ page }) => {
    await open(page, `/?locked=1&now=${NIGHT}`);
    const lock = page.getByRole('dialog', { name: 'Zain, enter your PIN' });
    await page.keyboard.press('Escape');
    await expect(lock).toBeVisible();
    for (let step = 0; step < 16; step += 1) {
      await page.keyboard.press('Tab');
      expect(await lock.evaluate((node) => node.contains(document.activeElement))).toBe(true);
    }
  });

  test('the worker chip offers Switch worker, and it signs him out', async ({ page }) => {
    await open(page, `/?now=${NIGHT}`);
    await page.getByRole('button', { name: /Signed in: Zain/ }).click();
    await page.getByRole('button', { name: 'Switch worker', exact: true }).click();
    await expect(page).toHaveURL(/\/sign-in/);
  });
});

/** The screens of this step, each in the state a PNG shows (and screen 2 as the server answers it). */
const STATES: { name: string; url: string; prepare?: (page: Page) => Promise<void> }[] = [
  {
    name: 'screen 1, Zain picked',
    url: `/sign-in?now=${NIGHT}`,
    prepare: async (page) => {
      await page.getByRole('button', { name: /Zain/ }).click();
      await type(page, '22');
    },
  },
  { name: 'screen 2, not your time', url: `/sign-in?worker=shabir&now=${NIGHT}` },
  { name: 'the frame at /', url: `/?now=${NIGHT}` },
  {
    name: 'the frame with the banner',
    url: `/?now=${encodeURIComponent('2026-10-03T22:55:00+05:00')}`,
  },
  { name: 'screen 34, locked', url: `/?locked=1&now=${NIGHT}` },
];

for (const lang of ['en', 'ur']) {
  test.describe(`every screen of the step, ${lang === 'ur' ? 'in Urdu' : 'in English'}`, () => {
    for (const state of STATES) {
      const url = state.url + (lang === 'ur' ? '&lang=ur' : '');

      test(`${state.name}: no serious or critical accessibility issues`, async ({ page }) => {
        const problems = await open(page, url);
        await state.prepare?.(page);
        await settle(page);
        const results = await new AxeBuilder({ page }).analyze();
        const serious = results.violations.filter(
          (violation) => violation.impact === 'serious' || violation.impact === 'critical',
        );
        const summary = serious.map((violation) => ({
          rule: violation.id,
          impact: violation.impact,
          where: violation.nodes.slice(0, 4).map((node) => node.target.join(' ')),
        }));
        expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
        expect(problems).toEqual([]);
      });

      test(`${state.name}: every control is at least 56 px and nothing scrolls sideways`, async ({
        page,
      }) => {
        await open(page, url);
        await state.prepare?.(page);
        await settle(page);
        const controls = await page.$$eval('button', (buttons) =>
          buttons
            .map((button) => ({
              what: (button.getAttribute('aria-label') ?? button.textContent ?? '')
                .trim()
                .slice(0, 40),
              height: button.getBoundingClientRect().height,
            }))
            .filter((control) => control.height > 0),
        );
        expect(controls.length).toBeGreaterThan(3);
        expect(
          controls.filter((control) => control.height < 56),
          'controls under 56 px',
        ).toEqual([]);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }
  });
}

test.describe('Urdu', () => {
  test('mirrors the sign-in page and keeps the keypad 1-2-3 from the left', async ({ page }) => {
    await open(page, `/sign-in?lang=ur&worker=zain&now=${NIGHT}`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    const felt = (await page.getByTestId('big-clock').boundingBox())!;
    expect(felt.x).toBeGreaterThan(720); // the green panel is on the start side, which is the right
    const one = (await key(page, '1').boundingBox())!;
    const three = (await key(page, '3').boundingBox())!;
    expect(one.x).toBeLessThan(three.x);
  });

  test('the big clock keeps its digits and its order', async ({ page }) => {
    await open(page, `/sign-in?lang=ur&now=${NIGHT}`);
    await expect(page.getByTestId('big-clock')).toContainText('9:42');
  });
});
