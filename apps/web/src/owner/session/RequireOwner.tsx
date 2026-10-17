import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';
import { isApiError } from '@/lib/api-client';
import { Button } from '@/ui/Button';
import { useMe } from '../api';
import { OwnerFrame } from '../components/OwnerFrame';

/**
 * The route guard (docs/08 §2): every owner page except `/sign-in` needs an owner session. No session is a 401 from
 * `/auth/me` (or the plain 404 of a counter session) and goes to `/sign-in`, which keeps the page that was asked for so signing in can open it. While the answer is
 * on its way the page stays plain, so there is no flash of the frame.
 */
export function RequireOwner() {
  const { t } = useTranslation();
  const location = useLocation();
  const me = useMe();

  if (me.isPending) return <div data-app="owner" className="min-h-screen bg-o-page" />;

  if (me.isError) {
    // 401: nobody is signed in. 404: the answer a counter session gets from the owner API (docs/08 §1), so not an owner either.
    if (isApiError(me.error) && (me.error.status === 401 || me.error.status === 404)) {
      return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
    }
    return (
      <main
        data-app="owner"
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-o-page p-6 text-center text-o-ink"
      >
        <h1 className="text-o-h1 font-semibold">{t('error.title')}</h1>
        <Button theme="owner" onClick={() => void me.refetch()}>
          {t('error.reload')}
        </Button>
      </main>
    );
  }

  return <OwnerFrame owner={me.data.owner} />;
}
