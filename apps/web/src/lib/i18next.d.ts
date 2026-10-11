import type en from '@/locales/en.json';

// Makes t('...') check its keys against en.json.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: typeof en;
  }
}
