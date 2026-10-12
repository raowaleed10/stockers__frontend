import { chromium, type FullConfig } from '@playwright/test';

/**
 * Loads every development page once, before any test starts.
 *
 * The first request for a page makes the Vite dev server transform its whole module graph and, the first
 * time, optimise its dependencies. With four workers each asking for a different page at once, that cold
 * start is slow enough (11 s instead of 3 s for a plain test, over 30 s for an axe run) to run into a
 * test's time limit, and a test then fails for a reason that has nothing to do with what it checks. Once
 * the pages are warm every test sees the server as it is in normal use, so no test needs a longer limit or a retry.
 */
const PAGES = ['/dev/kit', '/dev/tiles', '/dev/data', '/owner-dev/dev/kit', '/owner-dev/dev/data'];

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects.find((project) => project.name === 'counter')?.use.baseURL;
  if (!baseURL) throw new Error('The counter project needs a baseURL to warm up the dev server.');

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const path of PAGES) {
      await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle', timeout: 180_000 });
      // The pages are lazy: wait for the page itself, not just the shell.
      await page.waitForSelector('main', { timeout: 180_000 });
    }
  } finally {
    await browser.close();
  }
}
