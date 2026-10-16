import { useLocation, useNavigate } from 'react-router-dom';
import { boardOfTableScreen } from '../components/table-paths';
import { useStartDraft } from './draft';

/** Closes a table screen: the draft of the game being started is dropped, and the board it opened over comes back. */
export function useCloseTable() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const reset = useStartDraft((state) => state.reset);
  return () => {
    reset();
    navigate(boardOfTableScreen(pathname));
  };
}
