import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import * as counter from '@/counter/api';
import { counterInvalidations, useBoard, useMe, useSignIn } from '@/counter/api';
import * as owner from '@/owner/api';
import { ApiError, isApiError, isNotYourTime, isTooManyTries } from '@/lib/api-client';
import { connectLiveEvents, eventBus } from '@/lib/events';
import { createTestApi } from './test-server';

const api = createTestApi();
beforeAll(() => api.server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => eventBus.clear());
afterAll(() => api.server.close());

/** What a refused call throws, so a test can look at its code, status and details. */
async function refused(call: Promise<unknown>): Promise<ApiError> {
  try {
    await call;
  } catch (error) {
    if (isApiError(error)) return error;
    throw error;
  }
  throw new Error('Expected the call to be refused');
}

describe('worker sign-in over HTTP', () => {
  it('answers Shabir at 9:42 PM with 403 NOT_YOUR_TIME, his time and the time now', async () => {
    api.load({ as: 'none' });
    const error = await refused(counter.signIn({ workerId: 'shabir', pin: '1111' }));
    expect(isNotYourTime(error)).toBe(true);
    expect(error.status).toBe(403);
    expect(error.details).toEqual({
      slot: { start: '02:00', end: '10:00' },
      now: '2026-10-03T21:42:00+05:00',
    });
    expect(error.message).toContain('Shabir can sign in from 2:00 AM to 10:00 AM');
  });

  it('lets Zain in with 2222, and shows when his time ends', async () => {
    api.load({ as: 'none' });
    const session = await counter.signIn({ workerId: 'zain', pin: '2222' });
    expect(session).toEqual({
      worker: { id: 'zain', name: 'Zain', slot: { start: '14:00', end: '23:00' } },
      until: '2026-10-03T23:00:00+05:00',
    });
    expect(await counter.getMe()).toEqual(session);
  });

  it('lists the workers for the sign-in page with no session, and never sends a PIN', async () => {
    api.load({ as: 'none' });
    const workers = await counter.getPublicWorkers();
    expect(workers.map((w) => [w.name, w.canSignInNow])).toEqual([
      ['Shabir', false],
      ['Zain', true],
    ]);
    expect(JSON.stringify(workers)).not.toMatch(/1111|2222|pin/i);
  });

  it('says wrong PIN, then asks him to wait 5 minutes', async () => {
    api.load({ as: 'none' });
    const wrong = await refused(counter.signIn({ workerId: 'zain', pin: '9999' }));
    expect([wrong.status, wrong.code, wrong.message]).toEqual([
      401,
      'WRONG_PIN',
      'Wrong PIN. Try again.',
    ]);
    for (let i = 0; i < 3; i += 1) await refused(counter.signIn({ workerId: 'zain', pin: '9999' }));
    const locked = await refused(counter.signIn({ workerId: 'zain', pin: '9999' }));
    expect(isTooManyTries(locked)).toBe(true);
    expect(locked.status).toBe(429);
    expect(locked.details).toEqual({ retryAfterSec: 300 });
  });

  it('signs Zain out at 11:00 PM, and signs out and back in on request', async () => {
    api.load();
    expect((await counter.getMe()).worker.name).toBe('Zain');
    api.setTime('2026-10-03T23:00:00+05:00');
    const ended = await refused(counter.getBoard());
    expect([ended.status, ended.code]).toEqual([401, 'SESSION_ENDED']);
    expect((await refused(counter.getMe())).code).toBe('UNAUTHENTICATED');

    api.setTime('2026-10-03T21:42:00+05:00');
    await counter.signIn({ workerId: 'zain', pin: '2222' });
    await counter.signOut();
    expect((await refused(counter.getMe())).status).toBe(401);
  });
});

describe('who may call what', () => {
  it('answers 401 to a counter call with no worker session', async () => {
    api.load({ as: 'none' });
    for (const call of [
      counter.getBoard(),
      counter.getToday(),
      counter.getCheckoutList(),
      counter.getCanteenItems(),
      counter.getClosePreview(),
      counter.searchPlayers('ali'),
      counter.startGame({ tableId: 't2', type: 'single', playerIds: ['imran', 'naveed'] }),
    ]) {
      const error = await refused(call);
      expect([error.status, error.code]).toEqual([401, 'UNAUTHENTICATED']);
    }
  });

  it('answers 401 to a counter call from an owner session', async () => {
    api.load({ as: 'aqil' });
    expect((await refused(counter.getBoard())).status).toBe(401);
  });

  it('answers 404 to an owner call from a counter session, as if the owner API did not exist', async () => {
    api.load(); // Zain is signed in
    for (const call of [
      owner.getDashboard(),
      owner.getWorkers(),
      owner.getSettings(),
      owner.getActivity(),
      owner.getLive(),
      owner.getExpenses(),
      owner.getMe(),
    ]) {
      const error = await refused(call);
      expect([error.status, error.code, error.message]).toEqual([404, 'NOT_FOUND', 'Not found.']);
    }
  });

  it('answers 401 to an owner call with no session, and works once the owner has signed in', async () => {
    api.load({ as: 'none', app: 'owner' });
    expect((await refused(owner.getDashboard())).status).toBe(401);
    const session = await owner.signIn({ ownerId: 'adil', password: 'anything' });
    expect(session.owner.name).toBe('Adil Farooq');
    expect((await owner.getDashboard()).today.tablesTotal).toBe(9);
  });
});

