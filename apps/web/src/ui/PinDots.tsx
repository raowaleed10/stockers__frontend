import { useTranslation } from 'react-i18next';
import { cx } from './cx';

export interface PinDotsProps {
  /** How many digits are typed so far, 0 to 4. */
  filled: number;
  /** Shake once (a wrong PIN). Give the component a new `key` to shake again; nothing moves under reduced motion. */
  shake?: boolean;
  className?: string;
}

const LENGTH = 4;

/** The four dots under "enter your PIN". The digits themselves are never shown. */
export function PinDots({ filled, shake = false, className }: PinDotsProps) {
  const { t } = useTranslation();
  const count = Math.min(LENGTH, Math.max(0, Math.round(filled)));
  return (
    <div
      role="img"
      aria-label={t('pin.progress', { filled: count })}
      className={cx('flex gap-[18px]', shake && 'pin-shake', className)}
    >
      {Array.from({ length: LENGTH }, (_, index) => (
        <span
          key={index}
          className={cx(
            'h-[22px] w-[22px] rounded-full',
            index < count ? 'bg-c-brass' : 'border-2 border-c-line-3',
          )}
        />
      ))}
    </div>
  );
}
