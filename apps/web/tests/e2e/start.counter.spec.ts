import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { settle } from './settle';

/**
 * Starting a game (P06, screens 7 to 10 and 12): from the board, Table 2 → Single frame → two players → Start; a double
 * with three players; a new player made in the middle of the flow with no phone number; changing the type at 3 minutes
 * and not at 6; and the checks every counter screen gets (axe, 56 px, nothing sideways, Urdu mirrored).
 */

const NIGHT = encodeURIComponent('2026-10-03T21:46:00+05:00');

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

/** Types in the search box of the open dialog and taps the result that starts with `who`. */
async function pick(
  page: Page,
  typed: string,
  who: RegExp,
  box = /^Search players by name or phone/,
) {
  const search = page.getByRole('searchbox', { name: box });
  await search.fill(typed);
  await page
    .getByRole('list', { name: 'Search results' })
    .getByRole('button', { name: who })
    .click();
}

test.describe('starting a game on Table 2', () => {
  test('Table 2 → Single frame → Ahmed Nawaz and Ali Akbar → Start: the board shows Table 2 playing from 0:00', async ({
    page,
  }) => {
    const problems = await open(page, `/?now=${NIGHT}`);
    await page.getByRole('button', { name: 'Table 2, free' }).click();
    await expect(page).toHaveURL(/\/table\/t2\/start$/);
    const type = page.getByRole('dialog', { name: 'Table 2 is free' });
    await expect(type).toBeVisible();
    await expect(type.getByRole('button', { name: /^Single frame/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await type.getByRole('button', { name: 'Next: pick players' }).click();

    const players = page.getByRole('dialog', { name: 'Who is playing on Table 2?' });
    await expect(players).toBeVisible();
    const start = players.getByRole('button', { name: 'Start game' });
    await expect(start).toBeDisabled();
    await pick(page, 'ahmed', /^Ahmed Nawaz/);
    await expect(players.getByTestId('slot-filled')).toContainText('0333 •••• 2209');
    await pick(page, 'ali ak', /^Ali Akbar/);
    await expect(start).toBeEnabled();
    await start.click();

    await expect(page).toHaveURL(/\/$/);
    const tile = page.getByRole('button', { name: 'Table 2, playing' });
    await expect(tile).toBeVisible();
    await expect(tile).toContainText('Ahmed Nawaz vs Ali Akbar');
    await expect(tile.getByRole('timer')).toHaveText(/^00:0\d$/);
    // It is under Zain: the Activity history of the mock names him (docs/06).
    await expect(page.getByRole('button', { name: /Signed in: Zain/ })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('a double with three players: side A has two, side B has one', async ({ page }) => {
    await open(page, `/table/t2/start?now=${NIGHT}`);
    await page.getByRole('button', { name: /^Double frame/ }).click();
    await page.getByRole('button', { name: 'Next: pick players' }).click();
    const dialog = page.getByRole('dialog', { name: 'Double frame on Table 2' });
    await expect(dialog).toBeVisible();
    const start = dialog.getByRole('button', { name: 'Start double frame' });
    await pick(page, 'ahmed', /^Ahmed Nawaz/, /^Search a name or phone for side A/);
    await pick(page, 'ali ak', /^Ali Akbar/, /^Search a name or phone for side A/);
    await expect(start).toBeDisabled();
    await pick(page, 'imran', /^Imran Shah/, /^Search a name or phone for side B/);
    await expect(dialog).toContainText('If Imran plays alone and loses, he pays the full Rs 500.');
    await expect(start).toBeEnabled();
    await start.click();
    const tile = page.getByRole('button', { name: 'Table 2, playing' });
    await expect(tile).toContainText('Double frame');
    await expect(tile).toContainText('Rs 500');
  });

  test('a new player with no phone is added in the middle of the flow and comes back picked', async ({
    page,
  }) => {
    await open(page, `/table/t2/start/players?now=${NIGHT}`);
    const players = page.getByRole('dialog', { name: 'Who is playing on Table 2?' });
    await pick(page, 'ahmed', /^Ahmed Nawaz/);
    await players.getByRole('searchbox').fill('zed khan');
    await players.getByRole('button', { name: 'Add “zed khan” as a new player' }).click();
    await expect(page).toHaveURL(/\/players\/new\?for=t2$/);
    const form = page.getByRole('dialog', { name: 'Add a new player' });
    await expect(form.getByLabel('Full name')).toHaveValue('Zed Khan');
    await form.getByRole('button', { name: 'Skip phone for now' }).click();
    await expect(page).toHaveURL(/\/table\/t2\/start\/players$/);
    await expect(players.getByTestId('slot-filled')).toHaveCount(2);
    await expect(players.getByTestId('slot-filled').nth(1)).toContainText('Zed Khan');
    await players.getByRole('button', { name: 'Start game' }).click();
    await expect(page.getByRole('button', { name: 'Table 2, playing' })).toContainText(
      'Ahmed Nawaz vs Zed Khan',
    );
  });

  test('the phone keypad types 0302 81 in the box, and Delete takes a digit back', async ({
    page,
  }) => {
    await open(page, `/players/new?for=t2&now=${NIGHT}`);
    const form = page.getByRole('dialog', { name: 'Add a new player' });
    for (const digit of '030281')
      await form.getByRole('button', { name: digit, exact: true }).click();
    await expect(form.getByLabel(/^Phone number/)).toHaveValue('0302 81');
    await form.getByRole('button', { name: 'Delete last digit' }).click();
    await expect(form.getByLabel(/^Phone number/)).toHaveValue('0302 8');
  });

  test('Mark out of order asks for a note and greys the table', async ({ page }) => {
    await open(page, `/table/t2/start?now=${NIGHT}`);
    await page.getByRole('button', { name: 'Mark out of order' }).click();
    const dialog = page.getByRole('dialog', { name: 'Mark Table 2 out of order' });
    await dialog.getByLabel('Note (required)').fill('Cloth change');
    await dialog.getByRole('button', { name: 'Mark out of order' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: 'Table 2, out of order' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Table 2, out of order' })).toContainText(
      'Cloth change',
    );
  });

  test('Escape closes a start dialog and goes back to the board; Tab stays inside it', async ({
    page,
  }) => {
    await open(page, `/table/t2/start?now=${NIGHT}`);
    const dialog = page.getByRole('dialog', { name: 'Table 2 is free' });
    for (let i = 0; i < 20; i += 1) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(
        () => !!document.activeElement?.closest('[role="dialog"]'),
      );
      expect(inside, `Tab ${i + 1} left the dialog`).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
  });

  test('over Pool, a dialog closes back to the Pool tab', async ({ page }) => {
    await open(page, `/board/pool/table/po1/start?now=${NIGHT}`);
    // Pool has no price yet, so the dialog says so and Cancel returns to the tab.
    const dialog = page.getByRole('dialog', { name: 'Pool table 1 has no price yet' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(page).toHaveURL(/\/board\/pool$/);
  });
});

test.describe('change the game type (screen 12)', () => {
  const at = (time: string) =>
    `?scenario=newGame&now=${encodeURIComponent(`2026-10-03T${time}+05:00`)}`;

  test('is offered at 3 minutes: Century, who pays, and Table 2 counts from when it started', async ({
    page,
  }) => {
    await open(page, `/table/t2/change-type${at('21:53:00')}`);
    const dialog = page.getByRole('dialog', { name: 'Change the game on Table 2' });
    await expect(dialog).toContainText('Started 3 minutes ago as a single frame');
    await expect(dialog).toContainText('You can change it until 9:55 PM.');
    await expect(dialog).toContainText('2 minutes left to change.');
    await dialog.getByRole('button', { name: /^Century/ }).click();
    await dialog.getByRole('button', { name: 'Change to Century' }).click();
    const players = page.getByRole('dialog', { name: 'Who is playing on Table 2?' });
    await expect(players.getByTestId('slot-filled')).toContainText('Ahmed Nawaz');
    await players.getByRole('button', { name: 'Change to Century' }).click();
    const tile = page.getByRole('button', { name: 'Table 2, playing' });
    await expect(tile).toContainText('Under Ahmed Nawaz');
    await expect(tile).toContainText('Century');
  });

  test('is closed at 6 minutes: the dialog says the 5 minutes are over and offers no change', async ({
    page,
  }) => {
    await open(page, `/table/t2/change-type${at('21:56:00')}`);
    const dialog = page.getByRole('dialog', { name: 'Change the game on Table 2' });
    await expect(dialog).toContainText('The 5 minutes to change this game are over.');
    await expect(dialog.getByRole('button', { name: /^Change to/ })).toHaveCount(0);
  });
});

const SCREENS: { name: string; url: string; ready: (page: Page) => Promise<void>; ur: string }[] = [
  {
    name: 'screen 7, the type',
    url: `/table/t2/start?now=${NIGHT}`,
    ready: async (page) => {
      await expect(page.getByRole('dialog', { name: 'Table 2 is free' })).toBeVisible();
    },
    ur: 'ٹیبل 2 خالی ہے',
  },
  {
    name: 'screen 8, the players, with results',
    url: `/table/t2/start/players?now=${NIGHT}`,
    ready: async (page) => {
      await page.getByRole('searchbox').fill('ali');
      await expect(page.getByRole('list', { name: 'Search results' })).toBeVisible();
    },
    ur: 'ٹیبل 2 پر کون کھیل رہا ہے؟',
  },
  {
    name: 'screen 9, the two sides',
    url: `/table/t2/start/double?now=${NIGHT}`,
    ready: async (page) => {
      await expect(page.getByRole('dialog', { name: 'Double frame on Table 2' })).toBeVisible();
    },
    ur: 'ٹیبل 2 پر ڈبل فریم',
  },
  {
    name: 'screen 10, a new player',
    url: `/players/new?for=t2&now=${NIGHT}`,
    ready: async (page) => {
      await expect(page.getByRole('dialog', { name: 'Add a new player' })).toBeVisible();
    },
    ur: 'نیا کھلاڑی شامل کریں',
  },
  {
    name: 'screen 12, change the type',
    url: `/table/t2/change-type?scenario=newGame&now=${encodeURIComponent('2026-10-03T21:53:00+05:00')}`,
    ready: async (page) => {
      await expect(page.getByRole('dialog', { name: 'Change the game on Table 2' })).toBeVisible();
    },
    ur: 'ٹیبل 2 پر گیم بدلیں',
  },
];

for (const lang of ['en', 'ur'] as const) {
  for (const screen of SCREENS) {
    test.describe(`${screen.name}, ${lang === 'ur' ? 'in Urdu' : 'in English'}`, () => {
      const url = screen.url + (lang === 'ur' ? '&lang=ur' : '');
      const ready = async (page: Page) => {
        if (lang === 'ur') {
          await expect(page.getByRole('dialog', { name: screen.ur })).toBeVisible();
          if (screen.name.startsWith('screen 8')) {
            await page.getByRole('searchbox').fill('ali');
            await expect(page.getByRole('list')).not.toHaveCount(0);
          }
        } else {
          await screen.ready(page);
        }
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

      test('every control in the dialog is at least 56 px, and nothing scrolls sideways', async ({
        page,
      }) => {
        await open(page, url);
        await ready(page);
        // A text box sits inside a frame (64 px on screens 8 and 9, the rate box on 7 and 12): the frame is what is pressed.
        const boxes = await page.$$eval('[role="dialog"] input', (nodes) =>
          nodes
            .map((node) => ({
              what: (node.getAttribute('aria-label') ?? node.id).slice(0, 40),
              height: Math.max(
                node.getBoundingClientRect().height,
                node.parentElement?.getBoundingClientRect().height ?? 0,
              ),
              visible: node.getBoundingClientRect().width > 0,
            }))
            .filter((control) => control.visible),
        );
        expect(boxes.filter((control) => control.height < 56)).toEqual([]);
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

test('in Urdu the dialog is mirrored: the Back button is on the right and the numbers keep their order', async ({
  page,
}) => {
  await open(page, `/table/t2/start/players?now=${NIGHT}&lang=ur`);
  const dialog = page.getByRole('dialog', { name: 'ٹیبل 2 پر کون کھیل رہا ہے؟' });
  await expect(dialog).toBeVisible();
  const box = (await dialog.boundingBox())!;
  const back = (await dialog.getByRole('button', { name: 'گیم کی قسم پر واپس' }).boundingBox())!;
  expect(back.x).toBeGreaterThan(box.x + box.width / 2);
  const step = (await dialog.getByText('مرحلہ 2 از 2').boundingBox())!;
  expect(step.x).toBeLessThan(box.x + box.width / 2);
  await expect(dialog).toHaveCSS('direction', 'rtl');
});
