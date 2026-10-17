import type { NavId } from '../nav';
import { useNavLabel } from '../use-nav-label';

/**
 * A page that is not built yet: the owner frame around its title, so every route of `docs/03` can be opened from the sidebar
 * and the phone tabs. Each later step replaces one of these with the real screen.
 */
export function OwnerPage({ id }: { id: NavId | 'alerts' }) {
  const label = useNavLabel();
  return <h1 className="m-0 text-o-h1 font-bold">{label(id)}</h1>;
}
