import { describe, expect, it } from 'vitest';
import { clubDayNumber, clubMsOfDay, toClubIso, toMs } from './club-time';

describe('club time', () => {
  it('writes an ISO date-time at +05:00 with no milliseconds', () => {
    expect(toClubIso(Date.parse('2026-10-03T21:42:00+05:00'))).toBe('2026-10-03T21:42:00+05:00');
    expect(toClubIso(Date.parse('2026-10-03T16:42:07.912Z'))).toBe('2026-10-03T21:42:07+05:00');
  });

  it('rolls over to the next day at midnight in Pakistan', () => {
    expect(toClubIso(Date.parse('2026-10-03T19:30:00Z'))).toBe('2026-10-04T00:30:00+05:00');
  });

  it('reads the time of day in club time', () => {
    expect(clubMsOfDay('2026-10-03T21:42:00+05:00')).toBe((21 * 60 + 42) * 60_000);
    expect(clubMsOfDay('2026-10-03T16:42:00Z')).toBe((21 * 60 + 42) * 60_000);
  });

  it('numbers days by the club calendar', () => {
    expect(
      clubDayNumber('2026-10-04T00:30:00+05:00') - clubDayNumber('2026-10-03T23:30:00+05:00'),
    ).toBe(1);
  });

  it('accepts milliseconds, a Date or an ISO string, and refuses nonsense', () => {
    const ms = Date.parse('2026-10-03T21:42:00+05:00');
    expect(toMs(new Date(ms))).toBe(ms);
    expect(toMs('2026-10-03T21:42:00+05:00')).toBe(ms);
    expect(() => toMs('soon')).toThrow(RangeError);
  });
});
