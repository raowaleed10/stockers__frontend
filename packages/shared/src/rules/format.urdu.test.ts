import { describe, expect, it } from 'vitest';
import { clockParts, formatClock, formatDate, formatDay, formatSlot, urduDayPart } from './format';

// Urdu clock, weekdays and months, as the owners gave them on 15 Oct 2026 (docs/09, "Urdu time").
// Every time below is club time (UTC+5), written at the +05:00 offset, so it reads the same on any computer.
const at = (hhmm: string, day = '2026-10-03') => `${day}T${hhmm}:00+05:00`;

describe('the Urdu word for the time of day: every boundary', () => {
  it.each([
    ['03:59', 'رات 3:59'], // the last minute of رات
    ['04:00', 'صبح 4:00'], // صبح begins
    ['11:59', 'صبح 11:59'], // the last minute of صبح
    ['12:00', 'دوپہر 12:00'], // دوپہر begins
    ['15:59', 'دوپہر 3:59'], // the last minute of دوپہر
    ['16:00', 'شام 4:00'], // شام begins
    ['18:59', 'شام 6:59'], // the last minute of شام
    ['19:00', 'رات 7:00'], // رات begins
  ])('%s is written %s', (hhmm, expected) => {
    expect(formatClock(at(hhmm), 'ur')).toBe(expected);
  });

  it('puts midnight and the small hours in رات, with 12 for the hour', () => {
    expect(formatClock(at('00:00'), 'ur')).toBe('رات 12:00');
    expect(formatClock(at('00:05'), 'ur')).toBe('رات 12:05');
    expect(formatClock(at('02:30'), 'ur')).toBe('رات 2:30');
  });

  it('covers all 24 hours with one of the four words, and each word has the hours the owners gave', () => {
    const words = Array.from({ length: 24 }, (_, hour) => urduDayPart(hour));
    expect(words.slice(0, 4)).toEqual(['رات', 'رات', 'رات', 'رات']);
    expect(words.slice(4, 12)).toEqual(Array(8).fill('صبح'));
    expect(words.slice(12, 16)).toEqual(Array(4).fill('دوپہر'));
    expect(words.slice(16, 19)).toEqual(Array(3).fill('شام'));
    expect(words.slice(19, 24)).toEqual(Array(5).fill('رات'));
  });

  it('gives the approved examples of docs/09', () => {
    expect(formatClock(at('21:42'), 'ur')).toBe('رات 9:42');
    expect(formatClock(at('11:10'), 'ur')).toBe('صبح 11:10');
    expect(formatClock(at('16:15'), 'ur')).toBe('شام 4:15');
    expect(formatClock(at('23:00'), 'ur')).toBe('رات 11:00');
    expect(formatClock(at('21:00'), 'ur')).toBe('رات 9:00');
  });

  it('keeps Western digits and never writes AM or PM', () => {
    const text = formatClock(at('21:42'), 'ur');
    expect(text).toMatch(/9:42/);
    expect(text).not.toMatch(/[AP]M|[٠-٩۰-۹]/);
  });

  it('reads club time, not the time of the computer: 21:42 at +05:00 is 16:42 UTC and still رات', () => {
    expect(formatClock('2026-10-03T16:42:00Z', 'ur')).toBe('رات 9:42');
  });

  it('leaves English exactly as it was', () => {
    expect(formatClock(at('21:42'))).toBe('9:42 PM');
    expect(formatClock(at('21:42'), 'en')).toBe('9:42 PM');
    expect(formatClock(at('00:05'))).toBe('12:05 AM');
    expect(formatClock(at('12:00'))).toBe('12:00 PM');
  });
});

describe('clockParts', () => {
  it('splits the numbers from the word, for the big clock', () => {
    expect(clockParts(at('21:42'))).toEqual({ time: '9:42', period: 'PM' });
    expect(clockParts(at('21:42'), 'ur')).toEqual({ time: '9:42', period: 'رات' });
    expect(clockParts(at('04:00'), 'ur')).toEqual({ time: '4:00', period: 'صبح' });
  });
});

describe('Urdu weekdays', () => {
  // 2026-10-04 is a Sunday, so these seven days run from Sunday to Saturday.
  it.each([
    ['2026-10-04', 'اتوار'],
    ['2026-10-05', 'پیر'],
    ['2026-10-06', 'منگل'],
    ['2026-10-07', 'بدھ'],
    ['2026-10-08', 'جمعرات'],
    ['2026-10-09', 'جمعہ'],
    ['2026-10-10', 'ہفتہ'],
  ])('%s is %s', (day, weekday) => {
    expect(formatDay(at('12:00', day), false, 'ur').split(' ')[0]).toBe(weekday);
  });

  it('writes the day as the approved Urdu board does, long or short', () => {
    expect(formatDay(at('21:42'), true, 'ur')).toBe('ہفتہ 3 اکتوبر');
    expect(formatDay(at('21:42'), false, 'ur')).toBe('ہفتہ 3 اکتوبر');
  });

  it('leaves the English day as it was', () => {
    expect(formatDay(at('21:42'))).toBe('Sat 3 Oct');
    expect(formatDay(at('21:42'), true)).toBe('Saturday 3 October');
  });
});

describe('Urdu months', () => {
  it.each([
    ['2026-01-15', 'جنوری'],
    ['2026-02-15', 'فروری'],
    ['2026-03-15', 'مارچ'],
    ['2026-04-15', 'اپریل'],
    ['2026-05-15', 'مئی'],
    ['2026-06-15', 'جون'],
    ['2026-07-15', 'جولائی'],
    ['2026-08-15', 'اگست'],
    ['2026-09-15', 'ستمبر'],
    ['2026-10-15', 'اکتوبر'],
    ['2026-11-15', 'نومبر'],
    ['2026-12-15', 'دسمبر'],
  ])('%s is in %s', (day, month) => {
    expect(formatDate(at('12:00', day), 'ur')).toBe(`15 ${month}`);
  });

  it('writes the date with no weekday, number first', () => {
    expect(formatDate(at('21:42'), 'ur')).toBe('3 اکتوبر');
    expect(formatDate(at('21:42'))).toBe('3 Oct');
  });

  it('reads the club day when the time after midnight is still the day before in UTC', () => {
    // 3:40 AM on 4 October, club time, is 22:40 UTC on 3 October.
    expect(formatDay('2026-10-04T03:40:00+05:00', true, 'ur')).toBe('اتوار 4 اکتوبر');
  });
});

describe('Urdu sign-in time', () => {
  it('writes "from … to …" with the day-part words', () => {
    expect(formatSlot({ start: '14:00', end: '23:00' }, 'ur')).toBe('دوپہر 2:00 سے رات 11:00 تک');
    expect(formatSlot({ start: '02:00', end: '10:00' }, 'ur')).toBe('رات 2:00 سے صبح 10:00 تک');
  });

  it('leaves the English sign-in time as it was', () => {
    expect(formatSlot({ start: '14:00', end: '23:00' })).toBe('2:00 PM to 11:00 PM');
  });
});
