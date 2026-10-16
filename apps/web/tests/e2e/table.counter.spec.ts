import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { settle } from './settle';

/**
 * What a worker does with a running table (P07, screens 11 and 13 to 16): open it from the board, pause and resume it,
 * move it, replace a player, discard it with a reason, add a damage charge, undo a game started by mistake, and pause
 * every game for a power cut. And the checks every counter screen gets (axe, 56 px, nothing sideways, Urdu mirrored).
 */

const NIGHT = encodeURIComponent('2026-10-03T21:42:00+05:00');
const POWER_CUT = `scenario=paused&now=${encodeURIComponent('2026-10-03T22:01:00+05:00')}`;
const JUST_STARTED = (time: string) =>
  `scenario=newGame&now=${encodeURIComponent(`2026-10-03T${time}+05:00`)}`;

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

test.describe('the panel of a running table', () => {
  test('a tap on Table 1 opens it over the board; the × closes it', async ({ page }) => {
    const problems = await open(page, `/?now=${NIGHT}`);
    await page.getByRole('button', { name: 'Table 1, playing' }).click();
    await expect(page).toHaveURL(/\/table\/t1$/);
    const panel = page.getByRole('dialog', { name: 'Table 1, single frame' });
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('Playing since 9:23 PM');
    await expect(panel).toContainText('Frame 3 of this session');
    await expect(panel).toContainText('Ali 2 – 0 Bilal');
    await expect(panel.getByRole('timer')).toHaveText(/^18:4\d$/);
    // The board is still there behind it.
    await expect(page.locator('[aria-label="Table 4, over 30 minutes"]')).toBeAttached();
    await panel.getByRole('button', { name: 'Close panel' }).click();
    await expect(page).toHaveURL(/\/$/);
    expect(problems).toEqual([]);
  });

  test('Escape closes it, and Tab stays inside it', async ({ page }) => {
    await open(page, `/table/t1?now=${NIGHT}`);
    const panel = page.getByRole('dialog', { name: 'Table 1, single frame' });
    for (let i = 0; i < 14; i += 1) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(
        () => !!document.activeElement?.closest('[role="dialog"]'),
      );
      expect(inside, `Tab ${i + 1} left the panel`).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
  });

  test('Pause stops the timer and the tile says paused; Resume starts it again', async ({
    page,
  }) => {
    await open(page, `/table/t1?now=${NIGHT}`);
    const panel = page.getByRole('dialog', { name: 'Table 1, single frame' });
    await panel.getByRole('button', { name: 'Pause' }).click();
    await expect(panel).toContainText('Paused since');
    await expect(page.locator('[aria-label="Table 1, paused"]')).toBeAttached();
    const frozen = await panel.getByRole('timer').textContent();
    await page.waitForTimeout(2200);
    await expect(panel.getByRole('timer')).toHaveText(frozen ?? '');
    await panel.getByRole('button', { name: 'Resume' }).click();
    await expect(panel.getByRole('button', { name: 'Pause' })).toBeVisible();
    await expect(page.locator('[aria-label="Table 1, playing"]')).toBeAttached();
  });

  test('Move table: Table 1 goes to Table 2 with its players and its timer', async ({ page }) => {
    await open(page, `/table/t1/move?now=${NIGHT}`);
    const move = page.getByRole('region', { name: 'Move Table 1 to another table' });
    await expect(move.getByRole('button', { name: /^7\s*Table 7/ })).toBeDisabled();
    await move.getByRole('button', { name: 'Move to Table 2' }).click();
    await expect(page).toHaveURL(/\/$/);
    const moved = page.getByRole('button', { name: 'Table 2, playing' });
    await expect(moved).toContainText('Ali Raza vs Bilal Ahmed');
    await expect(moved.getByRole('timer')).toHaveText(/^18:\d\d$|^19:\d\d$/);
    await expect(page.getByRole('button', { name: 'Table 1, free' })).toBeVisible();
  });

  test('Replace player: Ali is replaced by Usman Tariq on Table 1', async ({ page }) => {
    await open(page, `/table/t1/move?now=${NIGHT}`);
    const replace = page.getByRole('region', { name: 'Replace a player on Table 1' });
    await replace.getByRole('button', { name: /^Ali Raza/ }).click();
    await replace.getByRole('searchbox', { name: 'Search the new player' }).fill('usm');
    await replace.getByRole('button', { name: /^Usman Tariq/ }).click();
    await replace.getByRole('button', { name: 'Replace Ali with Usman' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: 'Table 1, playing' })).toContainText(
      'Usman Tariq vs Bilal Ahmed',
    );
  });

  test('Discard needs a reason; then Table 6 is free', async ({ page }) => {
    await open(page, `/table/t6/stop?now=${NIGHT}`);
    const dialog = page.getByRole('dialog', { name: 'Stop Table 6 without the normal charge' });
    const confirm = dialog.getByRole('button', { name: 'Discard frame' }).last();
    await expect(confirm).toBeDisabled();
    await dialog.getByRole('button', { name: 'Players left halfway' }).click();
    await expect(confirm).toBeEnabled();
    await confirm.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: 'Table 6, free' })).toBeVisible();
  });

  test('a damage charge goes on Ali’s bill: it shows in Waiting to pay', async ({ page }) => {
    await open(page, `/table/t1/damage?now=${NIGHT}`);
    const dialog = page.getByRole('dialog', { name: 'Add a damage charge' });
    const add = dialog.getByRole('button', { name: /^Add/ });
    await expect(add).toBeDisabled();
    await dialog.getByRole('button', { name: /^Ali Raza/ }).click();
    await dialog.getByRole('button', { name: 'Cue', exact: true }).click();
    await dialog.getByRole('button', { name: '1,500', exact: true }).click();
    await dialog
      .getByLabel('Note (required)')
      .fill('Cue snapped at the joint after he hit the cushion');
    await dialog.getByRole('button', { name: 'Add Rs 1,500 to Ali’s bill' }).click();
    await expect(page).toHaveURL(/\/$/);
    const waiting = page.getByRole('complementary', { name: 'Waiting to pay' });
    await expect(waiting).toContainText('Ali Raza');
    await expect(waiting).toContainText('damage charge');
    // The frame goes on.
    await expect(page.getByRole('button', { name: 'Table 1, playing' })).toBeVisible();
  });
});

