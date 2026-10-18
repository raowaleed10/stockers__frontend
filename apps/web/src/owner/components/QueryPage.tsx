import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/ui/Button';

/**
 * What an owner page does while its data is on the way and when it cannot be had: nothing while it loads (so no empty frame
 * flashes), and a plain line with a button to try again if the server refuses. The page itself is the function of the data.
 */
export function QueryPage<T>({
  query,
  children,
}: {
  query: UseQueryResult<T>;
  children: (data: T) => ReactNode;
}) {
  const { t } = useTranslation();
  if (query.isPending) return null;
  if (query.isError || query.data === undefined) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 text-[16px] text-o-red">
        {t('error.title')}
        <Button theme="owner" onClick={() => void query.refetch()}>
          {t('retry')}
        </Button>
      </div>
    );
  }
  return <>{children(query.data)}</>;
}
