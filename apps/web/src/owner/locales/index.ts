import { resourcesFromGlob } from '@/lib/i18n-resources';

/** Owner-only words: one JSON file per namespace in `en/` and `ur/`. Only the owner entry loads them. */
export const ownerResources = resourcesFromGlob(
  import.meta.glob('./*/*.json', { eager: true, import: 'default' }),
);
