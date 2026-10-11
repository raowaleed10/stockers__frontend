/**
 * The owner app's base path comes from `<meta name="app-base" content="/some-path/">`, which the
 * server injects when it serves the page. It is never written into the code.
 * Returns the path without a trailing slash ("/" for the root), or null when the tag is missing.
 */
export function readAppBase(doc: Document = document): string | null {
  const content = doc.querySelector('meta[name="app-base"]')?.getAttribute('content')?.trim();
  if (!content?.startsWith('/')) return null;
  return content.replace(/\/+$/, '') || '/';
}
