import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApi } from '@/mocks/test-server';
import {
  renderOwner,
  resetOwnerState,
  setLanguage,
  setPhone,
  startOwnerTests,
  wherePath,
} from '../test/harness';

const api = createTestApi();
beforeAll(() => startOwnerTests(api), 60_000);
afterAll(() => api.server.close());
beforeEach(() => {
  api.load({ app: 'owner' });
  api.setTime('2026-10-03T22:30:00+05:00');
  resetOwnerState();
});

const signedOut = () => {
  api.db.s.auth.session = null;
};

describe('screen 35: owner sign-in on a computer', () => {
  it('shows the brand panel, the private-address note and the white card with Aqil picked', async () => {
    signedOut();
    renderOwner('/sign-in');
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText('Owner portal')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Money, sheets, players, prices, workers and settings. Only Aqil and Adil can sign in here.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/You opened/)).toHaveTextContent(
      'Private address. You opened localhost:3000. Workers don’t have this link and the counter screen never shows it. Keep it to yourselves.',
    );
    const who = screen.getByRole('group', { name: 'Who is signing in?' });
    const [aqil, adil] = await within(who).findAllByRole('radio');
    expect(aqil).toBeChecked();
    expect(adil).not.toBeChecked();
    expect(who).toHaveTextContent('Aqil Farooq');
    expect(who).toHaveTextContent('Adil Farooq');
    expect(who).toHaveTextContent('AF');
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(
      screen.getByRole('checkbox', { name: 'Keep me signed in on this computer' }),
    ).toBeChecked();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
    expect(
      screen.getByText(
        'Forgot the password? The other owner can set a new one in Settings. After 5 wrong tries, sign-in waits 15 minutes.',
      ),
    ).toBeInTheDocument();
    // No show-password button on a computer (screen 35 draws none), and no owner list from the counter app.
    expect(screen.queryByRole('button', { name: 'Show password' })).toBeNull();
  });

  it('the page still shows when somebody is signed in, and signing in as Adil opens the dashboard', async () => {
    const view = renderOwner('/sign-in');
    const who = await screen.findByRole('group', { name: 'Who is signing in?' });
    await userEvent.click(await within(who).findByRole('radio', { name: /Adil Farooq/ }));
    await userEvent.type(screen.getByLabelText('Password'), 'stockers48');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(await screen.findByRole('heading', { name: /^Today, / })).toBeInTheDocument();
    expect(api.db.s.auth.session).toMatchObject({ kind: 'owner', ownerId: 'adil' });
  });

  it('a wrong password says so, keeps the page, and the red box marks the field', async () => {
    signedOut();
    const view = renderOwner('/sign-in');
    await screen.findByRole('radio', { name: /Aqil Farooq/ });
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' })); // no password: wrong
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong password. Try again.');
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
    expect(wherePath(view)).toBe('/sign-in');
    expect(api.db.s.auth.session).toBeNull();
  });

  it('after 5 wrong tries it says to wait 15 minutes and the button is off', async () => {
    signedOut();
    renderOwner('/sign-in');
    await screen.findByRole('radio', { name: /Aqil Farooq/ });
    const button = screen.getByRole('button', { name: 'Sign in' });
    for (let i = 0; i < 5; i += 1) await userEvent.click(button);
    expect(await screen.findByText('Too many tries. Wait 15 minutes.')).toBeInTheDocument();
    expect(button).toBeDisabled();
    // Even the right password waits.
    await userEvent.type(screen.getByLabelText('Password'), 'stockers48');
    expect(button).toBeDisabled();
    expect(api.db.s.auth.session).toBeNull();
  });

  it('the guard sends a signed-out visit to /sign-in, and signing in opens the page that was asked for', async () => {
    signedOut();
    const view = renderOwner('/players');
    await waitFor(() => expect(wherePath(view)).toBe('/sign-in'));
    await screen.findByRole('radio', { name: /Aqil Farooq/ });
    await userEvent.type(screen.getByLabelText('Password'), 'stockers48');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(wherePath(view)).toBe('/players'));
    expect(await screen.findByRole('heading', { name: 'Players and credit' })).toBeInTheDocument();
  });

  it('a counter session is not an owner session: the owner pages go to /sign-in', async () => {
    api.load({ app: 'counter' });
    const view = renderOwner('/live');
    await waitFor(() => expect(wherePath(view)).toBe('/sign-in'));
  });
});

