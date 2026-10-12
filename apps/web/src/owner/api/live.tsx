import { useLiveEvents } from '@/lib/events';
import { ownerInvalidations } from './invalidations';

/** Mount once, inside the query provider: keeps every screen's data fresh. */
export function OwnerLiveEvents() {
  useLiveEvents(ownerInvalidations);
  return null;
}
