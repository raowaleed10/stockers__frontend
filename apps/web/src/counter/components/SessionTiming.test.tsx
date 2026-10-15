import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import type { WorkerSession } from '@stockers/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clock } from '@/lib/clock';
import { registerResources } from '@/lib/i18n';
import { counterResources } from '../locales';
import { SessionTiming } from './SessionTiming';

registerResources(counterResources);

const ZAIN: WorkerSession = {
  worker: { id: 'zain', name: 'Zain', slot: { start: '14:00', end: '23:00' } },
  until: '2026-10-03T23:00:00+05:00',
};

const at = (time: string) => clock.setStart(Date.parse(`2026-10-03T${time}+05:00`));

function setup() {
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
  render(
    <QueryClientProvider client={queryClient}>
      <SessionTiming session={ZAIN} />
    </QueryClientProvider>,
  );
  return { invalidate };
}
const wait = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const BANNER = 'Your sign-in time ends at 11:00 PM. Finish what you are doing.';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  clock.reset();
});

describe('the end of Zain’s sign-in time (14:00 to 23:00)', () => {
  it('shows no banner at 21:42, 78 minutes before the end', () => {
    at('21:42:00');
    setup();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows no banner at 22:49:59 (11 minutes to go) and the banner from 22:50:00 (10 minutes)', () => {
    at('22:49:58');
    setup();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    wait(1000);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    wait(1000);
    expect(screen.getByRole('status')).toHaveTextContent(BANNER);
  });

  it('shows the banner at 22:51, with the time his sign-in ends', () => {
    at('22:51:00');
    setup();
    expect(screen.getByRole('status')).toHaveTextContent(BANNER);
  });

  it('does not touch the server while his time is running', () => {
    at('22:55:00');
    const { invalidate } = setup();
    wait(60_000);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('at 23:00 the banner goes and the app asks the server who is signed in', () => {
    at('22:59:58');
    const { invalidate } = setup();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(invalidate).not.toHaveBeenCalled();
    wait(2000);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['me'] });
  });

  it('keeps asking every 2 seconds, because the server decides and may disagree with this clock', () => {
    at('23:00:00');
    const { invalidate } = setup();
    const first = invalidate.mock.calls.length;
    expect(first).toBe(1);
    wait(6000);
    expect(invalidate.mock.calls.length).toBe(first + 3);
  });

  it('asks at once if the page opens after his time is over', () => {
    at('23:30:00');
    const { invalidate } = setup();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['me'] });
  });

  it('is a time of day: another date at the same time gives the same answer', () => {
    clock.setStart(Date.parse('2026-12-24T22:55:00+05:00'));
    setup();
    expect(screen.getByRole('status')).toHaveTextContent(BANNER);
  });
});
