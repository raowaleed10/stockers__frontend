import { expect, test } from '@playwright/test';

test('the counter board loads in Barlow on the counter background', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://localhost')) external.push(request.url());
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Table 1, playing' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);

  const look = await page.evaluate(() => ({
    font: getComputedStyle(document.body).fontFamily,
    background: getComputedStyle(document.body).backgroundColor,
    barlowLoaded: [...document.fonts].some(
      (face) => face.family.replace(/"/g, '') === 'Barlow' && face.status === 'loaded',
    ),
  }));
  expect(look.font).toContain('Barlow');
  expect(look.background).toBe('rgb(22, 17, 13)'); // --c-page #16110D
  expect(look.barlowLoaded).toBe(true);
  expect(external).toEqual([]); // fonts and scripts come from this server, not the internet
});

test('any other address shows a plain "Page not found" with no link to anything', async ({
  page,
}) => {
  await page.goto('/nowhere/deeper');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.locator('a')).toHaveCount(0);
});

test('the mock API answers in the browser', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Table 1, playing' })).toBeVisible();
  const body = await page.evaluate(() => fetch('/api/counter/health').then((r) => r.json()));
  expect(body).toEqual({ ok: true });
});

test('?lang=ur switches the page to Urdu, right to left', async ({ page }) => {
  await page.goto('/?lang=ur');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ur');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});