test.describe('the Undo toast', () => {
  test('is on the board for 2 minutes after a game starts, and Undo frees the table', async ({
    page,
  }) => {
    await open(page, `/?${JUST_STARTED('21:50:18')}`);
    const toast = page.getByRole('status').filter({ hasText: 'Game started on Table 2' });
    await expect(toast).toContainText('Game started on Table 2 for Ahmed Nawaz and Ali Akbar.');
    await expect(toast).toContainText(/Undo for 1:\d\d more/);
    await toast.getByRole('button', { name: 'Undo' }).click();
    await expect(page.getByText('Game undone on Table 2.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Table 2, free' })).toBeVisible();
  });

  test('is not there at 3 minutes', async ({ page }) => {
    await open(page, `/?${JUST_STARTED('21:53:00')}`);
    await expect(page.getByRole('button', { name: 'Table 2, playing' })).toBeVisible();
    await expect(page.getByText(/^Game started on/)).toHaveCount(0);
  });

  test('stays when a dialog opens, under it, and the dialog sits above it', async ({ page }) => {
    await open(page, `/table/t6/stop?${JUST_STARTED('21:50:18')}`);
    const dialog = page.getByRole('dialog', { name: 'Stop Table 6 without the normal charge' });
    const toast = page.getByRole('status').filter({ hasText: 'Game started on Table 2' });
    await expect(toast).toBeVisible();
    const d = (await dialog.boundingBox())!;
    const t = (await toast.boundingBox())!;
    expect(t.y).toBeGreaterThan(d.y + d.height);
  });
});

