import { LogOut } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { Button } from '@/ui/Button';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';
import { useDialog } from '@/ui/use-dialog';
import { MORE_ITEMS } from '../nav';
import { useNavLabel } from '../use-nav-label';
import { OwnerLanguage } from './OwnerLanguage';

/**
 * What the phone's "More" tab opens: a bottom sheet with the pages the tab bar does not have, then the language and sign
 * out. No approved screen draws it (`docs/NO_DESIGN.md`); it is built from the owner bottom sheet and the rows of screen 58.
 */
export function MoreSheet({ onClose, onSignOut }: { onClose: () => void; onSignOut: () => void }) {
  const { t } = useTranslation('shell');
  const label = useNavLabel();
  const titleId = useId();
  const ref = useDialog<HTMLElement>(onClose);

  return (
    <>
      <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-40 bg-o-ink/40" />
      <aside
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col gap-2 overflow-y-auto rounded-t-[22px] bg-o-card px-4 pb-5 pt-4 text-o-ink shadow-dialog-light outline-none"
      >
        <h2 id={titleId} className="m-0 text-[20px] font-bold leading-tight">
          {t('more.title')}
        </h2>
        <ul className="m-0 flex list-none flex-col p-0">
          {MORE_ITEMS.map((item) => (
            <li key={item.id} className="border-b border-o-divider last:border-b-0">
              <NavLink
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  cx(
                    'flex min-h-[52px] items-center rounded-[10px] text-[17px] no-underline',
                    isActive ? 'font-bold text-o-green' : 'font-medium text-o-ink',
                    focusRing.owner,
                  )
                }
              >
                {label(item.id)}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <OwnerLanguage look="pills" />
          <Button theme="owner" icon={<LogOut size={20} strokeWidth={2} />} onClick={onSignOut}>
            {t('signOut')}
          </Button>
        </div>
      </aside>
    </>
  );
}
