import type { Owner } from '@stockers/shared';
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { cx } from '@/ui/cx';
import { PHONE_QUERY, useMediaQuery } from '@/ui/use-media';
import { useNotifications, useSignOut } from '../api';
import { MoreSheet } from './MoreSheet';
import { OwnerSidebar } from './OwnerSidebar';
import { PhoneTabBar } from './PhoneTabBar';
import { PhoneTopBar } from './PhoneTopBar';

/**
 * The frame of every signed-in owner page (docs/03): the walnut sidebar on a wide screen (screen 36), and under 768 px
 * the phone's top bar and bottom tabs with the "More" sheet (screen 53). The page goes in `main`, which keeps the
 * padding of its design: 26/30 on a computer, 6/16 on a phone. Signing out goes back to `/sign-in` at the same base path.
 */
export function OwnerFrame({ owner }: { owner: Owner }) {
  const phone = useMediaQuery(PHONE_QUERY);
  const navigate = useNavigate();
  const notifications = useNotifications();
  const signOut = useSignOut();
  const [moreOpen, setMoreOpen] = useState(false);
  const unread = notifications.data?.unread ?? 0;

  const leave = () => {
    setMoreOpen(false);
    signOut.mutate(undefined, { onSettled: () => navigate('/sign-in', { replace: true }) });
  };

  return (
    <div
      data-app="owner"
      className={cx(
        'screen-text min-h-screen bg-o-page font-body text-o-ink',
        phone ? 'flex flex-col' : 'flex',
      )}
    >
      {phone ? null : <OwnerSidebar owner={owner} unread={unread} onSignOut={leave} />}
      {phone ? <PhoneTopBar unread={unread} /> : null}
      <main
        className={cx(
          'flex min-w-0 flex-1 flex-col',
          phone ? 'gap-3.5 px-4 pb-[22px] pt-1.5' : 'gap-5 px-[30px] pb-[34px] pt-[26px]',
        )}
      >
        <Outlet />
      </main>
      {phone ? <PhoneTabBar moreOpen={moreOpen} onMore={() => setMoreOpen(true)} /> : null}
      {phone && moreOpen ? (
        <MoreSheet onClose={() => setMoreOpen(false)} onSignOut={leave} />
      ) : null}
    </div>
  );
}
