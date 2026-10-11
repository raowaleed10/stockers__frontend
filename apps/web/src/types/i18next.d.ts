import type kit from '@/dev/locales/en/kit.json';
import type common from '@/locales/en/common.json';

// Makes t('...') check its keys against the English files. Type-only, so nothing here reaches a bundle.
// Adding a namespace file in counter/locales or owner/locales? Add one `import type` line for it
// above and one entry below (see docs/09_URDU_RTL.md). Namespace names are unique across both apps.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      kit: typeof kit; // dev-only: the /dev/kit page
    };
  }
}
