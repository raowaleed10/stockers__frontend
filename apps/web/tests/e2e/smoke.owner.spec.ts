import { expect, test } from '@playwright/test';

// The owner app is served at /owner-dev/ in development only.
// This spec runs twice: desktop (1440x900) and phone (390x844).

test('the owner dashboard page loads in Barlow on the owner background', async ({ page }) => {
  await page.goto('/owner-dev/');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);

  const look = await page.evaluate(() => ({
    base: document.querySelector('meta[name="app-base"]')?.getAttribute('content'),
    font: getComputedStyle(document.body).fontFamily,
    background: getComputedStyle(document.body).backgroundColor,
    barlowLoaded: [...document.fonts].some(
      (face) => face.family.replace(/"/g, '') === 'Barlow' && face.status === 'loaded',
    ),
    pageIsWiderThanScreen: document.documentElement.scrollWidth > window.innerWidth,
  }));
  expect(look.base).toBe('/owner-dev/');
  expect(look.font).toContain('Barlow');
  expect(look.background).toBe('rgb(238, 242, 239)'); // --o-page #EEF2EF
  expect(look.barlowLoaded).toBe(true);
  expect(look.pageIsWiderThanScreen).toBe(false);
});

test('an address inside the owner path that does not exist shows "Page not found"', async ({
  page,
}) => {
  await page.goto('/owner-dev/nowhere');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('the mock API answers in the browser', async ({ page }) => {
  await page.goto('/owner-dev/');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  const body = await page.evaluate(() => fetch('/api/owner/health').then((r) => r.json()));
  expect(body).toEqual({ ok: true });
});
