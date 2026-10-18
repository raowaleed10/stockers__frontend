import { PHONE_QUERY, useMediaQuery } from '@/ui/use-media';
import { useDashboard } from '../../api';
import { QueryPage } from '../../components/QueryPage';
import { Dashboard } from './Dashboard';
import { PhoneHome } from './PhoneHome';

/** `/`: the dashboard (screen 36) on a computer and the home (screen 53) on a phone, both from `GET /dashboard`. */
export function HomePage() {
  const phone = useMediaQuery(PHONE_QUERY);
  const dashboard = useDashboard();
  return (
    <QueryPage query={dashboard}>
      {(data) => (phone ? <PhoneHome data={data} /> : <Dashboard data={data} />)}
    </QueryPage>
  );
}