test.describe('Pause all, for a power cut', () => {
  test('the action bar pauses every game, the banner says so, and Resume all games undoes it', async ({
    page,
  }) => {
    await open(page, `/?now=${NIGHT}`);
    await page.getByRole('contentinfo').getByRole('button', { name: 'Pause all' }).click();
    const banner = page.getByRole('alert').filter({ hasText: 'All games are paused' });
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Paused at 9:42 PM by the counter.');
    await expect(page.locator('[aria-label="Table 1, paused"]')).toBeAttached();
    await expect(
      page.getByRole('contentinfo').getByRole('button', { name: 'Pause all' }),
    ).toBeDisabled();
    await banner.getByRole('button', { name: 'Resume all games' }).click();
    await expect(banner).toHaveCount(0);
    await expect(page.locator('[aria-label="Table 1, playing"]')).toBeAttached();
  });

  test('the power-cut board has a Resume on each paused tile and a hint on the free ones', async ({
    page,
  }) => {
    const problems = await open(page, `/?${POWER_CUT}`);
    const t1 = page.getByRole('group', { name: 'Table 1, paused' });
    await expect(t1.getByRole('timer')).toHaveText('06:48');
    await expect(t1.getByRole('button', { name: 'Resume' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Table 3, free' })).toContainText(
      'New games can still start. Pause them too if the power is out.',
    );
    await t1.getByRole('button', { name: 'Resume' }).click();
    await expect(page.locator('[aria-label="Table 1, playing"]')).toBeAttached();
    await expect(page.getByRole('group', { name: 'Table 2, paused' })).toBeVisible();
    expect(problems).toEqual([]);
  });
});

const SCREENS: { name: string; url: string; dialog: RegExp | string; ur: string }[] = [
  {
    name: 'screen 11, the panel',
    url: `/table/t1?now=${NIGHT}`,
    dialog: 'Table 1, single frame',
    ur: 'ٹیبل 1، سنگل فریم',
  },
  {
    name: 'screen 13, move and replace',
    url: `/table/t1/move?now=${NIGHT}`,
    dialog: 'Move table',
    ur: 'ٹیبل بدلیں',
  },
  {
    name: 'screen 14, stop',
    url: `/table/t6/stop?${JUST_STARTED('21:50:18')}`,
    dialog: 'Stop Table 6 without the normal charge',
    ur: 'ٹیبل 6 کو عام چارج کے بغیر روکیں',
  },
  {
    name: 'screen 15, damage',
    url: `/table/t1/damage?now=${NIGHT}`,
    dialog: 'Add a damage charge',
    ur: 'نقصان کا چارج لگائیں',
  },
];

for (const lang of ['en', 'ur'] as const) {
  for (const screen of SCREENS) {
    test.describe(`${screen.name}, ${lang === 'ur' ? 'in Urdu' : 'in English'}`, () => {
      const url = screen.url + (lang === 'ur' ? '&lang=ur' : '');
      const ready = async (page: Page) => {
        await expect(
          page.getByRole('dialog', { name: lang === 'ur' ? screen.ur : screen.dialog }),
        ).toBeVisible();
        await settle(page);
      };

      test('has no serious or critical accessibility issues', async ({ page }) => {
        const problems = await open(page, url);
        await ready(page);
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

      test('every button in the dialog is at least 56 px, and nothing scrolls sideways', async ({
        page,
      }) => {
        await open(page, url);
        await ready(page);
        const buttons = await page.$$eval('[role="dialog"] button', (nodes) =>
          nodes
            .map((node) => ({
              what: (node.getAttribute('aria-label') ?? node.textContent ?? '').trim().slice(0, 40),
              height: node.getBoundingClientRect().height,
            }))
            .filter((control) => control.height > 0),
        );
        expect(buttons.filter((control) => control.height < 56)).toEqual([]);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    });
  }
}

for (const lang of ['en', 'ur'] as const) {
  test(`the power-cut board has no serious accessibility issues, ${lang === 'ur' ? 'in Urdu' : 'in English'}`, async ({
    page,
  }) => {
    const problems = await open(page, `/?${POWER_CUT}${lang === 'ur' ? '&lang=ur' : ''}`);
    await expect(page.getByRole('alert').first()).toBeVisible();
    await settle(page);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    const summary = serious.map((violation) => ({
      rule: violation.id,
      where: violation.nodes.slice(0, 4).map((node) => node.target.join(' ')),
    }));
    expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
    expect(problems).toEqual([]);
    const small = await page.$$eval('button', (nodes) =>
      nodes
        .map((node) => ({
          what: (node.getAttribute('aria-label') ?? node.textContent ?? '').trim().slice(0, 40),
          height: node.getBoundingClientRect().height,
        }))
        .filter((control) => control.height > 0 && control.height < 56),
    );
    expect(small).toEqual([]);
  });
}

test('in Urdu the panel is on the left and its buttons keep their order mirrored', async ({
  page,
}) => {
  await open(page, `/table/t1?now=${NIGHT}&lang=ur`);
  const panel = page.getByRole('dialog', { name: 'ٹیبل 1، سنگل فریم' });
  await expect(panel).toBeVisible();
  const box = (await panel.boundingBox())!;
  expect(box.x).toBeLessThan(10);
  await expect(panel).toHaveCSS('direction', 'rtl');
  // The names and the score keep their own order.
  await expect(panel).toContainText('Ali 2 – 0 Bilal');
});
