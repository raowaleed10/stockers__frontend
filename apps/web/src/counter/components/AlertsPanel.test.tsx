import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApi } from '@/mocks/test-server';
import { alertsPath } from './alerts-path';
import {
  renderCounter,
  resetCounterState,
  setLanguage,
  startCounterTests,
  wherePath,
} from '../test/harness';

const api = createTestApi();
beforeAll(() => startCounterTests(api), 30_000);
afterAll(() => api.server.close());
beforeEach(() => {
  api.load();
  resetCounterState();
});
afterEach(() => resetCounterState());

const panel = () => screen.findByRole('dialog', { name: 'Alerts' });
const bell = (name: string | RegExp) => screen.findByRole('button', { name });

/** What the counter's alerts call answers, for a test that needs its own list. */
function answerWith(alerts: unknown[], unread = alerts.length) {
  api.server.use(http.get('/api/counter/alerts', () => HttpResponse.json({ alerts, unread })));
}

describe('the bell opens the alerts panel', () => {
  it('opens a side panel at /alerts with the three counter alerts, newest first, over the board', async () => {
    const view = renderCounter('/');
    await userEvent.click(await bell('Notifications, 3 new'));
    const dialog = await panel();
    expect(wherePath(view)).toBe('/alerts');
    expect(within(dialog).getByRole('heading', { name: 'Alerts' })).toBeInTheDocument();
    const rows = await within(dialog).findAllByRole('listitem');
    expect(rows.map((row) => row.querySelector('bdi')?.textContent)).toEqual([
      'Chips running low',
      'Game cancelled on Table 5',
      'Table 7 marked out of order by Adil',
    ]);
    // The finished board is still there behind it (dimmed, and out of reach: it is `inert`), and so are the top
    // bar and the action bar.
    expect(
      screen.getByRole('button', { name: 'Table 1, playing', hidden: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Waiting to pay', hidden: true }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Signed in: Zain/ })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('opens over the tab you are on, and closing goes back to that tab', async () => {
    const view = renderCounter('/board/pool');
    await userEvent.click(await bell('Notifications, 3 new'));
    const dialog = await panel();
    expect(wherePath(view)).toBe('/board/pool/alerts');
    // The pool board is the one behind it, not the snooker board.
    expect(
      screen.getByRole('button', { name: 'Pool table 1, price not set', hidden: true }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Table 1, playing', hidden: true })).toBeNull();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close panel' }));
    await waitFor(() => expect(wherePath(view)).toBe('/board/pool'));
    expect(
      await screen.findByRole('button', { name: 'Pool table 1, price not set' }),
    ).toBeInTheDocument();
  });

  it('Escape closes it back to the tab it was opened over', async () => {
    const view = renderCounter('/board/pool/alerts');
    await panel();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(wherePath(view)).toBe('/board/pool'));
  });

  it('opens from a screen that is not a board over the first tab', () => {
    // The pages of the action bar have their own header and no bell, so this is the rule, not a button.
    expect(alertsPath('/canteen')).toBe('/alerts');
    expect(alertsPath('/checkout/bilal')).toBe('/alerts');
    expect(alertsPath('/board/pool/table/po1')).toBe('/board/pool/alerts');
  });

  it('opens straight from the address /alerts', async () => {
    renderCounter('/alerts');
    expect(await panel()).toBeInTheDocument();
  });

  it('sends a visitor with no session to the sign-in page, like every other counter screen', async () => {
    api.load({ as: 'none' });
    const view = renderCounter('/alerts');
    await waitFor(() => expect(wherePath(view)).toBe('/sign-in'));
  });

  it('closes with the X and goes back to the board at /', async () => {
    const view = renderCounter('/alerts');
    const dialog = await panel();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close panel' }));
    expect(screen.queryByRole('dialog', { name: 'Alerts' })).not.toBeInTheDocument();
    expect(wherePath(view)).toBe('/');
  });

  it('closes with Escape', async () => {
    const view = renderCounter('/alerts');
    await panel();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Alerts' })).not.toBeInTheDocument();
    expect(wherePath(view)).toBe('/');
  });
});

describe('the rows (laid out like screen 58)', () => {
  it('has the title, one line of text and the time at the end of the row', async () => {
    renderCounter('/alerts');
    const dialog = await panel();
    const rows = await within(dialog).findAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Chips running low');
    expect(rows[0]).toHaveTextContent('3 left. Cigarette packs are sold out.');
    expect(rows[0]).toHaveTextContent('9:12 PM');
    expect(rows[1]).toHaveTextContent('Started by mistake and undone after 40 seconds.');
    expect(rows[1]).toHaveTextContent('8:12 PM');
    expect(rows[2]).toHaveTextContent('Cloth change');
    expect(rows[2]).toHaveTextContent('4:15 PM');
  });

  it('says "Unread" for an unread alert in words, not by colour alone', async () => {
    renderCounter('/alerts');
    const dialog = await panel();
    const rows = await within(dialog).findAllByRole('listitem');
    for (const row of rows) expect(row).toHaveTextContent('Unread');
  });

  it('shows an amount at the end when the alert has one, and says the day of an older alert', async () => {
    answerWith([
      {
        id: 'x1',
        at: '2026-10-02T18:00:00+05:00',
        kind: 'game-cancelled',
        title: 'Frame discarded on Table 6',
        text: 'Started by mistake.',
        amount: 250,
        read: true,
      },
      {
        id: 'x2',
        at: '2026-10-03T21:12:00+05:00',
        kind: 'low-stock',
        title: 'Chips running low',
        text: '3 left.',
        read: true,
      },
    ]);
    renderCounter('/alerts');
    const dialog = await panel();
    const [old, today] = await within(dialog).findAllByRole('listitem');
    expect(old).toHaveTextContent('Rs 250');
    expect(old).toHaveTextContent('Fri 2 Oct, 6:00 PM');
    expect(today).not.toHaveTextContent('Rs');
    expect(today).toHaveTextContent('9:12 PM');
    expect(today).not.toHaveTextContent('Unread');
  });
});

describe('Mark all read', () => {
  it('reads every alert through POST /alerts/read-all, and the bell loses its number', async () => {
    renderCounter('/alerts');
    const dialog = await panel();
    const markAll = await within(dialog).findByRole('button', { name: 'Mark all read' });
    await waitFor(() => expect(markAll).toBeEnabled());
    await userEvent.click(markAll);
    await waitFor(() => expect(api.db.s.counterAlerts.every((alert) => alert.read)).toBe(true));
    // The bell: no more "3 new".
    expect(await bell('Notifications')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Notifications, 3 new' })).not.toBeInTheDocument();
    // The rows stay, now without "Unread", and there is nothing left to mark.
    await waitFor(() => expect(within(dialog).queryByText('Unread')).not.toBeInTheDocument());
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(3);
    expect(within(dialog).getByRole('button', { name: 'Mark all read' })).toBeDisabled();
  });

  it('is in the header, next to the title and before the close button', async () => {
    renderCounter('/alerts');
    const dialog = await panel();
    const header = within(dialog).getByRole('heading', { name: 'Alerts' }).closest('header')!;
    const buttons = within(header).getAllByRole('button');
    expect(
      buttons.map((button) => button.textContent || button.getAttribute('aria-label')),
    ).toEqual(['Mark all read', 'Close panel']);
  });
});

describe('counter alerts only, never the owners’', () => {
  it('shows only the counter’s alerts and never calls the owner API (an unhandled call fails the test)', async () => {
    renderCounter('/alerts');
    const dialog = await panel();
    await within(dialog).findAllByRole('listitem');
    // Titles of the owners' notifications (screen 36) are not here.
    expect(dialog).not.toHaveTextContent('Sheet 48 closed by Shabir');
    expect(dialog).not.toHaveTextContent('Left without checkout');
    expect(dialog).not.toHaveTextContent('Adil edited sheet 47');
    expect(dialog.textContent?.toLowerCase()).not.toContain('owner');
  });

  it('is the list the board counted: the badge number equals the unread rows', async () => {
    renderCounter('/alerts');
    const dialog = await panel();
    const rows = await within(dialog).findAllByRole('listitem');
    const unread = rows.filter((row) => row.textContent?.includes('Unread')).length;
    expect(await bell(`Notifications, ${unread} new`)).toBeInTheDocument();
  });
});

describe('when there is nothing, or something goes wrong', () => {
  it('says "No alerts yet" for an empty list, and has nothing to mark', async () => {
    answerWith([]);
    renderCounter('/alerts');
    const dialog = await panel();
    expect(await within(dialog).findByText('No alerts yet')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Mark all read' })).toBeDisabled();
  });

  it('says so plainly if the alerts cannot be loaded, and can try again', async () => {
    api.server.use(http.get('/api/counter/alerts', () => new HttpResponse(null, { status: 500 })));
    renderCounter('/alerts');
    const dialog = await panel();
    expect(
      await within(dialog).findByText('Could not load the alerts.', {}, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('in Urdu', () => {
  it('has the Urdu title, the Urdu button, and times with the day-part word', async () => {
    setLanguage('ur');
    renderCounter('/alerts');
    const dialog = await screen.findByRole('dialog', { name: 'اطلاعات' });
    expect(
      await within(dialog).findByRole('button', { name: 'سب پڑھی ہوئی کریں' }),
    ).toBeInTheDocument();
    const rows = await within(dialog).findAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('رات 9:12');
    expect(rows[1]).toHaveTextContent('رات 8:12');
    expect(rows[2]).toHaveTextContent('شام 4:15');
    // The words of an alert are the club's data and are shown as written, each in its own direction.
    expect(rows[0].querySelector('[dir="auto"]')).not.toBeNull();
  });

  it('says the day of an older alert in Urdu', async () => {
    setLanguage('ur');
    answerWith([
      {
        id: 'x1',
        at: '2026-10-02T18:00:00+05:00',
        kind: 'low-stock',
        title: 'Chips running low',
        text: '3 left.',
        read: true,
      },
    ]);
    renderCounter('/alerts');
    const dialog = await screen.findByRole('dialog', { name: 'اطلاعات' });
    const [row] = await within(dialog).findAllByRole('listitem');
    expect(row).toHaveTextContent('جمعہ 2 اکتوبر، شام 6:00');
  });
});
