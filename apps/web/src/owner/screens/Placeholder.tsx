import { useTranslation } from 'react-i18next';

/** Placeholder until the owner screens are built (P11 onward). */
export function Placeholder() {
  const { t } = useTranslation();
  return (
    <main data-app="owner" className="flex min-h-screen items-center justify-center p-6">
      <h1 className="text-o-h1 font-semibold">{t('brand')}</h1>
    </main>
  );
}
