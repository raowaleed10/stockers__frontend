import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApi } from '@/mocks/test-server';
import { renderCounter, resetCounterState, textIs, wherePath } from '../test/harness';

const api = createTestApi();
beforeAll(() => api.server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => api.server.close());
beforeEach(() => {
  api.load({ as: 'none' });
  resetCounterState();
});
afterEach(() => resetCounterState());

const user = () => userEvent.setup();
const card = (name: RegExp) => screen.findByRole('button', { name });
const key = (digit: string) => screen.getByRole('button', { name: digit });

async function type(digits: string) {
  const u = user();
  for (const digit of digits) await u.click(key(digit));
}

describe('screen 1: who is working?', () => {
  it('lists Shabir and Zain with their times, and whose time it is now', async () => {
    renderCounter('/sign-in');
    expect(await screen.findByRole('heading', { name: 'Who is working?' })).toBeInTheDocument();
    const shabir = await card(/Shabir/);
    const zain = await card(/Zain/);
    expect(shabir).toHaveTextContent('2:00 AM to 10:00 AM');
    expect(shabir).toHaveTextContent('Not now');
    expect(zain).toHaveTextContent('2:00 PM to 11:00 PM');
    expect(zain).toHaveTextContent('Your time now');
  });

  it('says what the club is doing, from the public club status', async () => {
    renderCounter('/sign-in');
    expect(await screen.findByText('Snooker club, Mian Plaza')).toBeInTheDocument();
    expect(
      await screen.findByText(textIs('Sheet 48 is open since 11:10 AM. 6 of 9 tables in use.')),
    ).toBeInTheDocument();
  });

  it('shows the big clock as 9:42 and "PM, Saturday 3 October"', async () => {
    renderCounter('/sign-in');
    const clockBox = await screen.findByTestId('big-clock');
    expect(clockBox).toHaveTextContent('9:42');
    expect(clockBox).toHaveTextContent('PM, Saturday 3 October');
  });

  it('shows no keypad until a worker is picked, then asks for his 4-digit PIN', async () => {
    renderCounter('/sign-in');
    await card(/Zain/);
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument();
    await user().click(await card(/Zain/));
    expect(await screen.findByText(textIs('Zain, enter your 4-digit PIN'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zain/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Shabir/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('fills a dot for each digit, and Clear and Delete take them away', async () => {
    renderCounter('/sign-in');
    await user().click(await card(/Zain/));
    await type('22');
    expect(screen.getByRole('img', { name: '2 of 4 digits entered' })).toBeInTheDocument();
    await user().click(screen.getByRole('button', { name: 'Delete last digit' }));
    expect(screen.getByRole('img', { name: '1 of 4 digits entered' })).toBeInTheDocument();
    await user().click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByRole('img', { name: '0 of 4 digits entered' })).toBeInTheDocument();
  });

  it('signs Zain in with 2222 and lands on / inside the frame', async () => {
    const view = renderCounter('/sign-in');
    await user().click(await card(/Zain/));
    await type('2222');
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(await screen.findByRole('button', { name: /Signed in: Zain/ })).toBeInTheDocument();
    expect(api.db.s.auth.session).toMatchObject({ kind: 'worker', workerId: 'zain' });
  });

  it('answers a wrong PIN with "Wrong PIN. Try again." and empties the dots', async () => {
    const view = renderCounter('/sign-in');
    await user().click(await card(/Zain/));
    await type('9999');
    expect(await screen.findByText('Wrong PIN. Try again.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '0 of 4 digits entered' })).toBeInTheDocument();
    expect(wherePath(view)).toBe('/sign-in');
    // He can try again, and the message goes when he starts.
    await type('2');
    expect(screen.queryByText('Wrong PIN. Try again.')).not.toBeInTheDocument();
  });

  it('asks him to wait 5 minutes after 5 wrong tries, and ignores the keypad meanwhile', async () => {
    renderCounter('/sign-in');
    await user().click(await card(/Zain/));
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await type('9999');
      await waitFor(() =>
        expect(screen.getByRole('img', { name: '0 of 4 digits entered' })).toBeInTheDocument(),
      );
    }
    expect(await screen.findByText('Wait 5 minutes')).toBeInTheDocument();
    await type('2');
    expect(screen.getByRole('img', { name: '0 of 4 digits entered' })).toBeInTheDocument();
  });
});

describe('screen 2: not your time to sign in', () => {
  it('shows the red alert when the server says NOT_YOUR_TIME, after the 4th digit', async () => {
    renderCounter('/sign-in');
    await user().click(await card(/Shabir/));
    await type('1111');
    const alert = await screen.findByRole('alert');
    expect(within(alert).getByRole('heading', { name: 'Not your time to sign in' })).toBeVisible();
    expect(alert).toHaveTextContent('Shabir can sign in from 2:00 AM to 10:00 AM.');
    expect(alert).toHaveTextContent('It is 9:42 PM now.');
    expect(alert).toHaveTextContent('Only an owner can change sign-in times.');
    // The keypad is replaced by the alert.
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument();
    // The server wrote the attempt down for the owners.
    expect(api.db.s.workerEvents.some((e) => e.kind === 'not-your-time')).toBe(true);
  });

  it('puts focus on OK when the server answered, and OK clears the selection', async () => {
    const view = renderCounter('/sign-in');
    await user().click(await card(/Shabir/));
    await type('1111');
    const ok = await screen.findByRole('button', { name: 'OK' });
    expect(ok).toHaveFocus();
    await user().click(ok);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Shabir/ })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /Zain/ })).toHaveAttribute('aria-pressed', 'false');
    expect(wherePath(view)).toBe('/sign-in');
  });

  it('opens straight on the alert at /sign-in?worker=shabir, without a sign-in call', async () => {
    const view = renderCounter('/sign-in?worker=shabir');
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Shabir can sign in from 2:00 AM to 10:00 AM.');
    expect(alert).toHaveTextContent('It is 9:42 PM now.');
    expect(screen.getByRole('button', { name: /Shabir/ })).toHaveAttribute('aria-pressed', 'true');
    // Nobody tried to sign in, so nothing is written down as an attempt, and focus is not stolen.
    expect(api.db.s.workerEvents.some((e) => e.kind === 'not-your-time')).toBe(false);
    expect(screen.getByRole('button', { name: 'OK' })).not.toHaveFocus();
    // OK also drops ?worker, so the page is a plain sign-in page again.
    await user().click(screen.getByRole('button', { name: 'OK' }));
    expect(wherePath(view)).toBe('/sign-in');
  });

  it('opens on the keypad for ?worker=zain, because it is his time', async () => {
    renderCounter('/sign-in?worker=zain');
    expect(await screen.findByText(textIs('Zain, enter your 4-digit PIN'))).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('no owner option anywhere (docs/08 §1)', () => {
  it('has no link, and no button that mentions an owner or an address', async () => {
    renderCounter('/sign-in');
    await card(/Zain/);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    for (const button of screen.getAllByRole('button')) {
      expect(button.textContent?.toLowerCase()).not.toContain('owner');
    }
    expect(document.body.querySelector('[href], [src]')).toBeNull();
  });

  it('does not say the word owner before the server has answered', async () => {
    renderCounter('/sign-in');
    await card(/Zain/);
    expect(document.body.textContent?.toLowerCase()).not.toContain('owner');
  });
});

describe('the sign-in page when something is wrong', () => {
  it('says so, plainly, if the workers cannot be loaded, and has a way to try again', async () => {
    api.server.use(
      http.get('/api/counter/workers/public', () => new HttpResponse(null, { status: 500 })),
    );
    renderCounter('/sign-in');
    // The page asks once more before it gives up.
    expect(
      await screen.findByText('Could not load the workers.', {}, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
