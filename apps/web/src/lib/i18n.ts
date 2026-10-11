import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { commonResources } from '@/locales';
import type { Resources } from './i18n-resources';

// Resources are bundled, so init is synchronous and nothing waits on the network.
// Only `common` is loaded here. Each app entry adds its own words with registerResources().
void i18n.use(initReactI18next).init({
  resources: commonResources,
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common'],
  initAsync: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

/** Adds an app's own namespaces. Call once per entry, before the first render. */
export function registerResources(resources: Resources): void {
  for (const lang of ['en', 'ur'] as const) {
    for (const [namespace, content] of Object.entries(resources[lang])) {
      i18n.addResourceBundle(lang, namespace, content, true, true);
    }
  }
}

export default i18n;
