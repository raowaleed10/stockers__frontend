import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { settle } from './settle';

/**
 * The live board (P05): screen 3 at 9:42 PM, the game tabs, the waiting list, the pool board before a price is set
 * (screen 4), the games preview (screen 5) and the board in Urdu (screen 6). The pictures are compared in
 * `tests/visual`; these tests check what happens: states, taps, the clock, live updates and the panels over it.
 */

const NIGHT = encodeURIComponent('2026-10-03T21:42:00+05:00');
const LATER = encodeURIComponent('2026-10-03T21:44:00+05:00');

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

const tiles = (page: Page) => page.locator('[data-kind]');

test.describe('the live board at 9:42 PM (screen 3)', () => {
  test('draws nine tiles in the states of the design, with no errors', async ({ page }) => {
    const problems = await open(page, `/?now=${NIGHT}`);
    await expect(tiles(page)).toHaveCount(9);
    expect(
      await tiles(page).evaluateAll((nodes) => nodes.map((n) => n.getAttribute('aria-label'))),
    ).toEqual([
      'Table 1, playing',
      'Table 2, free',
      'Table 3, playing',
      'Table 4, over 30 minutes',
      'Table 5, playing',
      'Table 6, paused',
      'Table 7, out of order',
      'Room 1, playing',
      'Room 2, free',
    ]);
    expect(
      await tiles(page).evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-status'))),
    ).toEqual([
      'playing',
      'free',
      'playing',
      'over30',
      'playing',
      'paused',
      'outOfOrder',
      'playing',
      'free',
    ]);
    expect(problems).toEqual([]);
  });

  test('shows the amounts and timers of screen 3', async ({ page }) => {
    await open(page, `/?now=${NIGHT}`);
    const room = page.getByRole('button', { name: 'Room 1, playing' });
    await expect(room.getByRole('timer')).toContainText(/^1:12:0\d$/);
    await expect(room).toContainText('Rs 1,800');
    const century = page.getByRole('button', { name: 'Table 3, playing' });
    await expect(century.getByRole('timer')).toContainText(/^37:\d\d$/);
    await expect(century).toContainText('Rs 555');
    const red = page.getByRole('button', { name: 'Table 4, over 30 minutes' });
    await expect(red.getByRole('timer')).toContainText(/^34:\d\d$/);
    // The red card: a solid red timer.
    const background = await red
      .getByRole('timer')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(background).toBe('rgb(217, 45, 32)');
    await expect(
      page.getByRole('button', { name: 'Table 6, paused' }).getByRole('timer'),
    ).toHaveText('12:04');
    await expect(page.getByRole('button', { name: 'Table 7, out of order' })).toContainText(
      'Marked by Adil at 4:15 PM',
    );
  });

  test('lists five players waiting, Rs 1,550 in all, and the six tabs', async ({ page }) => {
    await open(page, `/?now=${NIGHT}`);
    const panel = page.getByRole('complementary', { name: 'Waiting to pay' });
    await expect(panel.getByRole('button')).toHaveCount(5);
    await expect(panel).toContainText('5 players');
    await expect(panel).toContainText('Not paid yet today');
    await expect(panel).toContainText('Rs 1,550');
    await expect(panel.getByRole('button').first()).toContainText(
      '•••• 4512, 2 frames lost, 2 teas',
    );
    const tabs = page.getByRole('navigation', { name: 'Game categories' }).getByRole('button');
    await expect(tabs).toHaveCount(6);
    await expect(tabs.first()).toHaveAttribute('aria-pressed', 'true');
    await expect(tabs.first()).toContainText('6 of 9 in use');
  });

  test('the layout is the design’s: three tiles a row, the panel at the end, 22 px apart', async ({
    page,
  }) => {
    await open(page, `/?now=${NIGHT}`);
    const t1 = (await page.getByRole('button', { name: 'Table 1, playing' }).boundingBox())!;
    const t2 = (await page.getByRole('button', { name: 'Table 2, free' }).boundingBox())!;
    const t3 = (await page.getByRole('button', { name: 'Table 3, playing' }).boundingBox())!;
    const t4 = (await page
      .getByRole('button', { name: 'Table 4, over 30 minutes' })
      .boundingBox())!;
    const panel = (await page
      .getByRole('complementary', { name: 'Waiting to pay' })
      .boundingBox())!;
    expect(t1.width).toBeCloseTo(319.2, 0);
    expect(t2.x - (t1.x + t1.width)).toBeCloseTo(22, 0);
    expect(t3.x).toBeGreaterThan(t2.x);
    expect(t4.x).toBeCloseTo(t1.x, 0);
    expect(t4.y).toBeGreaterThan(t1.y + t1.height);
    expect(panel.x).toBeGreaterThan(t3.x + t3.width);
    expect(panel.width).toBeCloseTo(358.4, 0);
  });
});

