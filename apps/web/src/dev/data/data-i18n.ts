import i18n, { registerResources } from '@/lib/i18n';
import { resourcesFromGlob } from '@/lib/i18n-resources';

// The data check page's own words (namespace `data`). Only the lazy page imports this file, so it is in no production bundle.
registerResources(
  resourcesFromGlob(import.meta.glob('../locales/*/data.json', { eager: true, import: 'default' })),
);

export { i18n };
