import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clock, parseNowParam, useNow } from './clock';

const COUNTER_START = Date.parse('2026-10-03T21:42:00+05:00');
const OWNER_START = Date.parse('2026-10-03T22:30:00+05:00');

describe('clock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
  });

  afterEach(() => {
    clock.reset();
    vi.useRealTimers();
  });

  it('starts the counter demo clock at 9:42 PM on 3 Oct 2026 and ticks', () => {
    clock.init({ app: 'counter', search: '', demo: true });
    expect(clock.now()).toBe(COUNTER_START);
    vi.advanceTimersByTime(5000);
    expect(clock.now()).toBe(COUNTER_START + 5000);
  });

  it('starts the owner demo clock at 10:30 PM', () => {
    clock.init({ app: 'owner', search: '', demo: true });
    expect(clock.now()).toBe(OWNER_START);
  });

  it('uses the real time when the demo clock is off', () => {
    clock.init({ app: 'counter', search: '', demo: false });
    expect(clock.now()).toBe(Date.now());
  });

  it('lets ?now= override the demo clock, even when the "+" arrives as a space', () => {
    clock.init({ app: 'counter', search: '?now=2026-10-03T22:20:00%2B05:00', demo: true });
    expect(clock.now()).toBe(Date.parse('2026-10-03T22:20:00+05:00'));
    clock.init({ app: 'counter', search: '?now=2026-10-03T22:20:00+05:00', demo: true });
    expect(clock.now()).toBe(Date.parse('2026-10-03T22:20:00+05:00'));
  });

  it('ignores a ?now= value that is not a date', () => {
    expect(parseNowParam('soon')).toBeNull();
    clock.init({ app: 'counter', search: '?now=soon', demo: true });
    expect(clock.now()).toBe(COUNTER_START);
  });

  it('useNow refreshes every interval', () => {
    clock.init({ app: 'counter', search: '', demo: true });
    const { result } = renderHook(() => useNow(1000));
    expect(result.current).toBe(COUNTER_START);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current).toBe(COUNTER_START + 3000);
  });
});
