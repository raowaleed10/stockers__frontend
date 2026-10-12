import { expect, test, type Page } from '@playwright/test';
import { settle } from './settle';

/**
 * The checks on `/owner-dev/dev/data` (prompts/P03): the owner API answers an owner, signs one in with
 * any password, and answers a counter session with 404. Runs on the desktop and the phone project.
 */

const PATH = '/owner-dev/dev/data';

async function open(page: Page, query = '') {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/status of (40\d|429)/.test(message.text())) {
      problems.push(message.text());
    }
  });
  await page.goto(`${PATH}${query}`);
  // The page starts the mock server before it draws; wait for it, then for the layout to be quiet.
  await page.waitForSelector('main', { timeout: 30_000 });
  await settle(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Data check' })).toBeVisible();
  return problems;
}

test.describe('/owner-dev/dev/data', () => {
  test('lists the workers and every live table from the owner API, with no errors', async ({
    page,
  }) => {
    const problems = await open(page);
    await expect(page.getByTestId('session')).toContainText('Aqil Farooq is signed in');
    const workers = page.locator('[data-testid="workers"] > li');
    await expect(workers).toHaveCount(2);
    await expect(workers.nth(0)).toContainText('Shabir');
    await expect(workers.nth(1)).toContainText('Zain');
    await expect(workers.nth(1)).toContainText('Signed in now, since 2:06 PM');
    await expect(page.locator('[data-testid="live"] tbody tr')).toHaveCount(28);
    await expect(page.locator('[data-table="t3"]')).toContainText('Under Saad Hussain');
    await expect(page.locator('[data-table="r1"]')).toContainText('Rs 1,500');
    expect(problems).toEqual([]);
  });

  test('shows the sign-in record as screen 50 draws it', async ({ page }) => {
    await open(page);
    // Shabir: signed in at 2:04 AM and signed out automatically at 10:00 AM.
    await expect(page.getByTestId('status-shabir')).toHaveText(
      'Last signed in Today 2:04 AM to 10:00 AM',
    );
    await expect(page.getByTestId('signs-out-shabir')).toHaveCount(0);
    const shabir = page.locator('[data-testid="events-shabir"] li');
    await expect(shabir).toHaveCount(2);
    await expect(shabir.nth(0)).toContainText('Signed out automatically at the end of his time');
    await expect(shabir.nth(1)).toContainText('Signed in');
    // Zain: in now since 2:06 PM, and signed out automatically at 11:00 PM.
    await expect(page.getByTestId('status-zain')).toHaveText('Signed in now, since 2:06 PM');
    await expect(page.getByTestId('signs-out-zain')).toHaveText(
      'Signed out automatically at 11:00 PM',
    );
    await expect(page.locator('[data-testid="events-zain"] li')).toHaveCount(1);
  });

  test('a counter session gets 404 from every owner call, as if the owner API did not exist', async ({
    page,
  }) => {
    await open(page, '?as=zain');
    await expect(page.getByTestId('session')).toContainText('Nobody is signed in.');
    await expect(page.getByTestId('refused')).toContainText('NOT_FOUND');
    await expect(page.locator('[data-testid="workers"] > li')).toHaveCount(0);
    await expect(page.locator('[data-testid="live"] tbody tr')).toHaveCount(0);
  });

  test('with nobody signed in the owner API answers 401, and any password signs an owner in', async ({
    page,
  }) => {
    await open(page, '?as=none');
    await expect(page.getByTestId('refused')).toContainText('UNAUTHENTICATED');
    await page.getByRole('button', { name: /Sign in as Aqil/ }).click();
    await expect(page.getByTestId('session')).toContainText('Aqil Farooq is signed in');
    await expect(page.locator('[data-testid="live"] tbody tr')).toHaveCount(28);
  });

  test('does not scroll sideways', async ({ page }) => {
    await open(page);
    await expect(page.locator('[data-testid="live"] tbody tr')).toHaveCount(28);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
