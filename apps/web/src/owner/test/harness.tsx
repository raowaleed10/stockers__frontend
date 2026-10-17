import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { clock } from '@/lib/clock';
import { eventBus } from '@/lib/events';
import i18n, { registerResources } from '@/lib/i18n';
import { useLanguage, useLanguageStore, type Lang } from '@/lib/language';
import { createQueryClient } from '@/lib/query-client';
import { routerFuture } from '@/lib/router-future';
import type { createTestApi } from '@/mocks/test-server';
import { OwnerLiveEvents } from '../api';
import { ownerResources } from '../locales';
import { OwnerRoutes } from '../routes';

registerResources(ownerResources);

/** 10:30 PM on the night of the owner designs (screens 35, 36, 52, 53). */
export const OWNER_NIGHT = Date.parse('2026-10-03T22:30:00+05:00');

/** Shows where the router is, so a test can say "it went to /sign-in". */
function Where() {
  const { pathname, search } = useLocation();
  return <output data-testid="where">{pathname + search}</output>;
}

/** Keeps i18next in step with the language store, as the app does (`useLanguage` in `App`). */
function Language() {
  useLanguage();
  return null;
}

/** The owner's routes with a fresh query client, the live events and a memory router. */
export function renderOwner(path: string) {
  const queryClient = createQueryClient();
  const view = render(
    <QueryClientProvider client={queryClient}>
      <OwnerLiveEvents />
      <Language />
      <MemoryRouter initialEntries={[path]} future={routerFuture}>
        <OwnerRoutes />
        <Where />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

/** The path the router is on now. */
export const wherePath = (view: ReturnType<typeof render>) => view.getByTestId('where').textContent;

export function setLanguage(lang: Lang) {
  useLanguageStore.setState({ lang });
  void i18n.changeLanguage(lang);
}

/** Makes `matchMedia` answer for a phone (390 px) or a computer, as the browser would. jsdom has none of its own. */
export function setPhone(phone: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query.includes('max-width: 767px') ? phone : false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      onchange: null,
      dispatchEvent: () => false,
    }),
  });
}

/** Puts the demo clock, the language, the screen size and the live events back to the start of the night. */
export function resetOwnerState(at = OWNER_NIGHT) {
  setLanguage('en');
  setPhone(false);
  clock.setStart(at);
  eventBus.clear();
}

/**
 * Starts the mock server for a test file (the owner is signed in as Aqil, as `?as=` would give) and draws a page once
 * before the first test, so the cold start (the mock server, i18next, the router) does not land on a test's own limit.
 */
export async function startOwnerTests(api: ReturnType<typeof createTestApi>) {
  api.server.listen({ onUnhandledRequest: 'error' });
  api.load({ app: 'owner' });
  api.setTime('2026-10-03T22:30:00+05:00');
  resetOwnerState();
  const view = renderOwner('/');
  await screen.findByRole('navigation', { name: 'Owner menu' }, { timeout: 20_000 });
  view.unmount();
}
