import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { eventBus } from '@/lib/events';
import { clock } from '@/lib/clock';
import { registerResources } from '@/lib/i18n';
import { createQueryClient } from '@/lib/query-client';
import { routerFuture } from '@/lib/router-future';
import { NIGHT } from '@/mocks/test-server';
import { CounterLiveEvents } from '../api';
import { counterResources } from '../locales';
import { useLockStore } from '../session/lock-store';
import { CounterRoutes } from '../routes';
import { Where } from './Where';

registerResources(counterResources);

/** The counter's routes with a fresh query client, the live events and a memory router. */
export function renderCounter(path: string) {
  const queryClient = createQueryClient();
  const view = render(
    <QueryClientProvider client={queryClient}>
      <CounterLiveEvents />
      <MemoryRouter initialEntries={[path]} future={routerFuture}>
        <CounterRoutes />
        <Where />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

/** The path the router is on now. */
export const wherePath = (view: ReturnType<typeof render>) => view.getByTestId('where').textContent;

/** Puts the demo clock, the lock and the live events back to the start of the night. */
export function resetCounterState(at = NIGHT) {
  clock.setStart(at);
  useLockStore.setState({ locked: false });
  window.sessionStorage.clear();
  eventBus.clear();
}

/**
 * Finds the element that has exactly this text, even when it is split over several nodes (a time inside
 * `<bdi>`). Use it with `getByText(textIs('Open since 11:10 AM, Sat 3 Oct'))`.
 */
export const textIs = (text: string) => (_content: string, element: Element | null) =>
  element !== null &&
  element.textContent === text &&
  !Array.from(element.children).some((child) => child.textContent === text);
