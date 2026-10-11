import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useLanguage } from '@/lib/language';
import { createQueryClient } from '@/lib/query-client';
import { routerFuture } from '@/lib/router-future';
import { ErrorBoundary } from '@/ui/ErrorBoundary';
import { NotFound } from '@/ui/NotFound';
import { readAppBase } from './app-base';
import { OwnerRoutes } from './routes';

/** `basename` is the path the server serves this app at. Without it the app shows "Page not found". */
export function App({ basename = readAppBase() }: { basename?: string | null }) {
  useLanguage();
  const [queryClient] = useState(createQueryClient);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {basename === null ? (
          <NotFound />
        ) : (
          <BrowserRouter basename={basename} future={routerFuture}>
            <OwnerRoutes />
          </BrowserRouter>
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
