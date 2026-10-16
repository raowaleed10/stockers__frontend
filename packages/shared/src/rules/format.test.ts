import { describe, expect, it } from 'vitest';
import {
  formatAmount,
  formatClock,
  formatDate,
  formatDay,
  formatMonthYear,
  formatRs,
  formatSigned,
  formatSlot,
  formatTimer,
  maskPhone,
  phoneTail,
} from './format';

describe('formatMonthYear (screen 25: "Player since March 2026")', () => {
  it('writes the month and year', () => {
    expect(formatMonthYear('2026-03-14T10:00:00+05:00')).toBe('March 2026');
    expect(formatMonthYear('2026-12-31T23:30:00+05:00')).toBe('December 2026');
  });

  it('reads the club’s date, not the computer’s: 12:30 AM on 1 April is April', () => {
    expect(formatMonthYear('2026-04-01T00:30:00+05:00')).toBe('April 2026');
    expect(formatMonthYear('2026-03-31T19:30:00Z')).toBe('April 2026');
  });

  it('writes the Urdu month with Western digits', () => {
    expect(formatMonthYear('2026-03-14T10:00:00+05:00', 'ur')).toBe('مارچ 2026');
  });
});

describe('formatRs', () => {
  it('groups thousands in Western style', () => {
    expect(formatRs(0)).toBe('Rs 0');
    expect(formatRs(250)).toBe('Rs 250');
    expect(formatRs(1350)).toBe('Rs 1,350');
    expect(formatRs(214000)).toBe('Rs 214,000');
    expect(formatRs(1234567)).toBe('Rs 1,234,567');
  });

  it('puts the number first in Urdu', () => {
    expect(formatRs(1350, 'ur')).toBe('1,350 روپے');
    expect(formatRs(250, 'ur')).toBe('250 روپے');
  });

  it('starts a negative amount with a true minus sign', () => {
    expect(formatRs(-500)).toBe('−Rs 500');
    expect(formatRs(-1200, 'ur')).toBe('−1,200 روپے');
  });

  it('rounds to a whole rupee instead of showing paisa', () => {
    expect(formatRs(1166.67)).toBe('Rs 1,167');
  });
});

describe('formatAmount', () => {
  it('writes the number alone, grouped', () => {
    expect(formatAmount(250)).toBe('250');
    expect(formatAmount(1350)).toBe('1,350');
    expect(formatAmount(-1200)).toBe('−1,200');
  });
});

describe('formatSigned', () => {
  it('uses the true minus sign and a plus, with a space', () => {
    expect(formatSigned(-50)).toBe('− 50');
    expect(formatSigned(200)).toBe('+ 200');
    expect(formatSigned(-1350)).toBe('− 1,350');
  });

  it('shows zero without a sign', () => {
    expect(formatSigned(0)).toBe('0');
  });
});

describe('formatTimer', () => {
  it('shows minutes and seconds under an hour', () => {
    expect(formatTimer(0)).toBe('00:00');
    expect(formatTimer(8 * 60_000 + 12_000)).toBe('08:12');
    expect(formatTimer(18 * 60_000 + 42_000)).toBe('18:42');
    expect(formatTimer(34 * 60_000 + 10_000)).toBe('34:10');
  });

  it('adds hours from one hour', () => {
    expect(formatTimer(60 * 60_000)).toBe('1:00:00');
    expect(formatTimer(72 * 60_000 + 5_000)).toBe('1:12:05');
  });

  it('drops part seconds and never goes below zero', () => {
    expect(formatTimer(59_999)).toBe('00:59');
    expect(formatTimer(-5000)).toBe('00:00');
  });
});

describe('formatClock and formatDay', () => {
  it('reads the club time (UTC+5) whatever the computer zone is', () => {
    expect(formatClock('2026-10-03T21:42:00+05:00')).toBe('9:42 PM');
    expect(formatClock('2026-10-03T16:42:00Z')).toBe('9:42 PM');
    expect(formatClock('2026-10-03T11:10:00+05:00')).toBe('11:10 AM');
  });

  it('handles midnight and noon', () => {
    expect(formatClock('2026-10-04T00:05:00+05:00')).toBe('12:05 AM');
    expect(formatClock('2026-10-04T12:00:00+05:00')).toBe('12:00 PM');
    expect(formatClock('2026-10-04T03:45:00+05:00')).toBe('3:45 AM');
  });

  it('writes the short and long day', () => {
    expect(formatDay('2026-10-03T21:42:00+05:00')).toBe('Sat 3 Oct');
    expect(formatDay('2026-10-03T21:42:00+05:00', true)).toBe('Saturday 3 October');
  });

  it('writes the day and month with no weekday', () => {
    expect(formatDate('2026-09-15T21:10:00+05:00')).toBe('15 Sep');
    expect(formatDate('2026-10-03T20:15:00+05:00')).toBe('3 Oct');
  });

  it('puts a time after midnight (club time) on the next day', () => {
    // 22:00 UTC on 3 Oct is 03:00 on 4 Oct in Pakistan.
    expect(formatDay('2026-10-03T22:00:00Z')).toBe('Sun 4 Oct');
  });

  it('refuses text that is not a date-time', () => {
    expect(() => formatClock('tonight')).toThrow(RangeError);
  });
});

describe('formatSlot', () => {
  it('writes a sign-in time', () => {
    expect(formatSlot({ start: '14:00', end: '23:00' })).toBe('2:00 PM to 11:00 PM');
    expect(formatSlot({ start: '02:00', end: '10:00' })).toBe('2:00 AM to 10:00 AM');
  });

  it('keeps a slot that crosses midnight in the order given', () => {
    expect(formatSlot({ start: '22:00', end: '06:00' })).toBe('10:00 PM to 6:00 AM');
  });

  it('refuses a bad time of day', () => {
    expect(() => formatSlot({ start: 'two', end: '10:00' })).toThrow(RangeError);
  });
});

describe('phoneTail', () => {
  it('shows only the last four digits', () => {
    expect(phoneTail('0300 7654512')).toBe('•••• 4512');
    expect(phoneTail('03007654512')).toBe('•••• 4512');
    expect(phoneTail('0313-1112276')).toBe('•••• 2276');
  });
});

describe('maskPhone', () => {
  it('keeps the network code and the last four digits', () => {
    expect(maskPhone('0300 7654512')).toBe('0300 •••• 4512');
    expect(maskPhone('0313 1452276')).toBe('0313 •••• 2276');
  });

  it('falls back to the last four digits for a short number', () => {
    expect(maskPhone('7654512')).toBe('•••• 4512');
  });
});
