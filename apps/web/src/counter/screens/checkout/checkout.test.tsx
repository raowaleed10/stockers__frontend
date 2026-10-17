import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { clock } from '@/lib/clock';
import { createTestApi } from '@/mocks/test-server';
import {
  renderCounter,
  resetCounterState,
  setLanguage,
  startCounterTests,
  textIs,
  wherePath,
} from '../../test/harness';
import { useCheckoutDraft } from '../../checkout/draft';

const api = createTestApi();
const NIGHT_20 = '2026-10-03T22:20:00+05:00';

const at = (iso = NIGHT_20) => {
  api.load({ scenario: 'checkout' });
  api.setTime(iso);
  resetCounterState(Date.parse(iso));
};

beforeAll(async () => {
  await startCounterTests(api);
  // The first checkout of a file pays for everything that is cold (the bill through the mock server, the pages, the
  // payment call). Pay for it here so every test keeps the normal limits.
  at();
  const view = renderCounter('/checkout/bilal');
  await screen.findByRole('heading', { name: 'Bilal Ahmed' }, { timeout: 20_000 });
  view.unmount();
}, 60_000);
afterAll(() => api.server.close());
beforeEach(() => {
  at();
  useCheckoutDraft.getState().reset();
  useCheckoutDraft.setState({ lastOpened: null, playerId: null });
});
afterEach(() => {
  resetCounterState();
  useCheckoutDraft.getState().reset();
});

/** The green note after a payment (the harness's router probe is an <output>, which is also a status). */
const paidNote = () => screen.findByText(/ paid Rs /, { selector: 'p' });
const dialog = (name: string | RegExp) => screen.findByRole('dialog', { name });
const bill = (name: string | RegExp) => screen.findByRole('heading', { name });
const button = (name: string | RegExp) => screen.findByRole('button', { name });
const lines = (playerId: string) => api.db.statement(playerId);
const tonight = (playerId: string) =>
  api.db.tonightLines(playerId).reduce((sum, line) => sum + (line.charge ?? 0), 0);

/** Answers "Yes" on the sheet that every money action asks first (D63). */
async function confirmYes() {
  const sheet = await screen.findByRole('dialog');
  await userEvent.click(within(sheet).getByRole('button', { name: 'Yes' }));
}

/** Taps the digits on the amount keypad. */
async function typeDigits(digits: string[]) {
  const pad = await screen.findByRole('region', { name: 'Amount keypad' });
  for (const digit of digits) {
    await userEvent.click(within(pad).getByRole('button', { name: digit }));
  }
}

