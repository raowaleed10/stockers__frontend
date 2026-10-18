import { describe, expect, it } from 'vitest';
import { hourLabel, monthName } from './format';
import {
  barWidth,
  compactMoney,
  dayAge,
  formatChange,
  niceAxis,
  percentChange,
  share,
} from './reports';

describe('percentChange (screen 37)', () => {
  it.each([
    [773_000, 735_200, 5.1],
    [214_000, 208_500, 2.6],
    [516_500, 486_400, 6.2],
    [471_500, 452_000, 4.3],
    [139_100, 128_900, 7.9],
    [92_800, 88_300, 5.1],
    [69_600, 66_000, 5.5],
    [512_600, 487_900, 5.1],
    [101_400, 95_800, 5.8],
    [88_900, 84_300, 5.5],
    [31_300, 28_600, 9.4],
    [734_200, 696_600, 5.4],
  ])('%i against %i is %f percent, the figure the PNG draws', (now, before, expected) => {
    expect(percentChange(now, before)).toBe(expected);
  });

  it('is negative when it fell, 0 when it did not move, and null with nothing to compare with', () => {
    expect(percentChange(90, 100)).toBe(-10);
    expect(percentChange(100, 100)).toBe(0);
    expect(percentChange(100, 0)).toBeNull();
    expect(percentChange(Number.NaN, 100)).toBeNull();
    expect(percentChange(100, Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('works for a fall from a bigger number and does not divide by a negative', () => {
    expect(percentChange(450, 500)).toBe(-10);
    expect(percentChange(-50, -100)).toBe(50);
  });
});

describe('formatChange', () => {
  it('writes the sign, one decimal, and the percent sign', () => {
    expect(formatChange(5.1)).toBe('+5.1%');
    expect(formatChange(-2.6)).toBe('−2.6%');
    expect(formatChange(22)).toBe('+22%');
    expect(formatChange(0)).toBe('0%');
    expect(formatChange(null)).toBe('–');
  });
});

describe('share and barWidth (screens 36 and 37)', () => {
  it('October’s money: 51,400, 15,500, 10,800 and 8,300 of 86,000 are 60, 18, 13 and 10 percent', () => {
    expect([51_400, 15_500, 10_800, 8_300].map((part) => share(part, 86_000))).toEqual([
      60, 18, 13, 10,
    ]);
  });

  it('by table, each against the longest: 95, 88, 86, 73, 71, 59, 46, 41', () => {
    const tables = [106_800, 101_200, 94_300, 91_400, 77_500, 76_100, 63_300, 49_500, 43_300];
    expect(tables.map((value) => barWidth(value, 106_800))).toEqual([
      100, 95, 88, 86, 73, 71, 59, 46, 41,
    ]);
  });

  it('a total of 0 or less is 0 percent, and a bar never goes past the whole width', () => {
    expect(share(5, 0)).toBe(0);
    expect(share(5, -1)).toBe(0);
    expect(barWidth(120, 100)).toBe(100);
  });
});

describe('compactMoney (the ticks and labels of the charts)', () => {
  it.each([
    [36_000, '36k'],
    [35_600, '35.6k'],
    [33_000, '33k'],
    [641_000, '641k'],
    [735_200, '735k'],
    [773_000, '773k'],
    [24_000, '24k'],
    [800, '800'],
    [0, '0'],
    [-12_500, '−12.5k'],
    [999_000, '999k'],
    [1_000_000, '1m'],
    [6_224_200, '6.2m'],
    [8_000_000, '8m'],
  ])('%i is written %s', (value, text) => {
    expect(compactMoney(value)).toBe(text);
  });
});

describe('dayAge (the age of a debt)', () => {
  const now = '2026-10-03T22:30:00+05:00';
  it('counts whole days at the moment given: Kamran 18, Ali Haider 25, Waqas 6, Junaid 31', () => {
    expect(dayAge(now, '2026-09-15T21:10:00+05:00')).toBe(18);
    expect(dayAge(now, '2026-09-08T22:00:00+05:00')).toBe(25);
    expect(dayAge(now, '2026-09-27T21:00:00+05:00')).toBe(6);
    expect(dayAge(now, '2026-09-02T20:00:00+05:00')).toBe(31);
  });
  it('is 0 on the same day and never negative', () => {
    expect(dayAge(now, '2026-10-03T08:00:00+05:00')).toBe(0);
    expect(dayAge(now, '2026-10-05T08:00:00+05:00')).toBe(0);
  });
});

describe('niceAxis', () => {
  it('earned per day: the highest day 35,600 gives 0, 12k, 24k, 36k', () => {
    expect(niceAxis(35_600, 3)).toEqual({ max: 36_000, ticks: [0, 12_000, 24_000, 36_000] });
  });
  it('the running total 773,000 in four steps gives 0 to 800k', () => {
    expect(niceAxis(773_000, 4)).toEqual({
      max: 800_000,
      ticks: [0, 200_000, 400_000, 600_000, 800_000],
    });
  });
  it('the highest value always fits under the top', () => {
    for (const max of [1, 7, 99, 1234, 35_600, 36_001, 250_000, 999_999]) {
      expect(niceAxis(max, 3).max).toBeGreaterThanOrEqual(max);
      expect(niceAxis(max, 4).max).toBeGreaterThanOrEqual(max);
    }
  });
  it('an empty chart still has an axis', () => {
    expect(niceAxis(0, 3)).toEqual({ max: 3, ticks: [0, 1, 2, 3] });
  });
});

describe('month and hour words', () => {
  it('names the month, short or long, in English and Urdu', () => {
    expect(monthName(9)).toBe('September');
    expect(monthName(1, 'en', true)).toBe('Jan');
    expect(monthName(10, 'ur')).toBe('اکتوبر');
  });
  it('writes the hour of a busy-hours bar', () => {
    expect([12, 16, 20, 22, 0, 4].map((h) => hourLabel(h))).toEqual([
      '12 PM',
      '4 PM',
      '8 PM',
      '10 PM',
      '12 AM',
      '4 AM',
    ]);
    expect(hourLabel(22, 'ur')).toBe('رات 10');
  });
});
