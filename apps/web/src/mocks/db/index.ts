import type { AppId } from '@/lib/app-id';
import { clock, parseNowParam } from '@/lib/clock';
import { createDb, type CreateDbOptions } from './load';
import { seed } from './seed';
import type { MockDb } from './db';
import type { ScenarioName } from './seed-types';

export { MockDb } from './db';
export { MockApiError } from './errors';
export { createDb } from './load';
export { seed } from './seed';
export type { ScenarioName } from './seed-types';

const SCENARIOS: ScenarioName[] = [
  'paused',
  'checkout',
  'closing',
  'closed',
  'empty',
  'newGame',
  'roomEnd',
];

let instance: MockDb | null = null;

/** `?scenario=` is one of the names in the seed, or nothing. */
export function parseScenario(value: string | null): ScenarioName | null {
  return SCENARIOS.find((name) => name === value) ?? null;
}

/**
 * The store for this page. It is made once, from the address: `?scenario=` (another moment of the
 * night), `?now=` (the demo clock) and `?as=` (who is signed in). A scenario moves the clock to its
 * own moment unless `?now=` says otherwise. Call it before the first render so the clock is right.
 */
export function getDb(app: AppId): MockDb {
  if (instance) return instance;
  const search = typeof window === 'undefined' ? '' : window.location.search;
  const params = new URLSearchParams(search);
  const scenario = parseScenario(params.get('scenario'));
  if (scenario && parseNowParam(params.get('now')) === null) {
    const scenarioNow = seed.scenarios[scenario].now;
    if (scenarioNow) clock.setStart(Date.parse(scenarioNow));
  }
  instance = createDb(seed, { scenario, as: params.get('as'), app, now: () => clock.now() });
  return instance;
}

/** Starts again from the seed (tests, and the dev page's reset). */
export function resetDb(
  options: Omit<CreateDbOptions, 'now'> & { now?: () => number } = {},
): MockDb {
  instance = createDb(seed, { ...options, now: options.now ?? (() => clock.now()) });
  return instance;
}
