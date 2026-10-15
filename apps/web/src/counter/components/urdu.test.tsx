import { screen, waitFor, within } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApi } from '@/mocks/test-server';
import { clock } from '@/lib/clock';
import { useLockStore } from '../session/lock-store';
import {
  renderCounter,
  resetCounterState,
  setLanguage,
  startCounterTests,
  textIs,
} from '../test/harness';

// The Urdu clock on the counter screens (docs/09): رات 9:42, صبح 11:10, شام 4:15, with the owners' hours,
// weekdays and months. Digits stay Western. Each line below is the approved wording of docs/09 where there is one.

const api = createTestApi();
beforeAll(() => startCounterTests(api), 30_000);
afterAll(() => api.server.close());
beforeEach(() => {
  api.load();
  resetCounterState();
  setLanguage('ur');
});
afterEach(() => resetCounterState());

describe('the top bar in Urdu (screen 6)', () => {
  it('shows "9:42" with "رات، ہفتہ 3 اکتوبر" next to it', async () => {
    renderCounter('/');
    const header = await screen.findByRole('banner');
    expect(await within(header).findByText('9:42')).toBeInTheDocument();
    expect(within(header).getByText('رات، ہفتہ 3 اکتوبر')).toBeInTheDocument();
    expect(header.textContent).not.toMatch(/\b[AP]M\b/);
  });

  it('writes when the sheet opened: "کھلی: صبح 11:10، ہفتہ 3 اکتوبر"', async () => {
    renderCounter('/');
    expect(await screen.findByText(textIs('کھلی: صبح 11:10، ہفتہ 3 اکتوبر'))).toBeInTheDocument();
    expect(screen.getByText('شیٹ 48')).toBeInTheDocument();
  });

  it('writes when the worker’s time ends: "رات 11:00 تک"', async () => {
    renderCounter('/');
    const chip = await screen.findByRole('button', { name: /سائن اِن: Zain/ });
    expect(chip).toHaveTextContent('رات 11:00 تک');
    expect(chip).toHaveAccessibleName('سائن اِن: Zain، رات 11:00 تک۔ کارکن بدلنے کے لیے ٹیپ کریں');
  });

  it('writes the backup time: "بیک اپ: رات 9:00"', async () => {
    renderCounter('/');
    expect(await screen.findByText(textIs('بیک اپ: رات 9:00'))).toBeInTheDocument();
  });

  it('gives the bell and the buttons their approved Urdu words', async () => {
    renderCounter('/');
    expect(await screen.findByRole('button', { name: 'اطلاعات، 3 نئی' })).toBeInTheDocument();
    const bar = screen.getByRole('contentinfo');
    for (const name of [
      'چیک آؤٹ',
      'کینٹین',
      'کھلاڑی',
      'آج کا حساب',
      'خرچہ',
      'سب روکیں',
      'شیٹ بند کریں',
    ]) {
      expect(within(bar).getByRole('button', { name })).toBeInTheDocument();
    }
  });
});

describe('the sign-in page in Urdu (screens 1 and 2)', () => {
  it('writes the big clock as "9:42" and "رات، ہفتہ 3 اکتوبر"', async () => {
    api.load({ as: 'none' });
    renderCounter('/sign-in');
    const clockBox = await screen.findByTestId('big-clock');
    expect(clockBox).toHaveTextContent('9:42');
    expect(clockBox).toHaveTextContent('رات، ہفتہ 3 اکتوبر');
    expect(clockBox.textContent).not.toMatch(/[AP]M|Saturday|October/);
  });

  it('writes each worker’s time as "from … to …" with the day-part words', async () => {
    api.load({ as: 'none' });
    renderCounter('/sign-in');
    expect(await screen.findByRole('button', { name: /Zain/ })).toHaveTextContent(
      'دوپہر 2:00 سے رات 11:00 تک',
    );
    expect(screen.getByRole('button', { name: /Shabir/ })).toHaveTextContent(
      'رات 2:00 سے صبح 10:00 تک',
    );
  });

  it('says the sheet and the tables in Urdu, with the Urdu time', async () => {
    api.load({ as: 'none' });
    renderCounter('/sign-in');
    expect(
      await screen.findByText(textIs('شیٹ 48 صبح 11:10 سے کھلی ہے۔ 9 میں سے 6 ٹیبل مصروف ہیں۔')),
    ).toBeInTheDocument();
  });

  it('screen 2 says his time and the time now in Urdu', async () => {
    api.load({ as: 'none' });
    renderCounter('/sign-in?worker=shabir');
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Shabir رات 2:00 سے صبح 10:00 تک سائن اِن کر سکتا ہے۔');
    expect(alert).toHaveTextContent('ابھی رات 9:42 بجے ہیں۔');
    expect(alert).toHaveTextContent('سائن اِن کا وقت صرف مالک بدل سکتا ہے۔');
    expect(alert.textContent).not.toMatch(/[AP]M/);
  });
});

describe('the banner and the lock in Urdu', () => {
  it('the 10-minute banner names the time in Urdu', async () => {
    clock.setStart(Date.parse('2026-10-03T22:51:00+05:00'));
    api.setTime('2026-10-03T22:51:00+05:00');
    renderCounter('/');
    // The router probe of the test harness is an <output>, which is also a status: pick the banner by its words.
    await waitFor(() => expect(screen.getAllByRole('status').length).toBeGreaterThan(1));
    const banner = screen.getAllByRole('status').find((node) => node.tagName !== 'OUTPUT')!;
    expect(banner).toHaveTextContent('رات 11:00');
    expect(banner.textContent).not.toMatch(/[AP]M/);
  });

  it('the lock screen has the Urdu clock line and pills', async () => {
    renderCounter('/');
    await screen.findByRole('banner');
    useLockStore.getState().lock();
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByTestId('big-clock')).toHaveTextContent('رات، ہفتہ 3 اکتوبر');
    expect(await within(dialog).findByText('کھیل جاری: 5')).toBeInTheDocument();
    expect(within(dialog).getByText('30 منٹ سے زیادہ: 1')).toBeInTheDocument();
    expect(within(dialog).getByText('خالی: 2')).toBeInTheDocument();
    expect(within(dialog).getByText('خراب: 1')).toBeInTheDocument();
  });
});

describe('switching language redraws the times', () => {
  it('shows English times again when the language goes back to English', async () => {
    renderCounter('/');
    expect(await screen.findByText('رات، ہفتہ 3 اکتوبر')).toBeInTheDocument();
    setLanguage('en');
    await waitFor(() => expect(screen.getByText('Sat 3 Oct')).toBeInTheDocument());
    expect(screen.getByText('9:42 PM')).toBeInTheDocument();
  });
});
