import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { eventBus } from '@/lib/events';
import i18n from '@/lib/i18n';
import { useLanguageStore, type Lang } from '@/lib/language';
import { clock } from '@/lib/clock';
import { registerResources } from '@/lib/i18n';
import { createQueryClient } from '@/lib/query-client';
import { routerFuture } from '@/lib/router-future';
import { NIGHT, type createTestApi } from '@/mocks/test-server';
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

/**
 * Starts the mock server for a test file and draws the signed-in page once before the first test. The first draw of a
 * file pays for everything that is cold (the first calls through the mock server, i18next, the router), and under a
 * full run that can take longer than the one second a `findBy` waits. Paying for it here keeps every test at the
 * normal limits, with no retries (the same reason as `tests/e2e/global-setup.ts`).
 */
export async function startCounterTests(api: ReturnType<typeof createTestApi>) {
  api.server.listen({ onUnhandledRequest: 'error' });
  api.load();
  resetCounterState();
  const view = renderCounter('/');
  await screen.findByRole('button', { name: /Signed in: Zain/ }, { timeout: 20_000 });
  await screen.findByRole('button', { name: 'Notifications, 3 new' }, { timeout: 20_000 });
  view.unmount();
}

/** Switches the page language the way the language switch does: the store and i18next together. */
export function setLanguage(lang: Lang) {
  useLanguageStore.setState({ lang });
  void i18n.changeLanguage(lang);
}

/** Puts the demo clock, the language, the lock and the live events back to the start of the night. */
export function resetCounterState(at = NIGHT) {
  setLanguage('en');
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
