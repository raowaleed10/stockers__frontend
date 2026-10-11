import i18n, { registerResources } from '@/lib/i18n';
import { resourcesFromGlob } from '@/lib/i18n-resources';

// The kit's sample words (namespace `kit`). Only the lazy kit page imports this file, so it is in no production bundle.
registerResources(
  resourcesFromGlob(import.meta.glob('../locales/*/*.json', { eager: true, import: 'default' })),
);

export { i18n };
