import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { isApiError } from '@/lib/api-client';
import { useMe } from '../api';
import { CounterFrame } from '../components/CounterFrame';

/**
 * The route guard (docs/08 §3): every counter screen except the sign-in page needs a worker session.
 * No session, or a worker whose time is over, is a 401 from `/auth/me` and goes to `/sign-in`. While the
 * answer is on its way the page stays plain dark, so there is no flash of the frame.
 */
export function RequireWorker() {
  const { t } = useTranslation();
  const me = useMe();

  if (me.isPending) return <div data-app="counter" className="min-h-screen bg-c-page" />;

  if (me.isError) {
    if (isApiError(me.error) && me.error.status === 401) return <Navigate to="/sign-in" replace />;
    return (
      <main
        data-app="counter"
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-c-page p-6 text-center text-c-text"
      >
        <h1 className="text-c-title font-semibold">{t('error.title')}</h1>
        <button
          type="button"
          onClick={() => void me.refetch()}
          className="min-h-touch rounded-btn border border-c-line-3 px-5 text-[18px] font-semibold focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-c-text"
        >
          {t('error.reload')}
        </button>
      </main>
    );
  }

  return <CounterFrame session={me.data} />;
}
