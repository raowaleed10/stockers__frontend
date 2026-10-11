export type ResourceLang = 'en' | 'ur';
export type Resources = Record<ResourceLang, Record<string, Record<string, unknown>>>;

/**
 * Turns the result of `import.meta.glob('./*\/*.json', { eager: true, import: 'default' })` into
 * i18next resources. `./en/board.json` becomes the `board` namespace of `en`.
 * Each locales folder calls this, so a new namespace is just a new file (docs/09_URDU_RTL.md).
 */
export function resourcesFromGlob(files: Record<string, unknown>): Resources {
  const resources: Resources = { en: {}, ur: {} };
  for (const [file, content] of Object.entries(files)) {
    const match = /\.\/(en|ur)\/([^/]+)\.json$/.exec(file);
    if (!match) continue;
    resources[match[1] as ResourceLang][match[2]] = content as Record<string, unknown>;
  }
  return resources;
}
