import { resourcesFromGlob } from '@/lib/i18n-resources';

/** Counter-only words: one JSON file per namespace in `en/` and `ur/`. Owner words never go here. */
export const counterResources = resourcesFromGlob(
  import.meta.glob('./*/*.json', { eager: true, import: 'default' }),
);
