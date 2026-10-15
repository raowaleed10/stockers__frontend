import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApi } from '@/mocks/test-server';
import { renderCounter, resetCounterState, textIs, wherePath } from '../test/harness';

const api = createTestApi();
beforeAll(() => api.server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => api.server.close());
beforeEach(() => {
  api.load();
  resetCounterState();
});
afterEach(() => resetCounterState());

const chip = () => screen.findByRole('button', { name: /Signed in: Zain/ });

describe('the route guard', () => {
  it('sends a visitor with no session from / to the sign-in page', async () => {
    api.load({ as: 'none' });
    const view = renderCounter('/');
    await waitFor(() => expect(wherePath(view)).toBe('/sign-in'));
    expect(await screen.findByRole('heading', { name: 'Who is working?' })).toBeInTheDocument();
  });

  it.each(['/checkout', '/canteen', '/players', '/today', '/expense', '/close-sheet'])(
    'sends a visitor with no session from %s to the sign-in page too',
    async (path) => {
      api.load({ as: 'none' });
      const view = renderCounter(path);
      await waitFor(() => expect(wherePath(view)).toBe('/sign-in'));
    },
  );

  it('lets Zain in to /, and keeps the sign-in page open for anyone', async () => {
    const view = renderCounter('/');
    expect(await chip()).toBeInTheDocument();
    expect(wherePath(view)).toBe('/');
    view.unmount();
    const again = renderCounter('/sign-in');
    expect(await again.findByRole('heading', { name: 'Who is working?' })).toBeInTheDocument();
  });

  it('shows the plain "Page not found" for another address, with or without a session', async () => {
    const view = renderCounter('/anything-else');
    expect(await view.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(document.body.textContent?.toLowerCase()).not.toContain('owner');
  });

  it('draws nothing of the frame while the answer is on its way', async () => {
    renderCounter('/');
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(await chip()).toBeInTheDocument();
  });
});

describe('the top bar (screen 3)', () => {
  it('shows the sheet, when it opened, the clock and the date', async () => {
    renderCounter('/');
    expect(await screen.findByText('Sheet 48')).toBeInTheDocument();
    expect(screen.getByText(textIs('Open since 11:10 AM, Sat 3 Oct'))).toBeInTheDocument();
    const header = screen.getByRole('banner');
    expect(within(header).getByText('9:42 PM')).toBeInTheDocument();
    expect(within(header).getByText('Sat 3 Oct')).toBeInTheDocument();
  });

  it('has the language switch, the bell with 3 new, the worker chip and Lock', async () => {
    renderCounter('/');
    const header = await screen.findByRole('banner');
    expect(await within(header).findByRole('radiogroup', { name: 'Language' })).toBeInTheDocument();
    expect(
      await within(header).findByRole('button', { name: 'Notifications, 3 new' }),
    ).toHaveTextContent('3');
    const worker = await chip();
    expect(worker).toHaveAccessibleName('Signed in: Zain, until 11:00 PM. Tap to switch worker');
    expect(worker).toHaveTextContent('Zain');
    expect(worker).toHaveTextContent('Until 11:00 PM');
    expect(within(header).getByRole('button', { name: 'Lock' })).toBeInTheDocument();
  });

  it('has no owner button, link or text anywhere on a signed-in screen', async () => {
    renderCounter('/');
    await chip();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(document.body.textContent?.toLowerCase()).not.toContain('owner');
  });
});

describe('the worker chip', () => {
  it('offers "Switch worker", which signs him out and goes to the sign-in page', async () => {
    const view = renderCounter('/');
    const u = userEvent.setup();
    await u.click(await chip());
    const offer = await screen.findByRole('button', { name: 'Switch worker' });
    expect(offer).toHaveFocus();
    await u.click(offer);
    await waitFor(() => expect(wherePath(view)).toBe('/sign-in'));
    expect(api.db.s.auth.session).toBeNull();
    // The sign-in page is not stuck on the old session: he can pick anybody.
    expect(await screen.findByRole('button', { name: /Zain/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('closes the offer with Escape and gives focus back to the chip', async () => {
    renderCounter('/');
    const u = userEvent.setup();
    const worker = await chip();
    await u.click(worker);
    expect(worker).toHaveAttribute('aria-expanded', 'true');
    await u.keyboard('{Escape}');
    expect(screen.queryByRole('button', { name: 'Switch worker' })).not.toBeInTheDocument();
    expect(worker).toHaveFocus();
  });

  it('closes the offer with a tap outside it', async () => {
    renderCounter('/');
    const u = userEvent.setup();
    await u.click(await chip());
    await screen.findByRole('button', { name: 'Switch worker' });
    await u.click(document.body);
    expect(screen.queryByRole('button', { name: 'Switch worker' })).not.toBeInTheDocument();
  });
});

describe('the action bar (screen 3)', () => {
  it('has Checkout, Canteen, Players, Today’s totals, Expense, Pause all and Close sheet', async () => {
    renderCounter('/');
    await chip();
    const bar = screen.getByRole('contentinfo');
    for (const name of [
      'Checkout',
      'Canteen',
      'Players',
      'Today’s totals',
      'Expense',
      'Pause all',
      'Close sheet',
    ]) {
      expect(within(bar).getByRole('button', { name })).toBeInTheDocument();
    }
    expect(within(bar).getAllByRole('button')).toHaveLength(7);
  });

  it('shows when the last backup was', async () => {
    renderCounter('/');
    expect(await screen.findByText(textIs('Backed up 9:00 PM'))).toBeInTheDocument();
  });

  it.each([
    ['Checkout', '/checkout'],
    ['Canteen', '/canteen'],
    ['Players', '/players'],
    ['Today’s totals', '/today'],
    ['Expense', '/expense'],
    ['Pause all', '/pause-all'],
    ['Close sheet', '/close-sheet'],
  ])('goes from %s to its placeholder screen at %s, inside the frame', async (name, path) => {
    const view = renderCounter('/');
    await chip();
    await userEvent.click(within(screen.getByRole('contentinfo')).getByRole('button', { name }));
    expect(wherePath(view)).toBe(path);
    expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    // The bars are still there around it.
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
