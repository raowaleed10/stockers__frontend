import { useTranslation } from 'react-i18next';
import { cx } from '@/ui/cx';

/** The brand ball and "Stockers". Each screen draws it at its own size (1 and 2: ivory ball, 3: top bar, 34: lock). */
const LOOK = {
  signIn: {
    row: 'gap-3.5',
    ball: 'h-[44px] w-[44px] bg-c-text shadow-ball-ivory',
    word: 'text-[38px] tracking-[0.5px]',
  },
  top: {
    row: 'gap-3',
    ball: 'h-[34px] w-[34px] bg-c-felt shadow-ball-sm',
    word: 'text-[30px] tracking-[0.5px]',
  },
  lock: {
    row: 'gap-3.5',
    ball: 'h-10 w-10 bg-c-felt shadow-ball-md',
    word: 'text-[34px]',
  },
} as const;

export function Brand({ look, className }: { look: keyof typeof LOOK; className?: string }) {
  const { t } = useTranslation();
  const size = LOOK[look];
  return (
    <div className={cx('flex items-center', size.row, className)}>
      <span aria-hidden="true" className={cx('inline-block rounded-full', size.ball)} />
      <span className={cx('font-num font-bold', size.word)}>{t('brand')}</span>
    </div>
  );
}
