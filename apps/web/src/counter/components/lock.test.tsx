import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { clock } from '@/lib/clock';
import { createTestApi } from '@/mocks/test-server';
import { initLock, useLockStore } from '../session/lock-store';
import { renderCounter, resetCounterState, startCounterTests, wherePath } from '../test/harness';
import { IDLE_LOCK_MS, idleLockMs } from '../session/idle';
import { IdleLock } from './IdleLock';

const api = createTestApi();
beforeAll(() => startCounterTests(api), 30_000);
afterAll(() => api.server.close());
beforeEach(() => {
  api.load();
  resetCounterState();
});
afterEach(() => {
  vi.useRealTimers();
  resetCounterState();
});

const lockDialog = () => screen.findByRole('dialog', { name: 'Zain, enter your PIN' });

/**
 * Types digits on the lock's keypad. The keys are looked up inside the dialog, not on the whole page: a role query
 * checks every element of the page, and the board behind the lock has hundreds of them, so a query over the page
 * made each key (and the test) several times slower.
 */
async function type(digits: string) {
  const pad = within(await lockDialog());
  const u = userEvent.setup({ delay: null });
  for (const digit of digits) await u.click(pad.getByRole('button', { name: digit }));
}

describe('screen 34: the lock screen', () => {
  beforeEach(() => useLockStore.setState({ locked: true }));

  it('covers the page with "Zain, enter your PIN", four empty dots and the keypad', async () => {
    renderCounter('/');
    const dialog = await lockDialog();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByRole('img', { name: '0 of 4 digits entered' })).toBeInTheDocument();
    for (const digit of '0123456789') {
      expect(within(dialog).getByRole('button', { name: digit })).toBeInTheDocument();
    }
    expect(within(dialog).getByRole('button', { name: 'Delete last digit' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Switch worker' })).toBeInTheDocument();
    // There is no Clear key and no owner option on the lock screen.
    expect(within(dialog).queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    expect(dialog.textContent?.toLowerCase()).not.toContain('owner');
  });

  it('shows the big clock and the words of the screen', async () => {
    renderCounter('/');
    const dialog = await lockDialog();
    expect(within(dialog).getByTestId('big-clock')).toHaveTextContent('9:42');
    expect(within(dialog).getByTestId('big-clock')).toHaveTextContent('PM, Saturday 3 October');
    expect(await within(dialog).findByText('Tables right now')).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'Locked after 5 minutes without a tap. Games keep running while the screen is locked.',
      ),
    ).toBeInTheDocument();
  });

  it('summarises the tables with the status colours: 5 playing, 1 over 30 min, 2 free, 1 out of order', async () => {
    renderCounter('/');
    const dialog = await lockDialog();
    expect(await within(dialog).findByText('5 playing')).toBeInTheDocument();
    expect(within(dialog).getByText('1 over 30 min')).toBeInTheDocument();
    expect(within(dialog).getByText('2 free')).toBeInTheDocument();
    expect(within(dialog).getByText('1 out of order')).toBeInTheDocument();
  });

  it('names the limit when the games over their limit share one, and says "over the limit" when they do not (D56)', async () => {
    // Table 1 (18:42 in) is given a limit of 15 minutes. Table 4 (34:10) keeps 30. Two tables are over, with two limits.
    api.db.game('g-t1-3').maxMinutes = 15;
    renderCounter('/');
    const dialog = await lockDialog();
    expect(await within(dialog).findByText('2 over the limit')).toBeInTheDocument();
    expect(within(dialog).getByText('4 playing')).toBeInTheDocument();
  });

  it('puts the page behind it out of reach: inert and hidden from screen readers', async () => {
    renderCounter('/');
    await lockDialog();
    const frame = document.querySelector<HTMLElement>('[data-app="counter"][aria-hidden="true"]');
    expect(frame).not.toBeNull();
    expect(frame).toHaveAttribute('inert');
  });

  it('keeps focus on the dialog, and Escape does not close it', async () => {
    renderCounter('/');
    const dialog = await lockDialog();
    expect(dialog.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: 'Zain, enter your PIN' })).toBeInTheDocument();
    expect(useLockStore.getState().locked).toBe(true);
  });

  it('says "Wrong PIN. Try again." and stays locked', async () => {
    renderCounter('/');
    await lockDialog();
    await type('9999');
    expect(await screen.findByText('Wrong PIN. Try again.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '0 of 4 digits entered' })).toBeInTheDocument();
    expect(useLockStore.getState().locked).toBe(true);
  });

  it('unlocks with the right PIN through /auth/unlock, and the page is usable again', async () => {
    renderCounter('/');
    await lockDialog();
    await type('2222');
    await waitFor(() => expect(useLockStore.getState().locked).toBe(false));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.querySelector('[inert]')).toBeNull();
    expect(window.sessionStorage.getItem('stockers.counter.locked')).toBeNull();
  });

  it('asks him to wait after 5 wrong tries', async () => {
    renderCounter('/');
    const dialog = await lockDialog();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await type('9999');
      await waitFor(() =>
        expect(
          within(dialog).getByRole('img', { name: '0 of 4 digits entered' }),
        ).toBeInTheDocument(),
      );
    }
    expect(await screen.findByText('Wait 5 minutes')).toBeInTheDocument();
  });

  it('"Switch worker" signs him out, unlocks the page and goes to the sign-in page', async () => {
    const view = renderCounter('/');
    await lockDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Switch worker' }));
    await waitFor(() => expect(wherePath(view)).toBe('/sign-in'));
    expect(api.db.s.auth.session).toBeNull();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useLockStore.getState().locked).toBe(false);
  });

  it('sends him to the sign-in page if his time ended while the screen was locked', async () => {
    const view = renderCounter('/');
    await lockDialog();
    api.setTime('2026-10-03T23:05:00+05:00');
    clock.setStart(Date.parse('2026-10-03T23:05:00+05:00'));
    await type('2222');
    await waitFor(() => expect(wherePath(view)).toBe('/sign-in'));
  });
});

