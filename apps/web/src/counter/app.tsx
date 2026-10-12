import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useLanguage } from '@/lib/language';
import { createQueryClient } from '@/lib/query-client';
import { routerFuture } from '@/lib/router-future';
import { ErrorBoundary } from '@/ui/ErrorBoundary';
import { CounterLiveEvents } from './api';
import { CounterRoutes } from './routes';

export function App() {
  useLanguage();
  const [queryClient] = useState(createQueryClient);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CounterLiveEvents />
        <BrowserRouter future={routerFuture}>
          <CounterRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
