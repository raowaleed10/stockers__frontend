import i18n, { registerResources } from '@/lib/i18n';
import { resourcesFromGlob } from '@/lib/i18n-resources';

// The gallery's own words (namespace `tiles`). Only the lazy gallery page imports this file, so it is in no production bundle.
registerResources(
  resourcesFromGlob(import.meta.glob('../locales/*/*.json', { eager: true, import: 'default' })),
);

export { i18n };
