import { describe, expect, it } from 'vitest';
import {
  isSlotEndingSoon,
  isWithinSlot,
  minutesUntilSlotEnd,
  nextSlotStart,
  slotEndAfter,
} from './slots';

const at = (time: string, day = '2026-10-03') => Date.parse(`${day}T${time}+05:00`);

const ZAIN = { start: '14:00', end: '23:00' };
const SHABIR = { start: '02:00', end: '10:00' };
const NIGHT_SHIFT = { start: '22:00', end: '06:00' };

describe('isWithinSlot: the worked examples', () => {
  it('Zain 14:00-23:00 at 21:42 is inside', () => {
    expect(isWithinSlot(at('21:42:00'), ZAIN)).toBe(true);
    expect(minutesUntilSlotEnd(at('21:42:00'), ZAIN)).toBe(78);
  });

  it('Zain at 22:51 is inside and gets the warning (9 minutes left)', () => {
    expect(isWithinSlot(at('22:51:00'), ZAIN)).toBe(true);
    expect(minutesUntilSlotEnd(at('22:51:00'), ZAIN)).toBe(9);
    expect(isSlotEndingSoon(at('22:51:00'), ZAIN)).toBe(true);
  });

  it('Zain at 23:00 is outside and signed out (the end is exclusive)', () => {
    expect(isWithinSlot(at('23:00:00'), ZAIN)).toBe(false);
    expect(isWithinSlot(at('22:59:59'), ZAIN)).toBe(true);
  });

  it('Shabir 02:00-10:00 at 21:42 is outside', () => {
    expect(isWithinSlot(at('21:42:00'), SHABIR)).toBe(false);
    expect(minutesUntilSlotEnd(at('21:42:00'), SHABIR)).toBe(0);
  });

  it('a slot that crosses midnight (22:00-06:00) is inside at 01:30', () => {
    expect(isWithinSlot(at('01:30:00'), NIGHT_SHIFT)).toBe(true);
  });

  it('22:00-06:00 is outside at 06:00', () => {
    expect(isWithinSlot(at('06:00:00'), NIGHT_SHIFT)).toBe(false);
  });
});

describe('isWithinSlot: more cases', () => {
  it('includes the start', () => {
    expect(isWithinSlot(at('14:00:00'), ZAIN)).toBe(true);
    expect(isWithinSlot(at('13:59:59'), ZAIN)).toBe(false);
    expect(isWithinSlot(at('22:00:00'), NIGHT_SHIFT)).toBe(true);
    expect(isWithinSlot(at('21:59:59'), NIGHT_SHIFT)).toBe(false);
  });

  it('is inside either side of midnight', () => {
    expect(isWithinSlot(at('23:59:00'), NIGHT_SHIFT)).toBe(true);
    expect(isWithinSlot(at('00:00:00'), NIGHT_SHIFT)).toBe(true);
    expect(isWithinSlot(at('05:59:59'), NIGHT_SHIFT)).toBe(true);
  });

  it('ignores the date: any day gives the same answer', () => {
    expect(isWithinSlot(at('21:42:00', '2026-12-25'), ZAIN)).toBe(true);
    expect(isWithinSlot(at('21:42:00', '2027-02-14'), SHABIR)).toBe(false);
  });

  it('has gaps between slots: nobody can sign in at 11 AM', () => {
    expect(isWithinSlot(at('11:00:00'), ZAIN)).toBe(false);
    expect(isWithinSlot(at('11:00:00'), SHABIR)).toBe(false);
  });

  it('accepts a Date as well as milliseconds', () => {
    expect(isWithinSlot(new Date(at('21:42:00')), ZAIN)).toBe(true);
  });

  it('treats a slot with the same start and end as empty', () => {
    expect(isWithinSlot(at('12:00:00'), { start: '12:00', end: '12:00' })).toBe(false);
  });

  it('refuses a time that is not a time of day', () => {
    expect(() => isWithinSlot(at('12:00:00'), { start: '25:00', end: '10:00' })).toThrow(
      RangeError,
    );
    expect(() => isWithinSlot(at('12:00:00'), { start: 'noon', end: '10:00' })).toThrow(RangeError);
  });
});

describe('minutesUntilSlotEnd and the warning', () => {
  it('rounds up, so the warning starts exactly 10 minutes before the end', () => {
    expect(minutesUntilSlotEnd(at('22:50:00'), ZAIN)).toBe(10);
    expect(isSlotEndingSoon(at('22:50:00'), ZAIN)).toBe(true);
    expect(isSlotEndingSoon(at('22:49:59'), ZAIN)).toBe(false);
    expect(minutesUntilSlotEnd(at('22:50:30'), ZAIN)).toBe(10);
  });

  it('counts across midnight', () => {
    expect(minutesUntilSlotEnd(at('23:30:00'), NIGHT_SHIFT)).toBe(6 * 60 + 30);
    expect(minutesUntilSlotEnd(at('05:55:00'), NIGHT_SHIFT)).toBe(5);
  });

  it('has no warning outside the slot', () => {
    expect(isSlotEndingSoon(at('23:00:00'), ZAIN)).toBe(false);
    expect(isSlotEndingSoon(at('09:00:00'), ZAIN)).toBe(false);
  });
});

describe('nextSlotStart', () => {
  it('Shabir at 21:42 can sign in from 2:00 AM tomorrow', () => {
    expect(nextSlotStart(at('21:42:00'), SHABIR).getTime()).toBe(at('02:00:00', '2026-10-04'));
  });

  it('is later today when the slot has not started yet', () => {
    expect(nextSlotStart(at('11:00:00'), ZAIN).getTime()).toBe(at('14:00:00'));
  });

  it('is tomorrow when the slot is on now', () => {
    expect(nextSlotStart(at('14:00:00'), ZAIN).getTime()).toBe(at('14:00:00', '2026-10-04'));
    expect(nextSlotStart(at('21:42:00'), ZAIN).getTime()).toBe(at('14:00:00', '2026-10-04'));
  });
});

describe('slotEndAfter', () => {
  it('Zain at 21:42 is signed in until 11:00 PM tonight', () => {
    expect(slotEndAfter(at('21:42:00'), ZAIN).getTime()).toBe(at('23:00:00'));
  });

  it('finds the end after midnight for a slot that crosses it', () => {
    expect(slotEndAfter(at('23:30:00'), NIGHT_SHIFT).getTime()).toBe(at('06:00:00', '2026-10-04'));
    expect(slotEndAfter(at('01:30:00'), NIGHT_SHIFT).getTime()).toBe(at('06:00:00'));
  });
});
