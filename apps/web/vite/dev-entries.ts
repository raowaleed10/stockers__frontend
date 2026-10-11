import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Plugin } from 'vite';

/** Dev only. In production the server injects the real private address. */
const OWNER_DEV_BASE = '/owner-dev/';

/**
 * True for a page request (not a Vite file, a module, an asset or an API call).
 * Like Vite's own fallback, a wildcard Accept header counts too, so curl and Playwright's
 * start-up check work.
 */
function isPageRequest(pathname: string, accept: string | undefined): boolean {
  if (!accept?.includes('text/html') && !accept?.includes('*/*')) return false;
  if (pathname.startsWith('/@') || pathname.startsWith('/__')) return false;
  if (pathname.startsWith('/src/') || pathname.startsWith('/node_modules/')) return false;
  if (pathname.startsWith('/api/')) return false;
  const lastSegment = pathname.split('/').pop() ?? '';
  return !lastSegment.includes('.');
}

/**
 * Serves the two apps from one dev server:
 *  - counter.html for every page address except the owner dev path (counter at `/`),
 *  - owner.html at `/owner-dev/`, with `<meta name="app-base">` injected the way the server will.
 */
export function devEntries(): Plugin {
  return {
    name: 'stockers-dev-entries',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();

        const url = req.url ?? '/';
        const queryStart = url.indexOf('?');
        const pathname = queryStart === -1 ? url : url.slice(0, queryStart);
        const search = queryStart === -1 ? '' : url.slice(queryStart);
        if (!isPageRequest(pathname, req.headers.accept)) return next();

        if (pathname === OWNER_DEV_BASE.slice(0, -1)) {
          res.statusCode = 302;
          res.setHeader('Location', OWNER_DEV_BASE + search);
          res.end();
          return;
        }

        if (pathname.startsWith(OWNER_DEV_BASE)) {
          try {
            const file = path.join(server.config.root, 'owner.html');
            const source = await readFile(file, 'utf-8');
            const withBase = source.replace(
              '<head>',
              `<head>\n    <meta name="app-base" content="${OWNER_DEV_BASE}" />`,
            );
            const html = await server.transformIndexHtml(url, withBase, req.originalUrl);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Cache-Control', 'no-cache');
            res.end(html);
          } catch (error) {
            next(error);
          }
          return;
        }

        req.url = `/counter.html${search}`;
        next();
      });
    },
  };
}