test.describe('the clock on the board', () => {
  test('Table 4 turns into the red card at 30:00 without a reload', async ({ page }) => {
    // Table 4 started at 9:07:50 PM, so at 9:37:47 PM it has been playing for 29:57.
    await open(page, `/?now=${encodeURIComponent('2026-10-03T21:37:47+05:00')}`);
    const before = page.getByRole('button', { name: 'Table 4, playing' });
    await expect(before).toBeVisible();
    expect(
      await before.getByRole('timer').evaluate((el) => getComputedStyle(el).backgroundColor),
    ).not.toBe('rgb(217, 45, 32)');
    const after = page.getByRole('button', { name: 'Table 4, over 30 minutes' });
    await expect(after).toBeVisible({ timeout: 10_000 });
    expect(
      await after.getByRole('timer').evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe('rgb(217, 45, 32)');
    await expect(after).toContainText('Over 30 min');
  });

  test('the timers tick', async ({ page }) => {
    await open(page, `/?now=${NIGHT}`);
    const timer = page.getByRole('button', { name: 'Table 1, playing' }).getByRole('timer');
    const first = await timer.textContent();
    await expect.poll(async () => timer.textContent(), { timeout: 5000 }).not.toBe(first);
  });
});

test.describe('what a tap does', () => {
  test('a free table, a running table and a free room go to their own screens', async ({
    page,
  }) => {
    await open(page, `/?now=${NIGHT}`);
    await page.getByRole('button', { name: 'Table 2, free' }).click();
    await expect(page).toHaveURL(/\/table\/t2\/start$/);
    await page.goBack();
    await page.getByRole('button', { name: 'Table 1, playing' }).click();
    await expect(page).toHaveURL(/\/table\/t1$/);
    await page.goBack();
    await page.getByRole('button', { name: 'Room 2, free' }).click();
    await expect(page).toHaveURL(/\/room\/r2\/start$/);
  });

  test('an out-of-order table does nothing and says why', async ({ page }) => {
    await open(page, `/?now=${NIGHT}`);
    const t7 = page.getByRole('button', { name: 'Table 7, out of order' });
    // Playwright counts aria-disabled as "not enabled", so the tap is forced: a real finger can still touch it.
    await t7.click({ force: true });
    await expect(page).toHaveURL(/\/\?now=|\/$/);
    expect(new URL(page.url()).pathname).toBe('/');
    await expect(t7).toContainText('Cloth change');
  });

  test('a tab opens its game, and a waiting player opens his bill', async ({ page }) => {
    await open(page, `/?now=${NIGHT}`);
    await page.getByRole('button', { name: /^Pool/ }).click();
    await expect(page).toHaveURL(/\/board\/pool$/);
    await page.getByRole('button', { name: /^Snooker and rooms/ }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.getByRole('button', { name: /Bilal Ahmed/ }).click();
    await expect(page).toHaveURL(/\/checkout\/bilal$/);
  });
});

test.describe('pool tables before a price is set (screen 4)', () => {
  test('shows the banner, four locked tiles and the two cards, and no waiting list', async ({
    page,
  }) => {
    const problems = await open(page, `/board/pool?now=${LATER}`);
    await expect(page.getByText('Pool tables have no price yet')).toBeVisible();
    await expect(page.locator('[data-kind="pool"]')).toHaveCount(4);
    for (const tile of await page.locator('[data-kind="pool"]').all()) {
      await expect(tile).toBeDisabled();
      await expect(tile).toContainText('Locked until an owner sets the price');
      await expect(tile).toContainText('Price not set');
    }
    await expect(page.getByRole('heading', { name: 'Once a price is set' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Century stays on snooker' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Waiting to pay' })).toHaveCount(0);
    // (The pool tiles' names start with "Pool" too, so the tab is found inside the tab bar.)
    await expect(
      page
        .getByRole('navigation', { name: 'Game categories' })
        .getByRole('button', { name: /^Pool/ }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(problems).toEqual([]);
  });

  test('is four tiles across, as on the screen', async ({ page }) => {
    await open(page, `/board/pool?now=${LATER}`);
    const boxes = await page.locator('[data-kind="pool"]').evaluateAll((nodes) =>
      nodes.map((n) => {
        const { x, y, width } = n.getBoundingClientRect();
        return { x, y, width };
      }),
    );
    expect(new Set(boxes.map((b) => Math.round(b.y))).size).toBe(1);
    expect(boxes[0]!.width).toBeCloseTo(328.5, 0);
  });

  test('foosball, carrom, ludo and PlayStation say the same until prices are set', async ({
    page,
  }) => {
    for (const [category, title] of [
      ['foosball', 'Foosball tables have no price yet'],
      ['carrom', 'Carrom boards have no price yet'],
      ['ludo', 'Ludo boards have no price yet'],
      ['playstation', 'PlayStation screens have no price yet'],
    ] as const) {
      await open(page, `/board/${category}?now=${LATER}`);
      await expect(page.getByText(title)).toBeVisible();
    }
  });
});

test.describe('the games preview (screen 5)', () => {
  test('shows every other game with example prices, and says it is for the look only', async ({
    page,
  }) => {
    const problems = await open(page, `/dev/games-preview?now=${LATER}`);
    await expect(page.getByText('For the look only.')).toBeVisible();
    await expect(tiles(page)).toHaveCount(19);
    for (const [kind, count] of [
      ['pool', 4],
      ['carrom', 3],
      ['foosball', 3],
      ['ludo', 4],
      ['playstation', 5],
    ] as const) {
      await expect(page.locator(`[data-kind="${kind}"]`)).toHaveCount(count);
    }
    await expect(page.getByRole('heading', { name: 'Pool' })).toBeVisible();
    // No tab is selected here.
    for (const tab of await page
      .getByRole('navigation', { name: 'Game categories' })
      .getByRole('button')
      .all()) {
      await expect(tab).toHaveAttribute('aria-pressed', 'false');
    }
    expect(problems).toEqual([]);
  });
});

test.describe('the bell panel over the finished board', () => {
  test('opens over the real board, which stays behind it and out of reach', async ({ page }) => {
    await open(page, `/?now=${NIGHT}`);
    await page.getByRole('button', { name: 'Notifications, 3 new' }).click();
    const panel = page.getByRole('dialog', { name: 'Alerts' });
    await expect(panel).toBeVisible();
    const t1 = page.locator('[aria-label="Table 1, playing"]');
    await expect(t1).toBeVisible();
    // The tile is under the dimmed layer: whatever is on top at its middle is not the tile.
    const box = (await t1.boundingBox())!;
    const covered = await page.evaluate(
      ({ x, y }) => {
        const top = document.elementFromPoint(x, y);
        return top !== null && top.closest('[data-kind]') === null;
      },
      { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    );
    expect(covered).toBe(true);
    expect(await t1.evaluate((el) => el.closest('[inert]') !== null)).toBe(true);
    // The panel covers the board only: the top bar and the action bar are still on top of nothing and can be pressed.
    for (const name of ['Checkout', 'Lock']) {
      const bar = page.getByRole('button', { name, exact: true });
      await expect(bar).toBeVisible();
      // The board is taller than the 900 px screen, so the action bar can be below the fold.
      await bar.scrollIntoViewIfNeeded();
      const box = (await bar.boundingBox())!;
      const hit = await page.evaluate(
        ({ x, y, label }) => {
          const top = document.elementFromPoint(x, y)?.closest('button');
          return top?.textContent?.trim().startsWith(label) ?? false;
        },
        { x: box.x + box.width / 2, y: box.y + box.height / 2, label: name },
      );
      expect(hit, `${name} is covered by the panel`).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    expect(
      await page
        .locator('[aria-label="Table 1, playing"]')
        .evaluate((el) => el.closest('[inert]') === null),
    ).toBe(true);
  });
});

test.describe('live updates', () => {
  test('a game started somewhere else shows on the board without a reload', async ({ page }) => {
    await open(page, `/?now=${NIGHT}`);
    await expect(page.getByRole('button', { name: 'Table 2, free' })).toBeVisible();
    await page.evaluate(async () => {
      await fetch('/api/counter/games', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tableId: 't2',
          type: 'single',
          playerIds: ['ahmed-nawaz', 'ali-akbar'],
        }),
      });
    });
    const started = page.getByRole('button', { name: 'Table 2, playing' });
    await expect(started).toBeVisible({ timeout: 8000 });
    await expect(started).toContainText('Ahmed Nawaz vs Ali Akbar');
    await expect(page.getByRole('button', { name: /^Snooker and rooms/ })).toContainText(
      '7 of 9 in use',
    );
  });

  test('a canteen charge shows in the waiting list without a reload', async ({ page }) => {
    await open(page, `/?now=${NIGHT}`);
    const panel = page.getByRole('complementary', { name: 'Waiting to pay' });
    await expect(panel).toContainText('Rs 1,550');
    await page.evaluate(async () => {
      await fetch('/api/counter/canteen/sales', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ playerId: 'zubair', items: [{ itemId: 'tea', qty: 2 }] }),
      });
    });
    await expect(panel).toContainText('1 frame lost, 2 teas', { timeout: 8000 });
    await expect(panel).toContainText('Rs 1,650');
  });
});

