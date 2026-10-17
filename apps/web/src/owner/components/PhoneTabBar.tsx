import { Folder, House, LayoutGrid, Menu, Users, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';
import { isOpen, MORE_ITEMS, PHONE_TABS } from '../nav';

const ICONS: Record<(typeof PHONE_TABS)[number]['tab'], LucideIcon> = {
  home: House,
  live: LayoutGrid,
  sheets: Folder,
  players: Users,
};

const TAB =
  'flex min-h-[60px] flex-1 flex-col items-center justify-center gap-[3px] bg-transparent text-[13px] no-underline';

/**
 * The phone's bottom tabs (screen 53): Home, Live, Sheets, Players and More, 60 px tall, the open one green and bold.
 * More opens a sheet with the other pages; while one of those is open, More is the open tab.
 */
export function PhoneTabBar({ onMore, moreOpen }: { onMore: () => void; moreOpen: boolean }) {
  const { t } = useTranslation('shell');
  const { pathname } = useLocation();
  const onMorePage = MORE_ITEMS.some((item) => isOpen(item, pathname));

  return (
    <nav
      aria-label={t('tabs.label')}
      className="sticky bottom-0 z-30 mt-auto flex border-t border-o-line bg-o-card px-1.5 pb-3.5 pt-1"
    >
      {PHONE_TABS.map((item) => {
        const Icon = ICONS[item.tab];
        return (
          <NavLink
            key={item.id}
            to={item.path}
            end={'end' in item ? item.end : undefined}
            className={({ isActive }) =>
              cx(
                TAB,
                focusRing.owner,
                isActive ? 'font-bold text-o-green' : 'font-medium text-o-ink-3',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon aria-hidden="true" size={24} strokeWidth={isActive ? 2.2 : 1.8} />
                {t(`tabs.${item.tab}`)}
              </>
            )}
          </NavLink>
        );
      })}
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
        aria-current={onMorePage ? 'page' : undefined}
        onClick={onMore}
        className={cx(
          TAB,
          focusRing.owner,
          onMorePage ? 'font-bold text-o-green' : 'font-medium text-o-ink-3',
        )}
      >
        <Menu aria-hidden="true" size={24} strokeWidth={onMorePage ? 2.2 : 1.8} />
        {t('tabs.more')}
      </button>
    </nav>
  );
}
