import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import type { ApiError } from './api-client';

/**
 * A write to the API as a mutation, with the error typed as `ApiError` (`{code, message}`).
 * Live events refresh what a write changes; `invalidate` is for a write that has no event of its own.
 */
export function useAction<TVariables = void, TResult = unknown>(
  run: (variables: TVariables) => Promise<TResult>,
  invalidate: QueryKey[] = [],
) {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiError, TVariables>({
    mutationFn: run,
    onSuccess: () => {
      for (const queryKey of invalidate) void queryClient.invalidateQueries({ queryKey });
    },
  });
}