describe('screen 24: who is paying?', () => {
  it('lists the eight waiting bills as cards with the phone tail, what for and the total', async () => {
    renderCounter('/checkout');
    const bilal = await button(/^Bilal Ahmed/);
    expect(await screen.findByRole('heading', { name: 'Checkout' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tables' })).toBeInTheDocument();
    expect(bilal).toHaveTextContent('•••• 4512');
    expect(bilal).toHaveTextContent('3 frames, 2 teas tonight. Old credit Rs 500.');
    expect(bilal).toHaveTextContent('Rs 1,350');

    const card = (name: RegExp) => screen.getByRole('button', { name });
    expect(card(/^Ali Hassan/)).toHaveTextContent('Room 1, 1 h 40 min');
    expect(card(/^Ali Hassan/)).toHaveTextContent('Rs 2,500');
    expect(card(/^Kamran Iqbal/)).toHaveTextContent(
      'Half a double tonight. Old credit Rs 1,100, 18 days.',
    );
    expect(card(/^Kamran Iqbal/)).toHaveTextContent('Rs 1,350');
    expect(card(/^Saad Hussain/)).toHaveTextContent('Century Rs 630. Advance Rs 200 used.');
    expect(card(/^Saad Hussain/)).toHaveTextContent('Rs 430');
    expect(card(/^Zubair Khan/)).toHaveTextContent('2 frames, one charged double');
    expect(card(/^Zubair Khan/)).toHaveTextContent('Rs 600');
    expect(card(/^Faisal Mehmood/)).toHaveTextContent('Half a double');
    expect(card(/^Faisal Mehmood/)).toHaveTextContent('Rs 250');
    expect(card(/^Imran Shah/)).toHaveTextContent('Rs 200');
    expect(card(/^Naveed Akhtar/)).toHaveTextContent('Rs 200');
    expect(screen.getAllByRole('listitem')).toHaveLength(8);
  });

  it('the tab says 8, the foot says what happens at close and the total still waiting', async () => {
    renderCounter('/checkout');
    await button(/^Bilal Ahmed/);
    expect(await screen.findByRole('radio', { name: 'Waiting to pay (8)' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Owes from before' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Anyone not checked out when the sheet closes is moved to credit and marked “Left without checkout”.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Waiting tonight Rs 6,880')).toBeInTheDocument();
  });

  it('old credit that is more than 15 days old is amber, and an advance that is used is green', async () => {
    renderCounter('/checkout');
    await button(/^Bilal Ahmed/);
    const line = (card: RegExp, text: string | RegExp) =>
      within(screen.getByRole('button', { name: card })).getByText(text);
    expect(line(/^Kamran Iqbal/, /Old credit/).className).toContain('text-c-warn-ink');
    expect(line(/^Bilal Ahmed/, /Old credit/).className).not.toContain('text-c-warn-ink');
    expect(line(/^Saad Hussain/, /Advance Rs 200 used/).className).toContain('text-c-ok-ink');
  });

  it('a tap opens his bill, and the bill’s card has the brass border when you come back', async () => {
    const view = renderCounter('/checkout');
    await userEvent.click(await button(/^Bilal Ahmed/));
    expect(wherePath(view)).toBe('/checkout/bilal');
    await bill('Bilal Ahmed');
    await userEvent.click(screen.getByRole('button', { name: 'Checkout' }));
    expect(wherePath(view)).toBe('/checkout');
    expect(await button(/^Bilal Ahmed/)).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: /^Zubair Khan/ })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('Tables goes back to the board', async () => {
    const view = renderCounter('/checkout');
    await userEvent.click(await button('Tables'));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
  });

  it('draws no top bar and no action bar: the page has its own header', async () => {
    renderCounter('/checkout');
    await button(/^Bilal Ahmed/);
    expect(screen.queryByRole('contentinfo')).toBeNull();
    expect(screen.getAllByRole('banner')).toHaveLength(1);
  });

  it('searches every player by name, not only the ones waiting, and an old balance shows what he owes', async () => {
    const view = renderCounter('/checkout');
    await button(/^Bilal Ahmed/);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search any player' }), 'waq');
    const waqas = await button(/^Waqas/);
    expect(waqas).toHaveTextContent('Owes Rs 950 from before');
    expect(screen.queryByRole('button', { name: /^Bilal Ahmed/ })).toBeNull();
    await userEvent.click(waqas);
    expect(wherePath(view)).toBe('/checkout/waqas');
  });

  it('"Owes from before" lists the old credit: the bills that have some, then the others', async () => {
    renderCounter('/checkout');
    await button(/^Bilal Ahmed/);
    await userEvent.click(screen.getByRole('radio', { name: 'Owes from before' }));
    const names = (await screen.findAllByRole('listitem')).map(
      (item) => within(item).getByRole('button').textContent ?? '',
    );
    expect(names.some((text) => text.startsWith('Bilal Ahmed'))).toBe(true);
    expect(names.some((text) => text.startsWith('Kamran Iqbal'))).toBe(true);
    expect(names.some((text) => text.startsWith('Waqas'))).toBe(true);
    expect(names.some((text) => text.startsWith('Zubair Khan'))).toBe(false);
  });
});

describe('screen 25: a player’s bill', () => {
  it('Bilal: old credit with its date and age, tonight’s lines, and the total to pay', async () => {
    renderCounter('/checkout/bilal');
    await bill('Bilal Ahmed');
    expect(screen.getByText('0300 •••• 4512. Player since March 2026.')).toBeInTheDocument();
    const section = screen.getByRole('region', { name: 'Bill' });
    expect(section).toHaveTextContent('Old credit');
    expect(section).toHaveTextContent('Unpaid since Monday 21 Sep, 12 days');
    expect(section).toHaveTextContent('Rs 500');
    expect(section).toHaveTextContent('Tonight, sheet 48');
    const rows = within(section)
      .getAllByRole('listitem')
      .map((row) => row.textContent);
    expect(rows).toEqual([
      'Frame 1, Table 18:31 PM, lost to Ali RazaRs 250',
      'Frame 2, Table 18:56 PM, lost to Ali RazaRs 250',
      'Frame 3, Table 19:23 PM, lost to Ali RazaRs 250',
      'Tea × 2, canteen9:30 PMRs 100',
    ]);
    expect(section).toHaveTextContent('TonightRs 850');
    expect(section).toHaveTextContent('Total to payRs 1,350');
  });

  it('on the right: Paid in full, Paid part, Put all on credit, Paid by and Give a discount', async () => {
    renderCounter('/checkout/bilal');
    await bill('Bilal Ahmed');
    expect(screen.getByRole('button', { name: /^Paid in full/ })).toHaveTextContent(
      'Rs 1,350 received now',
    );
    expect(screen.getByRole('button', { name: /^Paid part/ })).toHaveTextContent(
      'The rest stays as credit',
    );
    expect(screen.getByRole('button', { name: /^Put all on credit/ })).toHaveTextContent(
      'Bilal will owe Rs 1,350',
    );
    const by = screen.getByRole('group', { name: 'Paid by' });
    expect(
      within(by)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Cash', 'Bank transfer', 'Easypaisa', 'JazzCash']);
    expect(within(by).getByRole('button', { name: 'Cash' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByText('Paying two ways? Use Paid part and add the second method.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Give a discount' })).toBeInTheDocument();
  });

  it('Paid in full by bank transfer: the bill is cleared, with a payment line under Zain’s name, and the list says so', async () => {
    const view = renderCounter('/checkout/bilal');
    await bill('Bilal Ahmed');
    await userEvent.click(
      within(screen.getByRole('group', { name: 'Paid by' })).getByRole('button', {
        name: 'Bank transfer',
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: /^Paid in full/ }));
    await confirmYes();
    await waitFor(() => expect(wherePath(view)).toBe('/checkout'));
    expect(await paidNote()).toHaveTextContent('Bilal Ahmed paid Rs 1,350.');
    expect(screen.queryByRole('button', { name: /^Bilal Ahmed/ })).toBeNull();
    expect(await screen.findByRole('radio', { name: 'Waiting to pay (7)' })).toBeChecked();
    expect(screen.getByText('Waiting tonight Rs 5,530')).toBeInTheDocument();

    const payment = lines('bilal').find((line) => line.kind === 'payment');
    expect(payment).toMatchObject({
      paid: 1350,
      method: 'bank',
      text: 'Payment, Bank transfer',
      doneBy: { name: 'Zain' },
    });
    expect(api.db.player('bilal').balance).toBe(0);
    expect(tonight('bilal')).toBe(0);
    expect(api.db.s.today.online.bank).toBeGreaterThanOrEqual(1350);
  });

  it('Put all on credit: nothing is received, the bill is cleared and he owes the whole Rs 1,350', async () => {
    const view = renderCounter('/checkout/bilal');
    await bill('Bilal Ahmed');
    const cash = api.db.s.today.cashReceived;
    await userEvent.click(screen.getByRole('button', { name: /^Put all on credit/ }));
    await confirmYes();
    await waitFor(() => expect(wherePath(view)).toBe('/checkout'));
    expect(await paidNote()).toHaveTextContent('Bilal Ahmed paid Rs 0. Rs 1,350 stays as credit.');
    expect(lines('bilal').some((line) => line.kind === 'payment')).toBe(false);
    expect(api.db.player('bilal').balance).toBe(1350);
    expect(tonight('bilal')).toBe(0);
    expect(api.db.s.today.cashReceived).toBe(cash);
  });

  it('Saad uses his Rs 200 advance and pays Rs 430', async () => {
    const view = renderCounter('/checkout/saad');
    await bill('Saad Hussain');
    const section = screen.getByRole('region', { name: 'Bill' });
    expect(section).toHaveTextContent('Advance held');
    expect(section).toHaveTextContent('− Rs 200');
    expect(section).toHaveTextContent('Century, Table 3, 42 min at Rs 15');
    expect(section).toHaveTextContent('Total to payRs 430');
    await userEvent.click(screen.getByRole('button', { name: /^Paid in full/ }));
    await confirmYes();
    await waitFor(() => expect(wherePath(view)).toBe('/checkout'));
    expect(lines('saad').find((line) => line.kind === 'payment')).toMatchObject({
      paid: 430,
      method: 'cash',
      doneBy: { name: 'Zain' },
    });
    expect(api.db.player('saad').balance).toBe(0);
  });

  it('a player with only old credit has a bill with no tonight lines, and can pay it', async () => {
    renderCounter('/checkout/waqas');
    await bill('Waqas Butt');
    const section = screen.getByRole('region', { name: 'Bill' });
    expect(section).toHaveTextContent('Old credit');
    expect(section).toHaveTextContent('Total to payRs 950');
    expect(within(section).queryAllByRole('listitem')).toHaveLength(0);
  });
});

describe('screen 27: give a discount', () => {
  it('starts empty: nothing is chosen for the worker, and Apply stays off until the amount and the reason are given', async () => {
    const view = renderCounter('/checkout/bilal/discount');
    const d = await dialog('Give Bilal a discount');
    expect(wherePath(view)).toBe('/checkout/bilal/discount');
    expect(d).toHaveTextContent('Owners see every discount with its reason.');
    expect(within(d).getByLabelText('Discount amount')).toHaveValue('');
    const apply = within(d).getByRole('button', { name: 'Apply discount' });
    expect(apply).toBeDisabled();
    await userEvent.type(within(d).getByLabelText('Discount amount'), '50');
    expect(apply).toBeDisabled();
    await userEvent.click(within(d).getByRole('button', { name: 'Rounded the bill' }));
    expect(within(d).getByRole('button', { name: 'Apply Rs 50 discount' })).toBeEnabled();
  });

  it('shows the bill, the discount and the new total: Rs 1,350, − Rs 50, Rs 1,300', async () => {
    renderCounter('/checkout/bilal/discount');
    const d = await dialog('Give Bilal a discount');
    await userEvent.click(within(d).getByRole('button', { name: 'Rs 50' }));
    expect(within(d).getByLabelText('Discount amount')).toHaveValue('50');
    const summary = within(d).getByText('New total').closest('div')?.parentElement as HTMLElement;
    expect(summary).toHaveTextContent('BillRs 1,350');
    expect(summary).toHaveTextContent('Discount− Rs 50');
    expect(summary).toHaveTextContent('New totalRs 1,300');
  });

  it('the five reasons, one chosen at a time, and the quick amounts Rs 50, Rs 100 and Rs 250', async () => {
    renderCounter('/checkout/bilal/discount');
    const d = await dialog('Give Bilal a discount');
    const reasons = within(d).getByRole('group', { name: 'Reason (required)' });
    expect(
      within(reasons)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Rounded the bill', 'Frame ended early', 'Table problem', 'Owner allowed', 'Other']);
    await userEvent.click(within(reasons).getByRole('button', { name: 'Table problem' }));
    await userEvent.click(within(reasons).getByRole('button', { name: 'Other' }));
    expect(within(reasons).getByRole('button', { name: 'Other' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(reasons).getByRole('button', { name: 'Table problem' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await userEvent.click(within(d).getByRole('button', { name: 'Rs 250' }));
    expect(within(d).getByLabelText('Discount amount')).toHaveValue('250');
  });

  it('refuses a discount of more than the bill: Rs 1,350 is allowed, Rs 1,351 is not', async () => {
    renderCounter('/checkout/bilal/discount');
    const d = await dialog('Give Bilal a discount');
    await userEvent.click(within(d).getByRole('button', { name: 'Other' }));
    const amount = within(d).getByLabelText('Discount amount');
    await userEvent.type(amount, '1351');
    expect(await within(d).findByRole('alert')).toHaveTextContent(
      'A discount cannot be more than the bill, Rs 1,350.',
    );
    expect(within(d).getByRole('button', { name: 'Apply discount' })).toBeDisabled();
    await userEvent.clear(amount);
    await userEvent.type(amount, '1350');
    expect(within(d).queryByRole('alert')).toBeNull();
    expect(within(d).getByRole('button', { name: 'Apply Rs 1,350 discount' })).toBeEnabled();
  });

  it('Apply puts the discount on the bill page: Rs 1,300 to pay, and nothing is saved yet', async () => {
    const view = renderCounter('/checkout/bilal');
    await bill('Bilal Ahmed');
    await userEvent.click(screen.getByRole('button', { name: 'Give a discount' }));
    const d = await dialog('Give Bilal a discount');
    await userEvent.click(within(d).getByRole('button', { name: 'Rs 50' }));
    await userEvent.click(within(d).getByRole('button', { name: 'Rounded the bill' }));
    await userEvent.type(
      within(d).getByLabelText('Note (optional)'),
      'Rounded Rs 1,350 down to Rs 1,300',
    );
    await userEvent.click(within(d).getByRole('button', { name: 'Apply Rs 50 discount' }));
    await waitFor(() => expect(wherePath(view)).toBe('/checkout/bilal'));
    const section = screen.getByRole('region', { name: 'Bill' });
    expect(section).toHaveTextContent('Discount (Rounded the bill)− Rs 50');
    expect(section).toHaveTextContent('Total to payRs 1,300');
    expect(screen.getByRole('button', { name: /^Paid in full/ })).toHaveTextContent(
      'Rs 1,300 received now',
    );
    expect(screen.getByRole('button', { name: /^Put all on credit/ })).toHaveTextContent(
      'Bilal will owe Rs 1,300',
    );
    expect(lines('bilal').some((line) => line.kind === 'discount')).toBe(false);
  });

  it('Paid in full after a discount: Rs 1,300 is received, the discount is on the statement, and the balance is 0', async () => {
    const view = renderCounter('/checkout/bilal');
    await bill('Bilal Ahmed');
    await userEvent.click(screen.getByRole('button', { name: 'Give a discount' }));
    const d = await dialog('Give Bilal a discount');
    await userEvent.click(within(d).getByRole('button', { name: 'Rs 50' }));
    await userEvent.click(within(d).getByRole('button', { name: 'Frame ended early' }));
    await userEvent.click(within(d).getByRole('button', { name: 'Apply Rs 50 discount' }));
    await userEvent.click(await button(/^Paid in full/));
    await confirmYes();
    await waitFor(() => expect(wherePath(view)).toBe('/checkout'));
    expect(lines('bilal').find((line) => line.kind === 'payment')).toMatchObject({
      paid: 1300,
      method: 'cash',
    });
    expect(lines('bilal').find((line) => line.kind === 'discount')).toMatchObject({
      paid: 50,
      text: 'Discount, Frame ended early',
    });
    expect(api.db.player('bilal').balance).toBe(0);
  });

  it('Cancel closes it without a discount, and a discount that was given can be taken off', async () => {
    const view = renderCounter('/checkout/bilal/discount');
    const d = await dialog('Give Bilal a discount');
    await userEvent.click(within(d).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(wherePath(view)).toBe('/checkout/bilal'));
    expect(screen.getByRole('region', { name: 'Bill' })).toHaveTextContent('Total to payRs 1,350');

    useCheckoutDraft.setState({
      playerId: 'bilal',
      discount: { amount: 100, reason: 'owner', note: '' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Give a discount' }));
    const again = await dialog('Give Bilal a discount');
    expect(within(again).getByLabelText('Discount amount')).toHaveValue('100');
    await userEvent.click(within(again).getByRole('button', { name: 'Remove discount' }));
    await waitFor(() => expect(wherePath(view)).toBe('/checkout/bilal'));
    expect(screen.getByRole('region', { name: 'Bill' })).toHaveTextContent('Total to payRs 1,350');
  });
});

describe('screen 26: part payment', () => {
  it('Bilal’s example end to end: 1,350, discount 50, cash 600 and Easypaisa 400, so 300 goes to credit', async () => {
    const view = renderCounter('/checkout/bilal');
    await bill('Bilal Ahmed');
    await userEvent.click(screen.getByRole('button', { name: 'Give a discount' }));
    const d = await dialog('Give Bilal a discount');
    await userEvent.click(within(d).getByRole('button', { name: 'Rs 50' }));
    await userEvent.click(within(d).getByRole('button', { name: 'Rounded the bill' }));
    await userEvent.click(within(d).getByRole('button', { name: 'Apply Rs 50 discount' }));
    await userEvent.click(await button(/^Paid part/));
    expect(wherePath(view)).toBe('/checkout/bilal/part');

    expect(
      await screen.findByRole('heading', { name: 'Bilal Ahmed pays part' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Total Rs 1,300 after a Rs 50 discount (Rounded the bill)'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bill' })).toBeInTheDocument();
    // The cash line is first and is being typed.
    expect(screen.getByText('Typing the Cash amount')).toBeInTheDocument();
    await typeDigits(['6', '0', '0']);
    await userEvent.click(screen.getByRole('button', { name: '+ Easypaisa' }));
    expect(screen.getByText('Typing the Easypaisa amount')).toBeInTheDocument();
    await typeDigits(['4', '0', '0']);

    const payments = screen.getByRole('region', { name: 'Payments' });
    expect(payments).toHaveTextContent('CashRs 600');
    expect(payments).toHaveTextContent('EasypaisaRs 400');
    expect(payments).toHaveTextContent('TotalRs 1,300');
    expect(payments).toHaveTextContent('Paid nowRs 1,000');
    expect(payments).toHaveTextContent('Stays as creditRs 300');
    expect(screen.getByRole('button', { name: /^Save payment/ })).toHaveTextContent(
      'Rs 300 goes on credit',
    );
    const cash = api.db.s.today.cashReceived;
    const easypaisa = api.db.s.today.online.easypaisa ?? 0;
    await userEvent.click(screen.getByRole('button', { name: /^Save payment/ }));
    await confirmYes();
    await waitFor(() => expect(wherePath(view)).toBe('/checkout'));
    expect(await paidNote()).toHaveTextContent(
      'Bilal Ahmed paid Rs 1,000. Rs 300 stays as credit.',
    );

    // The statement has the payments and the discount with Zain’s name, and 300 is left on credit.
    const statement = lines('bilal');
    expect(statement.filter((line) => line.kind === 'payment')).toEqual([
      expect.objectContaining({
        paid: 600,
        method: 'cash',
        doneBy: expect.objectContaining({ name: 'Zain' }),
      }),
      expect.objectContaining({
        paid: 400,
        method: 'easypaisa',
        doneBy: expect.objectContaining({ name: 'Zain' }),
      }),
    ]);
    expect(statement.find((line) => line.kind === 'discount')).toMatchObject({
      paid: 50,
      text: 'Discount, Rounded the bill',
      doneBy: { name: 'Zain' },
    });
    expect(api.db.player('bilal').balance).toBe(300);
    expect(tonight('bilal')).toBe(0);
    expect(api.db.s.today.cashReceived).toBe(cash + 600);
    expect(api.db.s.today.online.easypaisa).toBe(easypaisa + 400);
    expect(api.db.s.activity[0]).toMatchObject({
      type: 'discount',
      title: 'Discount for Bilal Ahmed',
      detail: 'Rounded the bill',
      amount: -50,
      by: { name: 'Zain' },
    });
    // The waiting list and the board have him off tonight's list.
    expect(screen.queryByRole('button', { name: /^Bilal Ahmed/ })).toBeNull();
  });

  it('with no discount the subtitle is only the total', async () => {
    renderCounter('/checkout/bilal/part');
    expect(await screen.findByText('Total Rs 1,350')).toBeInTheDocument();
  });

  it('the keypad types into the line that is selected: 00 adds two zeros, delete takes one digit off, and a leading 0 is not kept', async () => {
    renderCounter('/checkout/bilal/part');
    await screen.findByRole('heading', { name: 'Bilal Ahmed pays part' });
    await typeDigits(['0', '0', '5', '00']);
    const payments = screen.getByRole('region', { name: 'Payments' });
    expect(payments).toHaveTextContent('CashRs 500');
    const pad = screen.getByRole('region', { name: 'Amount keypad' });
    await userEvent.click(within(pad).getByRole('button', { name: 'Delete last digit' }));
    expect(payments).toHaveTextContent('CashRs 50');
  });

  it('paying more than the total keeps the extra as advance: Kamran pays Rs 1,500 on Rs 1,350 and Rs 150 is advance', async () => {
    const view = renderCounter('/checkout/kamran/part');
    await screen.findByRole('heading', { name: 'Kamran Iqbal pays part' });
    await typeDigits(['1', '5', '00']);
    const payments = screen.getByRole('region', { name: 'Payments' });
    expect(payments).toHaveTextContent('Paid nowRs 1,500');
    expect(payments).toHaveTextContent('Kept as advanceRs 150');
    expect(payments).not.toHaveTextContent('Stays as credit');
    expect(
      screen.getByText(
        'If he gives more than the total, the extra is kept as advance for his next visit.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Save payment/ })).toHaveTextContent(
      'Rs 150 is kept as advance',
    );
    await userEvent.click(screen.getByRole('button', { name: /^Save payment/ }));
    await confirmYes();
    await waitFor(() => expect(wherePath(view)).toBe('/checkout'));
    expect(await paidNote()).toHaveTextContent(
      'Kamran Iqbal paid Rs 1,500. Rs 150 is kept as advance.',
    );
    expect(api.db.player('kamran').balance).toBe(-150);
  });

  it('Save stays off until some money is typed; a line can be removed, and another method added back', async () => {
    renderCounter('/checkout/bilal/part');
    await screen.findByRole('heading', { name: 'Bilal Ahmed pays part' });
    const save = screen.getByRole('button', { name: /^Save payment/ });
    expect(save).toBeDisabled();
    expect(save).toHaveTextContent('Rs 1,350 goes on credit');
    await userEvent.click(screen.getByRole('button', { name: '+ JazzCash' }));
    await typeDigits(['2', '00']);
    const payments = screen.getByRole('region', { name: 'Payments' });
    expect(payments).toHaveTextContent('JazzCashRs 200');
    expect(save).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: 'Remove JazzCash line' }));
    expect(payments).not.toHaveTextContent('JazzCashRs');
    expect(screen.getByRole('button', { name: '+ JazzCash' })).toBeInTheDocument();
    expect(save).toBeDisabled();
  });

  it('a line can be picked to type into', async () => {
    renderCounter('/checkout/bilal/part');
    await screen.findByRole('heading', { name: 'Bilal Ahmed pays part' });
    await typeDigits(['3']);
    await userEvent.click(screen.getByRole('button', { name: '+ Bank transfer' }));
    await typeDigits(['4']);
    await userEvent.click(screen.getByRole('button', { name: 'Type into Cash' }));
    expect(screen.getByText('Typing the Cash amount')).toBeInTheDocument();
    await typeDigits(['5']);
    const payments = screen.getByRole('region', { name: 'Payments' });
    expect(payments).toHaveTextContent('CashRs 35');
    expect(payments).toHaveTextContent('Bank transferRs 4');
  });

  it('Bill goes back to the bill, keeping what was typed', async () => {
    const view = renderCounter('/checkout/bilal/part');
    await screen.findByRole('heading', { name: 'Bilal Ahmed pays part' });
    await userEvent.click(screen.getByRole('button', { name: 'Bill' }));
    await waitFor(() => expect(wherePath(view)).toBe('/checkout/bilal'));
  });
});

describe('money actions ask once (D63)', () => {
  const askedWith = async (name: string) => {
    const sheet = await screen.findByRole('dialog');
    expect(sheet).toHaveAccessibleName(name);
    return sheet;
  };

  it('Paid in full asks with the amount and the method, and nothing is saved until Yes', async () => {
    const view = renderCounter('/checkout/bilal');
    await bill('Bilal Ahmed');
    await userEvent.click(screen.getByRole('button', { name: /^Paid in full/ }));
    const sheet = await askedWith('Rs 1,350 paid: Cash 1,350?');
    expect(sheet).toHaveTextContent('Bilal Ahmed. You can undo it for 2 minutes.');
    expect(within(sheet).getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: 'No' })).toBeInTheDocument();
    expect(api.db.player('bilal').balance).toBe(1350);
    expect(wherePath(view)).toBe('/checkout/bilal');
  });

  it('No (and Escape) closes the sheet and saves nothing', async () => {
    const view = renderCounter('/checkout/bilal');
    await bill('Bilal Ahmed');
    await userEvent.click(screen.getByRole('button', { name: /^Paid in full/ }));
    await userEvent.click(
      within(await askedWith('Rs 1,350 paid: Cash 1,350?')).getByRole('button', { name: 'No' }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(api.db.player('bilal').balance).toBe(1350);
    expect(tonight('bilal')).toBe(850);

    await userEvent.click(screen.getByRole('button', { name: /^Put all on credit/ }));
    await askedWith('Put Rs 1,350 on Bilal Ahmed’s credit?');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(tonight('bilal')).toBe(850);
    expect(wherePath(view)).toBe('/checkout/bilal');
  });

  it('Put all on credit asks "Put Rs 1,350 on Bilal Ahmed’s credit?"', async () => {
    renderCounter('/checkout/bilal');
    await bill('Bilal Ahmed');
    await userEvent.click(screen.getByRole('button', { name: /^Put all on credit/ }));
    await askedWith('Put Rs 1,350 on Bilal Ahmed’s credit?');
  });

  it('a part payment asks with every method and what goes on credit: Rs 1,000 paid: Cash 600, Easypaisa 400, Rs 300 to credit?', async () => {
    renderCounter('/checkout/bilal/part');
    await screen.findByRole('heading', { name: 'Bilal Ahmed pays part' });
    await typeDigits(['6', '0', '0']);
    await userEvent.click(screen.getByRole('button', { name: '+ Easypaisa' }));
    await typeDigits(['4', '0', '0']);
    await userEvent.click(screen.getByRole('button', { name: /^Save payment/ }));
    await askedWith('Rs 1,000 paid: Cash 600, Easypaisa 400, Rs 350 to credit?');
    expect(tonight('bilal')).toBe(850);
  });

  it('an extra amount says it is kept as advance', async () => {
    renderCounter('/checkout/kamran/part');
    await screen.findByRole('heading', { name: 'Kamran Iqbal pays part' });
    await typeDigits(['1', '5', '00']);
    await userEvent.click(screen.getByRole('button', { name: /^Save payment/ }));
    await askedWith('Rs 1,500 paid: Cash 1,500, Rs 150 kept as advance?');
  });

  it('Yes saves it with Zain’s name and the list says so; the cream toast then offers Undo for 2 minutes', async () => {
    const view = renderCounter('/checkout/bilal');
    await bill('Bilal Ahmed');
    await userEvent.click(screen.getByRole('button', { name: /^Paid in full/ }));
    await askedWith('Rs 1,350 paid: Cash 1,350?');
    await confirmYes();
    await waitFor(() => expect(wherePath(view)).toBe('/checkout'));
    expect(await paidNote()).toHaveTextContent('Bilal Ahmed paid Rs 1,350.');
    const toast = await screen.findByText(textIs('Payment saved: Bilal Ahmed paid Rs 1,350.'));
    const card = toast.closest('[role="status"]') as HTMLElement;
    expect(card).toHaveTextContent(/Undo for (2:00|1:5\d) more/);
    expect(lines('bilal').find((line) => line.kind === 'payment')).toMatchObject({
      paid: 1350,
      doneBy: { name: 'Zain' },
    });
  });

  it('Undo on the toast takes the payment back: the bill is waiting again, the toast says so', async () => {
    renderCounter('/checkout/bilal');
    await bill('Bilal Ahmed');
    const cash = api.db.s.today.cashReceived;
    await userEvent.click(screen.getByRole('button', { name: /^Paid in full/ }));
    await confirmYes();
    const toast = (
      await screen.findByText(textIs('Payment saved: Bilal Ahmed paid Rs 1,350.'))
    ).closest('[role="status"]') as HTMLElement;
    expect(api.db.player('bilal').balance).toBe(0);
    await userEvent.click(within(toast).getByRole('button', { name: /Undo/ }));
    expect(await screen.findByText('Payment undone for Bilal Ahmed.')).toBeInTheDocument();
    expect(api.db.player('bilal').balance).toBe(1350);
    expect(tonight('bilal')).toBe(850);
    expect(api.db.s.today.cashReceived).toBe(cash);
    // He is on the waiting list again.
    expect(await button(/^Bilal Ahmed/)).toHaveTextContent('Rs 1,350');
    expect(api.db.s.activity[0]).toMatchObject({
      type: 'undo',
      title: 'Payment undone for Bilal Ahmed',
      by: { name: 'Zain' },
    });
  });

  it('a put-on-credit toast says so, and is only for the worker who took it', async () => {
    renderCounter('/checkout/bilal');
    await bill('Bilal Ahmed');
    await userEvent.click(screen.getByRole('button', { name: /^Put all on credit/ }));
    await confirmYes();
    expect(
      await screen.findByText(textIs('Put on credit: Bilal Ahmed’s bill.')),
    ).toBeInTheDocument();
  });

  it('the toast is gone after 2 minutes', async () => {
    renderCounter('/checkout/bilal');
    await bill('Bilal Ahmed');
    await userEvent.click(screen.getByRole('button', { name: /^Paid in full/ }));
    await confirmYes();
    await screen.findByText(textIs('Payment saved: Bilal Ahmed paid Rs 1,350.'));
    api.setTime('2026-10-03T22:23:30+05:00');
    clock.setStart(Date.parse('2026-10-03T22:23:30+05:00'));
    await waitFor(
      () =>
        expect(screen.queryByText(textIs('Payment saved: Bilal Ahmed paid Rs 1,350.'))).toBeNull(),
      { timeout: 4000 },
    );
  });
});

describe('in Urdu', () => {
  it('writes the list, the bill and the discount in Urdu with Western digits', async () => {
    at();
    setLanguage('ur');
    const view = renderCounter('/checkout');
    expect(await screen.findByRole('heading', { name: 'چیک آؤٹ' })).toBeInTheDocument();
    expect(await screen.findByRole('radio', { name: 'ادائیگی باقی (8)' })).toBeChecked();
    expect(screen.getByRole('button', { name: /^Bilal Ahmed/ })).toHaveTextContent('1,350 روپے');
    await userEvent.click(screen.getByRole('button', { name: /^Bilal Ahmed/ }));
    expect(await screen.findByRole('button', { name: /^پوری ادائیگی/ })).toBeInTheDocument();
    expect(wherePath(view)).toBe('/checkout/bilal');
    expect(screen.getByRole('region', { name: 'بل' })).toHaveTextContent('1,350 روپے');
  });
});