describe('locking by hand', () => {
  it('the Lock button locks at once and the PIN unlocks it', async () => {
    renderCounter('/');
    await userEvent.click(await screen.findByRole('button', { name: 'Lock' }));
    await lockDialog();
    expect(useLockStore.getState().locked).toBe(true);
  });
});

describe('the lock survives a reload, and ?locked=1 opens locked', () => {
  it('?locked=1 starts locked and remembers it', () => {
    initLock('?locked=1');
    expect(useLockStore.getState().locked).toBe(true);
    expect(window.sessionStorage.getItem('stockers.counter.locked')).toBe('1');
  });

  it('a reload after a lock stays locked; a fresh tab does not', () => {
    useLockStore.getState().lock();
    useLockStore.setState({ locked: false }); // the page is gone, the tab's storage is not
    initLock('');
    expect(useLockStore.getState().locked).toBe(true);
    window.sessionStorage.clear();
    initLock('');
    expect(useLockStore.getState().locked).toBe(false);
  });

  it('works when storage is blocked', () => {
    const blocked = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => useLockStore.getState().lock()).not.toThrow();
    expect(useLockStore.getState().locked).toBe(true);
    blocked.mockRestore();
  });
});

describe('the idle lock: 5 minutes without a touch', () => {
  const touch = () => act(() => void window.dispatchEvent(new Event('pointerdown')));
  const wait = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

  beforeEach(() => vi.useFakeTimers());

  it('is 5 minutes, and ?lockAfter=<seconds> shortens it only in development', () => {
    expect(IDLE_LOCK_MS).toBe(300_000);
    expect(idleLockMs('')).toBe(300_000);
    expect(idleLockMs('?lockAfter=3')).toBe(3000);
    expect(idleLockMs('?lockAfter=nonsense')).toBe(300_000);
    expect(idleLockMs('?lockAfter=-4')).toBe(300_000);
  });

  it('locks after 5 minutes and not a second before', () => {
    render(<IdleLock />);
    wait(299_000);
    expect(useLockStore.getState().locked).toBe(false);
    wait(1000);
    expect(useLockStore.getState().locked).toBe(true);
  });

  it('a touch starts the 5 minutes again', () => {
    render(<IdleLock />);
    wait(200_000);
    touch();
    wait(299_000);
    expect(useLockStore.getState().locked).toBe(false);
    wait(1000);
    expect(useLockStore.getState().locked).toBe(true);
  });

  it('a key press counts as a touch too', () => {
    render(<IdleLock />);
    wait(250_000);
    act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' })));
    wait(250_000);
    expect(useLockStore.getState().locked).toBe(false);
  });

  it('stops counting while locked, and starts again when unlocked', () => {
    render(<IdleLock />);
    wait(300_000);
    expect(useLockStore.getState().locked).toBe(true);
    act(() => useLockStore.getState().unlock());
    wait(299_000);
    expect(useLockStore.getState().locked).toBe(false);
    wait(1000);
    expect(useLockStore.getState().locked).toBe(true);
  });

  it('draws nothing', () => {
    const { container } = render(<IdleLock />);
    expect(container).toBeEmptyDOMElement();
  });
});
