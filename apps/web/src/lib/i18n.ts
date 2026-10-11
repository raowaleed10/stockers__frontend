import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en.json';
import ur from '@/locales/ur.json';

// Resources are bundled, so init is synchronous and nothing waits on the network.
void i18n.use(initReactI18next).init({
  resources: { en, ur },
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common'],
  initAsync: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
