import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { settle } from './settle';

/**
 * The owner shell and sign-in of P11 (docs/10 §4): sign-in at the private address, the guard, the sidebar on a computer, and the
 * bottom tabs and the More sheet on a phone. This spec runs twice, on the `owner` project (1440 wide) and on the `phone`
 * project (390 wide), and each test says which one it is for. Also axe, touch sizes and sideways scrolling.
 */

const NIGHT = encodeURIComponent('2026-10-03T22:30:00+05:00');
const BASE = '/owner-dev';

const onPhone = () => test.info().project.name === 'phone';

/** Opens an owner page and watches for errors the page logs (a refused sign-in is not one). */
async function open(page: Page, path: string, extra = '') {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/status of (40\d|429)/.test(message.text())) {
      problems.push(message.text());
    }
  });
  await page.goto(`${BASE}${path}?now=${NIGHT}${extra}`);
  await page.waitForSelector('[data-app="owner"]', { timeout: 30_000 });
  await settle(page);
  return problems;
}

test.describe('owner sign-in (screens 35 and 52)', () => {
  test('Adil signs in with a password and lands on the dashboard, inside the frame', async ({
    page,
  }) => {
    const problems = await open(page, '/sign-in', '&as=none');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await page.getByRole('radio', { name: /Adil Farooq/ }).check();
    await page.getByRole('textbox', { name: 'Password' }).fill('stockers48');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${BASE}/?$`));
    await expect(page.getByRole('heading', { level: 1, name: /^Today/ })).toBeVisible();
    if (onPhone()) {
      await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
    } else {
      await expect(page.getByRole('navigation', { name: 'Owner menu' })).toContainText(
        'Adil Farooq',
      );
    }
    expect(problems).toEqual([]);
  });

  test('a signed-out visit to a page goes to /sign-in and signing in opens that page', async ({
    page,
  }) => {
    await open(page, '/players', '&as=none');
    await expect(page).toHaveURL(new RegExp(`${BASE}/sign-in`));
    await page.getByRole('textbox', { name: 'Password' }).fill('stockers48');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${BASE}/players`));
    await expect(page.getByRole('heading', { name: 'Players and credit' })).toBeVisible();
  });

  test('a wrong password says so, and after 5 wrong tries the page says to wait 15 minutes', async ({
    page,
  }) => {
    await open(page, '/sign-in', '&as=none');
    const button = page.getByRole('button', { name: 'Sign in', exact: true });
    await button.click(); // no password: wrong
    await expect(page.getByRole('alert')).toHaveText('Wrong password. Try again.');
    for (let i = 0; i < 4; i += 1) await button.click();
    await expect(page.getByRole('alert')).toHaveText('Too many tries. Wait 15 minutes.');
    await expect(button).toBeDisabled();
  });

  test('the page is the right look for the screen: panel and card on a computer, one column on a phone', async ({
    page,
  }) => {
    await open(page, '/sign-in', '&as=none');
    if (onPhone()) {
      await expect(page.getByText('Snooker club, Mian Plaza')).toBeVisible();
      await expect(page.getByText('Owner portal')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Show password' })).toBeVisible();
    } else {
      await expect(page.getByText('Owner portal')).toBeVisible();
      await expect(page.getByText(/Private address\./)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Show password' })).toHaveCount(0);
    }
  });

  for (const lang of ['en', 'ur'] as const) {
    test(`has no serious accessibility issues, every control is 44 px and nothing scrolls sideways (${lang})`, async ({
      page,
    }) => {
      test.slow();
      await open(page, '/sign-in', `&as=none&lang=${lang}`);
      const results = await new AxeBuilder({ page }).analyze();
      const serious = results.violations.filter(
        (item) => item.impact === 'serious' || item.impact === 'critical',
      );
      expect(serious.map((item) => `${item.id}: ${item.help}`)).toEqual([]);

      const small = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('button, a[href], select, textarea')]
          .filter((el) => el.offsetParent !== null)
          .map((el) => ({
            name: el.textContent?.trim() || el.getAttribute('aria-label'),
            ...el.getBoundingClientRect().toJSON(),
          }))
          .filter((box) => box.height < 43.5 || box.width < 43.5)
          .map((box) => `${box.name}: ${Math.round(box.width)} x ${Math.round(box.height)}`),
      );
      expect(small, 'controls under 44 px').toEqual([]);
      const wide = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(wide, 'sideways scroll').toBe(false);
    });
  }
});

