// Serves the built owner app (apps/web/dist/owner) the way the real server will, under a fake
// secret address. The backend copies these rules: docs/08_AUTH_AND_ACCESS.md, section 1.
//
//   npm run build:owner -w apps/web   then   npm run preview:owner      (PORT=4173 by default)
//
// 1. Every address under /<secret>/ that is not a file in dist/owner/assets/ returns owner.html with
//    <base href="/<secret>/"> and <meta name="app-base" content="/<secret>/"> injected into <head>.
// 2. Files under /<secret>/assets/ come from dist/owner/assets/ (a missing one is a 404).
// 3. Every other address shows "Page not found".
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// A fake address. The real one is random, lives on the server only, and is never in a bundle.
const SECRET = 'owner-preview-x7';
const PORT = Number(process.env.PORT ?? 4173);

if (!/^[a-z0-9-]+$/.test(SECRET)) throw new Error('The secret may only use a-z, 0-9 and "-".');

const PREFIX = `/${SECRET}/`;
const DIST = path.resolve(fileURLToPath(new URL('../apps/web/dist/owner', import.meta.url)));
const ASSETS = path.join(DIST, 'assets');

const TYPES = {
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const NOT_FOUND_PAGE =
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Page not found</title></head>' +
  '<body><h1>Page not found</h1></body></html>';

function send(req, res, status, headers, body) {
  const payload = Buffer.from(body);
  res.writeHead(status, {
    'Content-Length': payload.length,
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(req.method === 'HEAD' ? undefined : payload);
}

function notFound(req, res) {
  send(
    req,
    res,
    404,
    { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    NOT_FOUND_PAGE,
  );
}

async function sendAsset(req, res, name) {
  // Resolve, then check the result is still inside assets/ ("..%2f" tricks end up here).
  const file = path.resolve(ASSETS, name);
  if (!file.startsWith(ASSETS + path.sep)) return notFound(req, res);

  let body;
  try {
    body = await readFile(file);
  } catch {
    return notFound(req, res); // missing file (or a folder): 404, never the app page
  }
  send(
    req,
    res,
    200,
    {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
      // File names carry a hash, so a changed file always has a new name.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
    body,
  );
}

async function sendApp(req, res) {
  // Read on every request so a new build shows up without restarting the server.
  const source = await readFile(path.join(DIST, 'owner.html'), 'utf-8');
  const html = source.replace(
    /<head[^>]*>/i,
    (head) =>
      `${head}\n    <base href="${PREFIX}" />\n    <meta name="app-base" content="${PREFIX}" />`,
  );
  if (html === source) throw new Error('owner.html has no <head> to inject into.');
  send(
    req,
    res,
    200,
    { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' },
    html,
  );
}

async function handle(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(req, res, 405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain' }, 'Not allowed');
  }

  const url = new URL(req.url ?? '/', 'http://localhost');

  if (url.pathname === `/${SECRET}`) {
    res.writeHead(302, { Location: PREFIX + url.search });
    return res.end();
  }
  if (!url.pathname.startsWith(PREFIX)) return notFound(req, res);

  const rest = url.pathname.slice(PREFIX.length);
  if (rest.startsWith('assets/')) {
    let name;
    try {
      name = decodeURIComponent(rest.slice('assets/'.length));
    } catch {
      return notFound(req, res); // a broken %-escape
    }
    return sendAsset(req, res, name);
  }
  return sendApp(req, res);
}

try {
  await readFile(path.join(DIST, 'owner.html'));
} catch {
  console.error(`Cannot read ${path.join(DIST, 'owner.html')}. Run "npm run build:owner" first.`);
  process.exit(1);
}

const server = createServer((req, res) => {
  handle(req, res).catch((error) => {
    console.error(error);
    if (!res.headersSent) send(req, res, 500, { 'Content-Type': 'text/plain' }, 'Server error');
    else res.destroy();
  });
});

server.on('error', (error) => {
  console.error(
    error.code === 'EADDRINUSE' ? `Port ${PORT} is already in use. Set PORT=…` : error.message,
  );
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Owner preview: http://localhost:${PORT}${PREFIX}  (serving ${DIST})`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
