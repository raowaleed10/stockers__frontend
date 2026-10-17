import { useTranslation } from 'react-i18next';
import { useLanguageStore, type Lang } from '@/lib/language';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';

/**
 * English or اردو in the owner portal. Two drawings, both from the designs: the segmented track in the walnut sidebar (36) and
 * the two pills on the phone's sign-in page (52, and the same pills in the "More" sheet). Each name is in its own language.
 */
export function OwnerLanguage({
  look,
  className,
}: {
  look: 'sidebar' | 'pills';
  className?: string;
}) {
  const { t } = useTranslation();
  const lang = useLanguageStore((state) => state.lang);
  const setLang = useLanguageStore((state) => state.setLang);
  const options: { value: Lang; label: string }[] = [
    { value: 'en', label: t('language.en') },
    { value: 'ur', label: t('language.ur') },
  ];

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className={cx(
        look === 'sidebar' ? 'flex rounded-[10px] bg-c-page p-[3px]' : 'flex gap-1.5 text-o-ink',
        className,
      )}
    >
      {options.map(({ value, label }) => {
        const on = lang === value;
        const urdu = value === 'ur';
        return (
          <button
            key={value}
            type="button"
            aria-pressed={on}
            lang={urdu ? 'ur' : undefined}
            onClick={() => setLang(value)}
            className={cx(
              'min-h-touch-owner transition-colors duration-150',
              focusRing.owner,
              look === 'sidebar'
                ? cx(
                    'flex-1 rounded-[8px] border-0',
                    on ? 'bg-c-raised-2 font-semibold text-c-text' : 'bg-transparent text-c-text-2',
                    urdu ? 'font-urdu text-[14px]' : 'text-[15px]',
                  )
                : cx(
                    'rounded-full bg-o-card px-4',
                    on ? 'border-2 border-o-ink font-bold' : 'border border-o-line',
                    urdu ? 'font-urdu text-[16px] leading-none' : 'text-[15px]',
                  ),
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
