import { getDb } from './db';
import { buildOwnerHandlers } from './owner/handlers';

// Making the store here reads `?scenario=`, `?now=` and `?as=` and sets the demo clock, which has to
// happen before the first render. Handlers use the same store.
getDb('owner');

export const ownerHandlers = buildOwnerHandlers(() => getDb('owner'));