test.describe('the board in Urdu (screen 6)', () => {
  test('is mirrored: tiles from the right, the waiting list on the left', async ({ page }) => {
    const problems = await open(page, `/?lang=ur&now=${NIGHT}`);
    expect(await page.evaluate(() => document.documentElement.dir)).toBe('rtl');
    const t1 = (await page.locator('[data-kind]').nth(0).boundingBox())!;
    const t2 = (await page.locator('[data-kind]').nth(1).boundingBox())!;
    const t3 = (await page.locator('[data-kind]').nth(2).boundingBox())!;
    const panel = (await page.getByRole('complementary', { name: 'ادائیگی باقی' }).boundingBox())!;
    expect(t1.x).toBeGreaterThan(t2.x);
    expect(t2.x).toBeGreaterThan(t3.x);
    expect(panel.x + panel.width).toBeLessThanOrEqual(t3.x);
    expect(panel.x).toBeCloseTo(24, 0);
    await expect(page.getByRole('button', { name: 'ٹیبل 1، کھیل جاری' })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('keeps the digits Western and the timers in order', async ({ page }) => {
    await open(page, `/?lang=ur&now=${NIGHT}`);
    await expect(
      page.getByRole('button', { name: 'ٹیبل 3، کھیل جاری' }).getByRole('timer'),
    ).toContainText(/^37:\d\d$/);
    await expect(
      page.getByRole('button', { name: 'روم 1، کھیل جاری' }).getByRole('timer'),
    ).toContainText(/^1:12:0\d$/);
  });
});

for (const lang of ['en', 'ur']) {
  const query = lang === 'ur' ? '&lang=ur' : '';
  for (const [name, path] of [
    ['the live board', '/'],
    ['the pool board', '/board/pool'],
    ['the games preview', '/dev/games-preview'],
  ] as const) {
    test.describe(`${name}, ${lang === 'ur' ? 'in Urdu' : 'in English'}`, () => {
      test('has no serious or critical accessibility issues', async ({ page }) => {
        const problems = await open(page, `${path}?now=${LATER}${query}`);
        await expect(tiles(page).first()).toBeVisible();
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

      test('every control is at least 56 px and nothing scrolls sideways', async ({ page }) => {
        await open(page, `${path}?now=${LATER}${query}`);
        await expect(tiles(page).first()).toBeVisible();
        const controls = await page.$$eval('button, a', (items) =>
          items
            .map((item) => ({
              what: (item.getAttribute('aria-label') ?? item.textContent ?? '').trim().slice(0, 40),
              height: item.getBoundingClientRect().height,
            }))
            .filter((control) => control.height > 0),
        );
        expect(controls.filter((control) => control.height < 56)).toEqual([]);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    });
  }
}
