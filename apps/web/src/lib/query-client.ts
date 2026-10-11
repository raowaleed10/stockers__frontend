import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // The counter screen stays open all night; live events invalidate data, not window focus.
      queries: { retry: 1, refetchOnWindowFocus: false },
    },
  });
}
