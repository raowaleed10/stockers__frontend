import { useTranslation } from 'react-i18next';
import { cx } from '@/ui/cx';

/** The brand ball and "Stockers" as each owner screen draws it: the sidebar (36), the phone bar (53), and the two sign-in pages. */
const LOOK = {
  sidebar: { row: 'gap-2.5', ball: 'h-[30px] w-[30px] shadow-ball-xs', word: 'text-[28px]' },
  phoneBar: { row: 'gap-2', ball: 'h-[26px] w-[26px] shadow-ball-xs', word: 'text-[26px]' },
  panel: { row: 'gap-3', ball: 'h-10 w-10 shadow-ball-md', word: 'text-[36px]' },
  phoneSignIn: { row: 'gap-2.5', ball: 'h-10 w-10 shadow-ball-md', word: 'text-[42px]' },
} as const;

export function OwnerBrand({ look, className }: { look: keyof typeof LOOK; className?: string }) {
  const { t } = useTranslation();
  const size = LOOK[look];
  return (
    <div className={cx('flex items-center', size.row, className)}>
      <span aria-hidden="true" className={cx('inline-block rounded-full bg-o-green', size.ball)} />
      <span className={cx('font-num font-bold', size.word)}>{t('brand')}</span>
    </div>
  );
}
