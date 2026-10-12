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

/** `9:42 PM` (English only for now; Urdu wording is added with P18). */
export function formatClock(iso: ISO): string {
  const t = clubTime(iso);
  return hhmmToText(t.getUTCHours(), t.getUTCMinutes());
}

/** `Sat 3 Oct`; with `long`, `Saturday 3 October`. */
export function formatDay(iso: ISO, long = false): string {
  const t = clubTime(iso);
  const weekday = WEEKDAYS[t.getUTCDay()];
  const month = MONTHS[t.getUTCMonth()];
  return long
    ? `${weekday} ${t.getUTCDate()} ${month}`
    : `${weekday.slice(0, 3)} ${t.getUTCDate()} ${month.slice(0, 3)}`;
}

/** `3 Oct`: the day and month with no weekday, for the "When" column of a list (screens 30, 49). */
export function formatDate(iso: ISO): string {
  const t = clubTime(iso);
  return `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()].slice(0, 3)}`;
}

function hhmmToText(hours: number, minutes: number): string {
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${pad2(minutes)} ${suffix}`;
}

/** `{start:'14:00', end:'23:00'}` -> `2:00 PM to 11:00 PM`. */
export function formatSlot(slot: { start: string; end: string }): string {
  const text = (hhmm: string) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
    if (!match) throw new RangeError(`Not a time of day: ${hhmm}`);
    return hhmmToText(Number(match[1]), Number(match[2]));
  };
  return `${text(slot.start)} to ${text(slot.end)}`;
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
