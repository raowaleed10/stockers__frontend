// The club runs on Pakistan time (UTC+5, no daylight saving). Every rule that reads a time of day
// or a calendar day reads it at this fixed offset, so it gives the same answer on any computer.

export const CLUB_UTC_OFFSET_MS = 5 * 60 * 60 * 1000;
export const MINUTE_MS = 60_000;
export const DAY_MS = 24 * 60 * 60 * 1000;

/** A moment: epoch milliseconds, a `Date`, or an ISO date-time. */
export type Moment = number | Date | string;

export function toMs(moment: Moment): number {
  const ms = typeof moment === 'number' ? moment : new Date(moment).getTime();
  if (Number.isNaN(ms)) throw new RangeError(`Not a date-time: ${String(moment)}`);
  return ms;
}

/** Milliseconds since midnight, club time (0 to 86,399,999). */
export function clubMsOfDay(moment: Moment): number {
  const local = toMs(moment) + CLUB_UTC_OFFSET_MS;
  return ((local % DAY_MS) + DAY_MS) % DAY_MS;
}

/** The club's calendar day as a whole number, so two moments can be compared by day. */
export function clubDayNumber(moment: Moment): number {
  return Math.floor((toMs(moment) + CLUB_UTC_OFFSET_MS) / DAY_MS);
}

/** An ISO date-time at the club's +05:00 offset, with no milliseconds: `2026-10-03T21:42:00+05:00`. */
export function toClubIso(moment: Moment): string {
  return `${new Date(toMs(moment) + CLUB_UTC_OFFSET_MS).toISOString().slice(0, 19)}+05:00`;
}