test.describe('the owner frame (screens 36 and 53)', () => {
  test('on a computer the sidebar opens every page, and Sign out goes back to /sign-in', async ({
    page,
  }) => {
    test.skip(onPhone(), 'the sidebar is for a wide screen');
    const problems = await open(page, '/');
    const nav = page.getByRole('navigation', { name: 'Owner menu' });
    await expect(nav.getByRole('link')).toHaveCount(11);
    for (const [name, path] of [
      ['Live tables', '/live'],
      ['Sheets', '/sheets'],
      ['Players and credit', '/players'],
      ['Reports', '/reports'],
      ['Games and prices', '/prices'],
      ['Canteen', '/canteen'],
      ['Expenses', '/expenses'],
      ['Activity', '/activity'],
      ['Workers', '/workers'],
      ['Settings', '/settings'],
      ['Dashboard', '/'],
    ] as const) {
      await nav.getByRole('link', { name: new RegExp(`^${name}( \\d+ new)?$`) }).click();
      await expect(page).toHaveURL(new RegExp(`${BASE}${path === '/' ? '/?' : path}$`));
      // The dashboard is titled with the day ("Today, Sat 3 Oct"); the other pages with their name.
      await expect(
        page.getByRole('heading', { level: 1, name: path === '/' ? /^Today/ : name }),
      ).toBeVisible();
    }
    await nav.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(new RegExp(`${BASE}/sign-in`));
    // A hard reload of a page behind the guard still asks him to sign in.
    await page.goto(`${BASE}/expenses?now=${NIGHT}&as=none`);
    await expect(page).toHaveURL(new RegExp(`${BASE}/sign-in`));
    expect(problems).toEqual([]);
  });

  test('on a phone the tabs open Live, Sheets and Players, and More lists the other pages', async ({
    page,
  }) => {
    test.skip(!onPhone(), 'the tab bar is for a phone');
    const problems = await open(page, '/');
    await expect(page.getByRole('link', { name: 'Notifications, 4 new' })).toBeVisible();
    const tabs = page.getByRole('navigation', { name: 'Main' });
    for (const [name, path] of [
      ['Live', '/live'],
      ['Sheets', '/sheets'],
      ['Players', '/players'],
      ['Home', '/'],
    ] as const) {
      await tabs.getByRole('link', { name }).click();
      await expect(page).toHaveURL(new RegExp(`${BASE}${path === '/' ? '/?' : path}$`));
      await expect(tabs.getByRole('link', { name })).toHaveAttribute('aria-current', 'page');
    }
    await tabs.getByRole('button', { name: 'More' }).click();
    const sheet = page.getByRole('dialog', { name: 'More' });
    await expect(sheet.getByRole('link')).toHaveCount(7);
    await sheet.getByRole('link', { name: 'Expenses' }).click();
    await expect(page).toHaveURL(new RegExp(`${BASE}/expenses$`));
    await expect(sheet).toHaveCount(0);
    await expect(tabs.getByRole('button', { name: 'More' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await page.getByRole('link', { name: 'Notifications, 4 new' }).click();
    await expect(page).toHaveURL(new RegExp(`${BASE}/alerts$`));
    expect(problems).toEqual([]);
  });

  for (const lang of ['en', 'ur'] as const) {
    test(`the frame has no serious accessibility issues, 44 px targets and no sideways scroll (${lang})`, async ({
      page,
    }) => {
      test.slow();
      await open(page, '/live', `&lang=${lang}`);
      if (onPhone()) {
        await page.locator('nav button[aria-haspopup="dialog"]').click();
        await expect(page.getByRole('dialog')).toBeVisible();
      }
      const results = await new AxeBuilder({ page }).analyze();
      const serious = results.violations.filter(
        (item) => item.impact === 'serious' || item.impact === 'critical',
      );
      expect(serious.map((item) => `${item.id}: ${item.help}`)).toEqual([]);
      const small = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('button, a[href]')]
          .filter((el) => el.offsetParent !== null)
          .map((el) => ({
            name: el.textContent?.trim() || el.getAttribute('aria-label'),
            ...el.getBoundingClientRect().toJSON(),
          }))
          .filter((box) => box.height < 43.5)
          .map((box) => `${box.name}: ${Math.round(box.width)} x ${Math.round(box.height)}`),
      );
      expect(small, 'controls under 44 px tall').toEqual([]);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
        'sideways scroll',
      ).toBe(false);
    });
  }
});
