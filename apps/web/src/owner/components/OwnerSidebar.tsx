import type { Owner } from '@stockers/shared';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';
import { SIDEBAR_ITEMS } from '../nav';
import { useNavLabel } from '../use-nav-label';
import { OwnerBrand } from './OwnerBrand';
import { OwnerLanguage } from './OwnerLanguage';

/**
 * The walnut sidebar of the owner portal on a wide screen (screen 36): the brand, the 11 pages (the open one on a lighter
 * block and bold), and at the bottom who is signed in and the language. The Activity badge is the owners' unread count.
 * Sign out is a small icon button beside the name: no approved screen draws one (`docs/NO_DESIGN.md`).
 */
export function OwnerSidebar({
  owner,
  unread,
  onSignOut,
}: {
  owner: Owner;
  unread: number;
  onSignOut: () => void;
}) {
  const { t } = useTranslation('shell');
  const label = useNavLabel();
  return (
    <nav
      aria-label={t('menu')}
      className="box-border flex w-[240px] shrink-0 flex-col gap-1 self-stretch bg-o-sidebar px-3.5 py-[22px] text-c-text"
    >
      <OwnerBrand look="sidebar" className="px-2.5 pb-[18px]" />
      {SIDEBAR_ITEMS.map((item) => (
        <NavLink
          key={item.id}
          to={item.path}
          end={item.end}
          className={({ isActive }) =>
            cx(
              'flex min-h-[48px] items-center justify-between gap-3 rounded-[12px] px-3.5 text-[17px] no-underline transition-colors duration-150',
              isActive
                ? 'bg-o-sidebar-active font-bold text-c-text'
                : 'text-o-sidebar-text hover:bg-o-sidebar-active/50',
              focusRing.owner,
            )
          }
        >
          {label(item.id)}
          {item.id === 'activity' && unread > 0 ? (
            <>
              {/* A space for a screen reader ("Activity 4 new"); the layout is flex, so it draws nothing. */}{' '}
              <span
                aria-label={t('unread', { count: unread })}
                className="flex h-6 min-w-[24px] items-center justify-center rounded-[12px] bg-c-brass px-1 text-[14px] font-bold text-c-brass-ink"
              >
                {unread}
              </span>
            </>
          ) : null}
        </NavLink>
      ))}
      <div className="min-h-6 flex-1" />
      <div className="flex flex-col gap-2.5 rounded-[14px] bg-c-raised p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[17px] font-bold">{owner.name}</span>
            <span className="text-[14px] text-c-text-2">{t('owner')}</span>
          </span>
          <button
            type="button"
            aria-label={t('signOut')}
            title={t('signOut')}
            onClick={onSignOut}
            className={cx(
              '-me-1.5 flex h-touch-owner w-touch-owner shrink-0 items-center justify-center rounded-[10px] text-c-text-2 transition-colors duration-150 hover:bg-c-raised-2',
              focusRing.owner,
            )}
          >
            <LogOut aria-hidden="true" size={20} strokeWidth={2} />
          </button>
        </div>
        <OwnerLanguage look="sidebar" />
      </div>
    </nav>
  );
}
