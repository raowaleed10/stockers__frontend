import { QueryClient } from '@tanstack/react-query';
import { isApiError } from './api-client';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // The counter screen stays open all night; live events invalidate data, not window focus.
      // A 4xx answer (wrong PIN, signed out, not found) will not change on a second try, so it is not retried.
      queries: {
        retry: (failureCount, error) =>
          failureCount < 1 && !(isApiError(error) && error.status < 500),
        refetchOnWindowFocus: false,
      },
    },
  });
}
