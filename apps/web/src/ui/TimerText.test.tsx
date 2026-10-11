import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clock } from '@/lib/clock';
import { TimerText } from './TimerText';

// The demo clock starts at 9:42 PM on 3 Oct 2026 (CLAUDE.md, rule 7) and ticks with the fake timers.
const NOW = '2026-10-03T21:42:00+05:00';

beforeEach(() => {
  vi.useFakeTimers();
  clock.init({ app: 'counter', search: `?now=${encodeURIComponent(NOW)}` });
});

afterEach(() => {
  vi.useRealTimers();
  clock.reset();
});

const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const timer = () => screen.getByRole('timer');

describe('TimerText', () => {
  it('shows the time played so far on the demo clock', () => {
    render(<TimerText startedAt="2026-10-03T21:23:18+05:00" />);
    expect(timer()).toHaveTextContent('18:42');
  });

  it('ticks once a second', () => {
    render(<TimerText startedAt="2026-10-03T21:23:18+05:00" />);
    tick(1000);
    expect(timer()).toHaveTextContent('18:43');
    tick(4000);
    expect(timer()).toHaveTextContent('18:47');
  });

  it('shows hours from one hour on', () => {
    render(<TimerText startedAt="2026-10-03T20:29:55+05:00" />);
    expect(timer()).toHaveTextContent('1:12:05');
  });

  it('is plain text under 30 minutes and turns into the red card at 30:00', () => {
    render(<TimerText startedAt="2026-10-03T21:12:01+05:00" />); // 29:59 now
    expect(timer()).toHaveTextContent('29:59');
    expect(timer().className).not.toContain('bg-s-card');
    tick(1000);
    expect(timer()).toHaveTextContent('30:00');
    expect(timer().className).toContain('bg-s-card');
  });

  it('shows the red card straight away for a game that is already over 30 minutes', () => {
    render(<TimerText startedAt="2026-10-03T21:07:50+05:00" />);
    expect(timer()).toHaveTextContent('34:10');
    expect(timer().className).toContain('bg-s-card');
  });

  it('follows an explicit variant instead of the 30-minute rule', () => {
    const { rerender } = render(
      <TimerText startedAt="2026-10-03T21:42:00+05:00" variant="redCard" />,
    );
    expect(timer().className).toContain('bg-s-card');
    rerender(<TimerText startedAt="2026-10-03T21:07:50+05:00" variant="plain" />);
    expect(timer().className).not.toContain('bg-s-card');
  });

  it('does not count paused time', () => {
    render(<TimerText startedAt="2026-10-03T21:23:18+05:00" pausedMs={3 * 60_000} />);
    expect(timer()).toHaveTextContent('15:42');
  });

  it('stays at the moment a game was paused', () => {
    render(
      <TimerText startedAt="2026-10-03T21:18:00+05:00" pausedAt="2026-10-03T21:30:04+05:00" />,
    );
    expect(timer()).toHaveTextContent('12:04');
    tick(90_000);
    expect(timer()).toHaveTextContent('12:04');
  });

  it('stops where a game ended', () => {
    render(<TimerText startedAt="2026-10-03T21:00:00+05:00" endedAt="2026-10-03T21:25:30+05:00" />);
    expect(timer()).toHaveTextContent('25:30');
    tick(120_000);
    expect(timer()).toHaveTextContent('25:30');
  });

  it('can take its size from the page', () => {
    render(<TimerText startedAt="2026-10-03T21:23:18+05:00" size="inherit" />);
    expect(timer().className).not.toContain('text-tile-timer');
  });
});
