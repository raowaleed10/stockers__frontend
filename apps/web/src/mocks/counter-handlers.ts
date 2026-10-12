import { buildCounterHandlers } from './counter/handlers';
import { getDb } from './db';

// Making the store here reads `?scenario=`, `?now=` and `?as=` and sets the demo clock, which has to
// happen before the first render. Handlers use the same store.
getDb('counter');

export const counterHandlers = buildCounterHandlers(() => getDb('counter'));
