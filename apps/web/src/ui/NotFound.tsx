import { useTranslation } from 'react-i18next';

/** Plain page for any address that does not exist. The same in every app; it says nothing else. */
export function NotFound() {
  const { t } = useTranslation();
  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-center">
      <h1 className="text-c-title font-semibold">{t('notFound')}</h1>
    </main>
  );
}
