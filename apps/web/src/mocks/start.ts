import type { RequestHandler } from 'msw';

/** Starts the mock API in the browser. Each app passes only its own handlers. */
export async function startMocks(handlers: RequestHandler[]): Promise<void> {
  const { setupWorker } = await import('msw/browser');
  await setupWorker(...handlers).start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });
}
