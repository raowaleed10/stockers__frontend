import { SNOOKER_TAB, type BoardTab } from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';

// The tabs the screens have words for. A category an owner adds later shows its own name.
const KNOWN = ['snooker', 'pool', 'foosball', 'carrom', 'ludo', 'playstation'] as const;
type KnownTab = (typeof KNOWN)[number];
const isKnown = (id: string): id is KnownTab => (KNOWN as readonly string[]).includes(id);

export interface CategoryTabsProps {
  tabs: readonly BoardTab[];
  /** The tab being looked at. None is selected on the games preview (screen 5). */
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * The game tabs of the live board (screens 3 to 6): 56 px pills with the number of tables in use. The selected one
 * has a 2 px brass border, a bold name and a brass count. In Urdu only the selected tab shows its count, as
 * screen 6 draws it.
 */
export function CategoryTabs({ tabs, selectedId, onSelect }: CategoryTabsProps) {
  const { t, i18n } = useTranslation('board');
  const urdu = i18n.language === 'ur';

  return (
    <nav
      aria-label={t('tabs.label')}
      className="flex gap-2.5 overflow-x-auto px-6 pb-1.5 pt-3.5 rtl:pb-1 rtl:pt-3"
    >
      {tabs.map((tab) => {
        const selected = tab.id === selectedId;
        const name = isKnown(tab.id) ? t(`tabs.${tab.id}`) : tab.name;
        // "6 of 9 in use" on the snooker tab; "0 of 4" on the others.
        const count =
          tab.id === SNOOKER_TAB
            ? t('tabs.inUse', { inUse: tab.inUse, total: tab.total })
            : t('tabs.count', { inUse: tab.inUse, total: tab.total });
        const showCount = !urdu || selected;
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(tab.id)}
            className={cx(
              'flex min-h-touch items-center gap-2.5 whitespace-nowrap rounded-btn px-5 text-c-text',
              focusRing.counter,
              selected
                ? 'border-2 border-c-brass bg-c-raised'
                : 'border border-c-line bg-c-panel active:bg-c-raised-2',
            )}
          >
            <span
              className={cx(
                'text-[18px] rtl:text-[17px]',
                selected ? 'font-bold' : 'font-semibold rtl:font-normal',
              )}
            >
              {name}
            </span>
            {showCount ? (
              <span
                className={cx(
                  'text-[15px] rtl:text-[14px]',
                  selected ? 'font-semibold text-c-brass' : 'text-c-text-2',
                )}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
