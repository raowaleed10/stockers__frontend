import { useTranslation } from 'react-i18next';

/** Placeholder until the counter screens are built (P04 onward). */
export function Placeholder() {
  const { t } = useTranslation();
  return (
    <main data-app="counter" className="flex min-h-screen items-center justify-center p-6">
      <h1 className="text-c-title font-semibold">{t('brand')}</h1>
    </main>
  );
}
