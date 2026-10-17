import { useTranslation } from 'react-i18next';
import type { NavId } from './nav';

/**
 * The name of an owner page (the sidebar, the More sheet, a page's title). "Games and prices" is also a name the counter
 * writes inside a sentence, so it lives in `common`: an owner word may not be repeated in the owner's own files, or the
 * bundle check finds it in the counter (docs/09).
 */
export function useNavLabel(): (id: NavId | 'alerts') => string {
  const { t } = useTranslation('shell');
  const { t: tc } = useTranslation();
  return (id) => (id === 'prices' ? tc('pages.prices') : t(`nav.${id}`));
}
