import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

/** The live events of docs/06 §4. The real backend sends them over Socket.IO; the mock uses this bus. */
export type LiveEventName =
  | 'board.changed'
  | 'game.changed'
  | 'waiting.changed'
  | 'sheet.closed'
  | 'notification.created'
  | 'worker.signedIn'
  | 'worker.signedOut'
  | 'price.changed'
  | 'settings.changed';

export type LiveEventPayload = Record<string, unknown>;
type Listener = (name: LiveEventName, payload: LiveEventPayload | undefined) => void;

const listeners = new Map<LiveEventName | '*', Set<Listener>>();

export const eventBus = {
  /** Listens to one event, or to all of them with `'*'`. Returns the function that stops listening. */
  on(name: LiveEventName | '*', listener: Listener): () => void {
    const set = listeners.get(name) ?? new Set<Listener>();
    set.add(listener);
    listeners.set(name, set);
    return () => {
      set.delete(listener);
    };
  },

  /** Tells every listener. The mock server calls this after each write; a socket adapter would too. */
  emit(name: LiveEventName, payload?: LiveEventPayload): void {
    for (const key of [name, '*'] as const) {
      listeners.get(key)?.forEach((listener) => listener(name, payload));
    }
  },

  /** Removes every listener (tests). */
  clear(): void {
    listeners.clear();
  },
};

/** Which query keys to refresh when an event arrives. */
export type InvalidationMap = Partial<Record<LiveEventName, QueryKey[]>>;

/** On each event, invalidate the matching TanStack Query keys. Returns the function that stops it. */
export function connectLiveEvents(queryClient: QueryClient, map: InvalidationMap): () => void {
  return eventBus.on('*', (name) => {
    for (const queryKey of map[name] ?? []) void queryClient.invalidateQueries({ queryKey });
  });
}

/** Keeps the data on screen fresh. `map` must not change between renders: use a module constant. */
export function useLiveEvents(map: InvalidationMap): void {
  const queryClient = useQueryClient();
  useEffect(() => connectLiveEvents(queryClient, map), [queryClient, map]);
}
