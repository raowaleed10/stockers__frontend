import { useLiveEvents } from '@/lib/events';
import { counterInvalidations } from './invalidations';

/** Mount once, inside the query provider: keeps every screen's data fresh. */
export function CounterLiveEvents() {
  useLiveEvents(counterInvalidations);
  return null;
}
