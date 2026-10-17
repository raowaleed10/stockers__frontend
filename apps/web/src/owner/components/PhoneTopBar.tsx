import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';
import { ALERTS_PATH } from '../nav';
import { OwnerBrand } from './OwnerBrand';

/** The phone's top bar (screen 53): the brand, and the bell with the owners' unread count in a red badge. */
export function PhoneTopBar({ unread }: { unread: number }) {
  const { t } = useTranslation('shell');
  const { t: tc } = useTranslation();
  return (
    <header className="flex items-center justify-between gap-2.5 px-4 pb-1.5 pt-2.5">
      <OwnerBrand look="phoneBar" />
      <Link
        to={ALERTS_PATH}
        aria-label={unread > 0 ? t('bell', { count: unread }) : tc('notifications')}
        className={cx(
          'relative flex h-12 w-12 items-center justify-center rounded-[12px] text-o-ink',
          focusRing.owner,
        )}
      >
        <Bell aria-hidden="true" size={26} strokeWidth={2} />
        {unread > 0 ? (
          <span
            aria-hidden="true"
            className="absolute end-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-[9px] bg-o-red px-[5px] text-[12px] font-bold text-white"
          >
            {unread}
          </span>
        ) : null}
      </Link>
    </header>
  );
}