describe('screen 52: owner sign-in on a phone', () => {
  it('is one column with the place line, the eye button and the language pills at the bottom', async () => {
    setPhone(true);
    signedOut();
    renderOwner('/sign-in');
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText('Snooker club, Mian Plaza')).toBeInTheDocument();
    expect(screen.queryByText('Owner portal')).toBeNull();
    expect(screen.getByRole('checkbox', { name: 'Keep me signed in on this phone' })).toBeChecked();
    expect(
      screen.getByText(
        'This is the private owner address. Forgot the password? The other owner can set a new one in Settings.',
      ),
    ).toBeInTheDocument();
    const password = screen.getByLabelText('Password');
    await userEvent.type(password, 'stockers48');
    expect(password).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();
    const language = screen.getByRole('group', { name: 'Language' });
    expect(within(language).getByRole('button', { name: 'English' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(within(language).getByRole('button', { name: 'اردو' }));
    expect(await screen.findByRole('heading', { name: 'سائن ان' })).toBeInTheDocument();
  });
});

describe('screen 36: the sidebar of the owner frame', () => {
  const ORDER = [
    'Dashboard',
    'Live tables',
    'Sheets',
    'Players and credit',
    'Reports',
    'Games and prices',
    'Canteen',
    'Expenses',
    'Activity',
    'Workers',
    'Settings',
  ];

  it('lists the 11 pages in the order of docs/04, Dashboard open and bold, with Activity’s badge of 4', async () => {
    renderOwner('/');
    const nav = await screen.findByRole('navigation', { name: 'Owner menu' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.textContent?.replace(/\d+$/, ''))).toEqual(ORDER);
    expect(within(nav).getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Live tables' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(await within(nav).findByLabelText('4 new')).toHaveTextContent('4');
    expect(nav).toHaveTextContent('Aqil Farooq');
    expect(nav).toHaveTextContent('Owner');
    expect(within(nav).getByRole('group', { name: 'Language' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it.each([
    ['Live tables', '/live'],
    ['Sheets', '/sheets'],
    ['Players and credit', '/players'],
    ['Reports', '/reports'],
    ['Games and prices', '/prices'],
    ['Canteen', '/canteen'],
    ['Expenses', '/expenses'],
    ['Activity', '/activity'],
    ['Workers', '/workers'],
    ['Settings', '/settings'],
    ['Dashboard', '/'],
  ])('%s opens %s with its title and is the open page', async (name, path) => {
    const view = renderOwner(name === 'Dashboard' ? '/live' : '/');
    const nav = await screen.findByRole('navigation', { name: 'Owner menu' });
    // Activity carries the badge, so its name is "Activity 4 new".
    const link = () =>
      within(nav).getByRole('link', { name: new RegExp('^' + name + '( \\d+ new)?$') });
    await userEvent.click(link());
    await waitFor(() => expect(wherePath(view)).toBe(path));
    // The dashboard's title is the day (screen 36); the others are the page's name.
    expect(
      await screen.findByRole('heading', { name: name === 'Dashboard' ? /^Today, / : name }),
    ).toBeInTheDocument();
    expect(link()).toHaveAttribute('aria-current', 'page');
  });

  it('a page under a section keeps the section open (a month of sheets, a player, a price)', async () => {
    renderOwner('/players/kamran');
    const nav = await screen.findByRole('navigation', { name: 'Owner menu' });
    expect(within(nav).getByRole('link', { name: 'Players and credit' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('every route of docs/03 has a page inside the frame', async () => {
    for (const path of [
      '/sheets/2026-10',
      '/sheets/s48',
      '/sheets/s48/edit',
      '/players/kamran',
      '/prices/t4',
      '/prices/add',
      '/alerts',
    ]) {
      const view = renderOwner(path);
      await screen.findByRole('navigation', { name: 'Owner menu' });
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      view.unmount();
    }
  });

  it('Sign out ends the session and goes back to /sign-in at the same base path', async () => {
    const view = renderOwner('/expenses');
    const nav = await screen.findByRole('navigation', { name: 'Owner menu' });
    await userEvent.click(within(nav).getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(wherePath(view)).toBe('/sign-in'));
    expect(api.db.s.auth.session).toBeNull();
    expect(await screen.findByRole('radio', { name: /Aqil Farooq/ })).toBeInTheDocument();
  });

  it('the language switch at the bottom changes the words to Urdu', async () => {
    renderOwner('/');
    const nav = await screen.findByRole('navigation', { name: 'Owner menu' });
    await userEvent.click(within(nav).getByRole('button', { name: 'اردو' }));
    expect(await screen.findByRole('link', { name: 'ڈیش بورڈ' })).toBeInTheDocument();
    setLanguage('en');
  });
});

describe('screen 53: the phone frame', () => {
  it('has the brand and the bell with 4 new, and the five tabs, Home open', async () => {
    setPhone(true);
    renderOwner('/');
    expect(await screen.findByRole('link', { name: 'Notifications, 4 new' })).toHaveAttribute(
      'href',
      '/alerts',
    );
    expect(screen.queryByRole('navigation', { name: 'Owner menu' })).toBeNull();
    const tabs = screen.getByRole('navigation', { name: 'Main' });
    expect(
      within(tabs).getAllByRole('link').concat(within(tabs).getAllByRole('button')),
    ).toHaveLength(5);
    expect(within(tabs).getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    for (const name of ['Live', 'Sheets', 'Players']) {
      expect(within(tabs).getByRole('link', { name })).not.toHaveAttribute('aria-current');
    }
    expect(within(tabs).getByRole('button', { name: 'More' })).toBeInTheDocument();
  });

  it('the tabs open Live, Sheets and Players, and the bell opens the alerts', async () => {
    setPhone(true);
    const view = renderOwner('/');
    const tabs = await screen.findByRole('navigation', { name: 'Main' });
    for (const [name, path] of [
      ['Live', '/live'],
      ['Sheets', '/sheets'],
      ['Players', '/players'],
    ]) {
      await userEvent.click(within(tabs).getByRole('link', { name }));
      await waitFor(() => expect(wherePath(view)).toBe(path));
      expect(within(tabs).getByRole('link', { name })).toHaveAttribute('aria-current', 'page');
    }
    await userEvent.click(screen.getByRole('link', { name: 'Notifications, 4 new' }));
    await waitFor(() => expect(wherePath(view)).toBe('/alerts'));
    expect(await screen.findByRole('heading', { name: 'Alerts' })).toBeInTheDocument();
  });

  it('More opens a sheet with the other pages, and a page opened from it makes More the open tab', async () => {
    setPhone(true);
    const view = renderOwner('/');
    const tabs = await screen.findByRole('navigation', { name: 'Main' });
    await userEvent.click(within(tabs).getByRole('button', { name: 'More' }));
    const sheet = await screen.findByRole('dialog', { name: 'More' });
    expect(
      within(sheet)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      'Reports',
      'Games and prices',
      'Canteen',
      'Expenses',
      'Activity',
      'Workers',
      'Settings',
    ]);
    expect(within(sheet).getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(within(sheet).getByRole('group', { name: 'Language' })).toBeInTheDocument();
    await userEvent.click(within(sheet).getByRole('link', { name: 'Games and prices' }));
    await waitFor(() => expect(wherePath(view)).toBe('/prices'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(within(tabs).getByRole('button', { name: 'More' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(tabs).getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('Escape closes the More sheet and focus goes back to the tab', async () => {
    setPhone(true);
    renderOwner('/');
    const tabs = await screen.findByRole('navigation', { name: 'Main' });
    const more = within(tabs).getByRole('button', { name: 'More' });
    await userEvent.click(more);
    await screen.findByRole('dialog', { name: 'More' });
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(more).toHaveFocus();
  });

  it('Sign out in the More sheet goes to /sign-in', async () => {
    setPhone(true);
    const view = renderOwner('/');
    const tabs = await screen.findByRole('navigation', { name: 'Main' });
    await userEvent.click(within(tabs).getByRole('button', { name: 'More' }));
    const sheet = await screen.findByRole('dialog', { name: 'More' });
    await userEvent.click(within(sheet).getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(wherePath(view)).toBe('/sign-in'));
    expect(api.db.s.auth.session).toBeNull();
  });
});