describe('the typed client', () => {
  it('turns a refused call into an ApiError with {code, message} and the HTTP status', async () => {
    api.load();
    const error = await refused(
      counter.startGame({ tableId: 't1', type: 'single', playerIds: ['imran', 'naveed'] }),
    );
    expect(error).toBeInstanceOf(ApiError);
    expect([error.status, error.code, error.message]).toEqual([
      409,
      'TABLE_BUSY',
      'Table 1 is in use.',
    ]);
  });

  it('sends a query string and a JSON body', async () => {
    api.load();
    expect((await counter.getBoard('pool')).tables).toHaveLength(4);
    const found = await counter.searchPlayers('kamran');
    expect(found.map((p) => p.id)).toEqual(['kamran']);
    const game = await counter.startGame({
      tableId: 't2',
      type: 'single',
      playerIds: ['ahmed-nawaz', 'ali-akbar'],
    });
    expect((await counter.getGame(game.id)).players['ali-akbar'].name).toBe('Ali Akbar');
  });

  it('never sends who did it: the session decides (D52)', async () => {
    const db = api.load();
    const game = await counter.startGame({
      tableId: 't2',
      type: 'single',
      playerIds: ['ahmed-nawaz', 'ali-akbar'],
    });
    expect(game.startedBy).toEqual({ id: 'zain', name: 'Zain', role: 'worker' });
    // Asking to be someone else changes nothing.
    const sneaky = await counter.startRoom('r2', { underPlayerId: 'saad', hourly: 1500 });
    expect(sneaky.startedBy.name).toBe('Zain');
    expect(db.s.sheetHistory.s48?.every((line) => line.by.name === 'Zain')).toBe(true);
  });
});

describe('live events refresh the screens', () => {
  const setup = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const stop = connectLiveEvents(client, counterInvalidations);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return { client, stop, wrapper };
  };

  it('starting a game changes the board a hook is showing, with no reload', async () => {
    api.load();
    const { stop, wrapper } = setup();
    const { result } = renderHook(() => useBoard(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    const table2 = () => result.current.data?.tables.find((t) => t.id === 't2');
    expect(table2()?.game).toBeUndefined();
    expect(result.current.data?.categories.find((c) => c.id === 'snooker')?.inUse).toBe(5);

    await counter.startGame({
      tableId: 't2',
      type: 'single',
      playerIds: ['ahmed-nawaz', 'ali-akbar'],
    });
    await waitFor(() => expect(table2()?.game?.type).toBe('single'));
    expect(result.current.data?.categories.find((c) => c.id === 'snooker')?.inUse).toBe(6);
    stop();
  });

  it('ending a frame refreshes the waiting list (waiting.changed)', async () => {
    api.load();
    const { stop, wrapper } = setup();
    const { result } = renderHook(() => useBoard(), { wrapper });
    await waitFor(() => expect(result.current.data?.waiting).toHaveLength(5));
    await counter.endGame('g-t1-3', { loserIds: ['bilal'] });
    await waitFor(() =>
      expect(result.current.data?.waiting.find((b) => b.playerId === 'bilal')?.tonight).toBe(850),
    );
    stop();
  });

  it('does not refresh once the listener is stopped', async () => {
    api.load();
    const { stop, wrapper } = setup();
    const { result } = renderHook(() => useBoard(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    stop();
    await counter.startGame({
      tableId: 't2',
      type: 'single',
      playerIds: ['ahmed-nawaz', 'ali-akbar'],
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(result.current.data?.tables.find((t) => t.id === 't2')?.game).toBeUndefined();
  });

  it('a sign-in refreshes who is signed in', async () => {
    api.load({ as: 'none' });
    const { stop, wrapper } = setup();
    const me = renderHook(() => useMe(), { wrapper });
    await waitFor(() => expect(me.result.current.isError).toBe(true));
    expect(me.result.current.error).toBeInstanceOf(ApiError);

    const signIn = renderHook(() => useSignIn(), { wrapper });
    await act(async () => {
      await signIn.result.current.mutateAsync({ workerId: 'zain', pin: '2222' });
    });
    await waitFor(() => expect(me.result.current.data?.worker.name).toBe('Zain'));
    stop();
  });

  it('a mutation error is an ApiError the screen can show', async () => {
    api.load({ as: 'none' });
    const { stop, wrapper } = setup();
    const signIn = renderHook(() => useSignIn(), { wrapper });
    await act(async () => {
      await signIn.result.current
        .mutateAsync({ workerId: 'shabir', pin: '1111' })
        .catch(() => undefined);
    });
    await waitFor(() => expect(isNotYourTime(signIn.result.current.error)).toBe(true));
    stop();
  });
});
