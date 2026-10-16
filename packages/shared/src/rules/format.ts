// Formatting for money, time and phone numbers (docs/07_RULES_FOR_SCREENS.md §1).
// Pure functions: no clock, no browser. The club runs on Pakistan time (UTC+5, no daylight saving),
// so times are read at that fixed offset and give the same text on any computer.

import type { ISO, Rs } from '../types';
import { CLUB_UTC_OFFSET_MS } from './club-time';

export type FormatLang = 'en' | 'ur';

const MINUS = '−'; // the true minus sign, not a hyphen

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// Urdu names, Sunday first like the English list (the owners gave these on 15 Oct 2026).
const UR_WEEKDAYS = ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ'];
const UR_MONTHS = [
  'جنوری',
  'فروری',
  'مارچ',
  'اپریل',
  'مئی',
  'جون',
  'جولائی',
  'اگست',
  'ستمبر',
  'اکتوبر',
  'نومبر',
  'دسمبر',
];

/**
 * The Urdu word for the time of day, by club time (the owners gave these hours on 15 Oct 2026):
 * صبح 4:00 AM to 11:59 AM, دوپہر 12:00 PM to 3:59 PM, شام 4:00 PM to 6:59 PM, رات 7:00 PM to 3:59 AM.
 * They match the approved examples رات 9:42, صبح 11:10 and شام 4:15.
 */
export function urduDayPart(hours: number): 'صبح' | 'دوپہر' | 'شام' | 'رات' {
  if (hours >= 4 && hours < 12) return 'صبح';
  if (hours >= 12 && hours < 16) return 'دوپہر';
  if (hours >= 16 && hours < 19) return 'شام';
  return 'رات';
}

/** 1350 -> "1,350". Western grouping in every language. */
function group(value: number): string {
  return String(Math.abs(Math.round(value))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const pad2 = (value: number) => String(value).padStart(2, '0');

/** `1,350`: the grouped number alone, for a column that already says it is money. */
export function formatAmount(value: Rs): string {
  return `${Math.round(value) < 0 ? MINUS : ''}${group(value)}`;
}

/** `Rs 1,350`; in Urdu `1,350 روپے`. A negative amount starts with a true minus sign. */
export function formatRs(value: Rs, lang: FormatLang = 'en'): string {
  const sign = Math.round(value) < 0 ? MINUS : '';
  const digits = group(value);
  return lang === 'ur' ? `${sign}${digits} روپے` : `${sign}Rs ${digits}`;
}

/** `− 50` or `+ 200`, the same in both languages. Zero has no sign. */
export function formatSigned(value: Rs): string {
  const rounded = Math.round(value);
  if (rounded === 0) return '0';
  return `${rounded < 0 ? MINUS : '+'} ${group(rounded)}`;
}

/** `18:42`; under ten minutes `08:12`; from one hour `1:12:05`. */
export function formatTimer(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${pad2(minutes)}:${pad2(seconds)}`
    : `${pad2(minutes)}:${pad2(seconds)}`;
}

/** The club's wall-clock fields for an ISO date-time. */
function clubTime(iso: ISO): Date {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) throw new RangeError(`Not a date-time: ${iso}`);
  return new Date(time + CLUB_UTC_OFFSET_MS); // read it with the getUTC* methods
}

/** The two halves of a clock time: the numbers (`9:42`) and the word that goes with them (`PM`, `رات`). */
export interface ClockParts {
  time: string;
  period: string;
}

function partsOf(hours: number, minutes: number, lang: FormatLang): ClockParts {
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return {
    time: `${hour12}:${pad2(minutes)}`,
    period: lang === 'ur' ? urduDayPart(hours) : hours >= 12 ? 'PM' : 'AM',
  };
}

/**
 * The numbers and the period apart, for the big clock (screens 1, 34: "9:42" and then "PM, Saturday 3 October")
 * and the top bar in Urdu (screen 6: "9:42" and then "رات، ہفتہ 3 اکتوبر"). Digits are Western in both languages.
 */
export function clockParts(iso: ISO, lang: FormatLang = 'en'): ClockParts {
  const t = clubTime(iso);
  return partsOf(t.getUTCHours(), t.getUTCMinutes(), lang);
}

/** `9:42 PM`; in Urdu `رات 9:42` (the day-part word first, then the numbers). */
export function formatClock(iso: ISO, lang: FormatLang = 'en'): string {
  const { time, period } = clockParts(iso, lang);
  return lang === 'ur' ? `${period} ${time}` : `${time} ${period}`;
}

/**
 * `Sat 3 Oct`; with `long`, `Saturday 3 October`. Urdu has one form, the long one: `ہفتہ 3 اکتوبر`
 * (screen 6 writes the whole weekday and month even in the narrow top bar).
 */
export function formatDay(iso: ISO, long = false, lang: FormatLang = 'en'): string {
  const t = clubTime(iso);
  if (lang === 'ur') {
    return `${UR_WEEKDAYS[t.getUTCDay()]} ${t.getUTCDate()} ${UR_MONTHS[t.getUTCMonth()]}`;
  }
  const weekday = WEEKDAYS[t.getUTCDay()];
  const month = MONTHS[t.getUTCMonth()];
  return long
    ? `${weekday} ${t.getUTCDate()} ${month}`
    : `${weekday.slice(0, 3)} ${t.getUTCDate()} ${month.slice(0, 3)}`;
}

/** `Thursday`; in Urdu `جمعرات`: the weekday alone, for "Last played Thursday". */
export function formatWeekday(iso: ISO, lang: FormatLang = 'en'): string {
  const day = clubTime(iso).getUTCDay();
  return lang === 'ur' ? UR_WEEKDAYS[day] : WEEKDAYS[day];
}

/** `3 Oct`: the day and month with no weekday, for the "When" column of a list (screens 30, 49). Urdu: `3 اکتوبر`. */
export function formatDate(iso: ISO, lang: FormatLang = 'en'): string {
  const t = clubTime(iso);
  return lang === 'ur'
    ? `${t.getUTCDate()} ${UR_MONTHS[t.getUTCMonth()]}`
    : `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()].slice(0, 3)}`;
}

/**
 * `{start:'14:00', end:'23:00'}` -> `2:00 PM to 11:00 PM`; in Urdu `دوپہر 2:00 سے رات 11:00 تک`
 * ("from … to …", the way the Urdu sentence of screen 2 reads).
 */
export function formatSlot(slot: { start: string; end: string }, lang: FormatLang = 'en'): string {
  const text = (hhmm: string) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
    if (!match) throw new RangeError(`Not a time of day: ${hhmm}`);
    const { time, period } = partsOf(Number(match[1]), Number(match[2]), lang);
    return lang === 'ur' ? `${period} ${time}` : `${time} ${period}`;
  };
  return lang === 'ur'
    ? `${text(slot.start)} سے ${text(slot.end)} تک`
    : `${text(slot.start)} to ${text(slot.end)}`;
}

/** `0300 7654512` -> `0300 •••• 4512`: the network code and the last four digits, as on screens 25 and 30. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length < 8 ? phoneTail(phone) : `${digits.slice(0, 4)} •••• ${digits.slice(-4)}`;
}

/** `0300 7654512` -> `•••• 4512`. Only the last four digits are shown. */
export function phoneTail(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `•••• ${digits.slice(-4)}`;
}
