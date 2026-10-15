import { useLocation } from 'react-router-dom';

/** Shows where the router is, so a test can say "it went to /sign-in". */
export function Where() {
  const { pathname, search } = useLocation();
  return <output data-testid="where">{pathname + search}</output>;
}
