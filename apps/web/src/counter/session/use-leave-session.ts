import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSignOut } from '../api';
import { counterKeys } from '../api/keys';
import { useLockStore } from './lock-store';

/**
 * "Switch worker": signs the worker out and goes to the sign-in page. Games keep running and stay recorded
 * under him. The page leaves even if the call fails, because the sign-in page is where a worker can
 * start again.
 */
export function useSwitchWorker() {
  const signOut = useSignOut();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const unlock = useLockStore((state) => state.unlock);

  return async () => {
    try {
      await signOut.mutateAsync();
    } catch {
      // Nothing to do: the next sign-in starts a new session.
    }
    unlock();
    queryClient.removeQueries({ queryKey: counterKeys.me });
    navigate('/sign-in', { replace: true });
  };
}
