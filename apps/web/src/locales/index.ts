import { resourcesFromGlob } from '@/lib/i18n-resources';

/** Words both apps use. Counter-only and owner-only words live in each app's own `locales`. */
export const commonResources = resourcesFromGlob(
  import.meta.glob('./*/common.json', { eager: true, import: 'default' }),
);
