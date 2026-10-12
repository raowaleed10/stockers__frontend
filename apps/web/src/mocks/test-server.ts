import { setupServer } from 'msw/node';
import { buildCounterHandlers } from './counter/handlers';
import { createDb, type CreateDbOptions } from './db/load';
import type { MockDb } from './db/db';
import { seed } from './db/seed';
import { buildOwnerHandlers } from './owner/handlers';

/** The demo moment of the counter screens, as epoch milliseconds (test helper). */
export const NIGHT = Date.parse('2026-10-03T21:42:00+05:00');

/** A mock server for tests: both APIs over one store, with a clock the test can move. */
export function createTestApi() {
  const server = setupServer();
  let time = NIGHT;
  let db: MockDb;

  const load = (options: Partial<Omit<CreateDbOptions, 'now'>> = {}): MockDb => {
    const scenarioNow = options.scenario ? seed.scenarios[options.scenario].now : undefined;
    time = scenarioNow ? Date.parse(scenarioNow) : NIGHT;
    db = createDb(seed, { app: 'counter', ...options, now: () => time });
    server.resetHandlers(...buildCounterHandlers(() => db), ...buildOwnerHandlers(() => db));
    return db;
  };

  return {
    server,
    load,
    /** Moves the demo clock to an ISO moment. */
    setTime(iso: string) {
      time = Date.parse(iso);
    },
    advance(ms: number) {
      time += ms;
    },
    get db() {
      return db;
    },
  };
}
