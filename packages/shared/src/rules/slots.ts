// Worker sign-in times (docs/07 §6, decision D51).
// Only the time of day counts, never the date. The end is exclusive. A slot may cross midnight
// (22:00 to 06:00). The server decides with its own clock; the frontend uses these functions only to
// show the warning and the message.

import type { HHMM } from '../types';
import { clubMsOfDay, DAY_MS, MINUTE_MS, type Moment, toMs } from './club-time';

export interface Slot {
  start: HHMM;
  end: HHMM;
}

/** Minutes after midnight for "HH:MM". */
function minutesOf(hhmm: HHMM): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  const hours = match ? Number(match[1]) : NaN;
  const minutes = match ? Number(match[2]) : NaN;
  if (!match || hours > 23 || minutes > 59) throw new RangeError(`Not a time of day: ${hhmm}`);
  return hours * 60 + minutes;
}

/** True from the start up to, but not including, the end. A slot with the same start and end is empty. */
export function isWithinSlot(now: Moment, slot: Slot): boolean {
  const start = minutesOf(slot.start) * MINUTE_MS;
  const end = minutesOf(slot.end) * MINUTE_MS;
  const t = clubMsOfDay(now);
  if (start === end) return false;
  return start < end ? t >= start && t < end : t >= start || t < end;
}

/** Whole minutes left in the slot, rounded up (9 min 30 s left is 10). Zero when outside the slot. */
export function minutesUntilSlotEnd(now: Moment, slot: Slot): number {
  if (!isWithinSlot(now, slot)) return 0;
  const end = minutesOf(slot.end) * MINUTE_MS;
  const remaining = (end - clubMsOfDay(now) + DAY_MS) % DAY_MS;
  return Math.ceil(remaining / MINUTE_MS);
}

/** The banner "Your sign-in time ends at 11:00 PM" shows from 10 minutes before the end. */
export function isSlotEndingSoon(now: Moment, slot: Slot, warnMin = 10): boolean {
  return isWithinSlot(now, slot) && minutesUntilSlotEnd(now, slot) <= warnMin;
}

/** The moment the slot ends, for a worker who is inside it now ("Until 11:00 PM"). */
export function slotEndAfter(now: Moment, slot: Slot): Date {
  const end = minutesOf(slot.end) * MINUTE_MS;
  const until = (end - clubMsOfDay(now) + DAY_MS) % DAY_MS;
  return new Date(toMs(now) + (until === 0 ? DAY_MS : until));
}

/** The next moment the slot starts, after `now` ("Shabir can sign in from 2:00 AM"). */
export function nextSlotStart(now: Moment, slot: Slot): Date {
  const start = minutesOf(slot.start) * MINUTE_MS;
  const until = (start - clubMsOfDay(now) + DAY_MS) % DAY_MS;
  return new Date(toMs(now) + (until === 0 ? DAY_MS : until));
}
