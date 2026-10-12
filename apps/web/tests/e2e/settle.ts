import type { Page } from '@playwright/test';

/**
 * Waits until the page is quiet, so a measurement or an axe run sees the layout the user will see.
 *
 * `document.fonts.ready` alone is not enough: it can resolve before text that has just been drawn has
 * asked for its font, and an element measured with a transform or in the middle of a layout change gives
 * a different size from the finished one. So this waits for, in turn:
 * - the network to be idle (the lazy page chunk, the fonts, the mock server's script);
 * - every font face to be loaded, looking again a frame later because drawing text can start a download;
 * - every animation and transition to finish (a dialog scales in for 150 ms);
 * - the size of the page and the number of elements to stay the same for several frames in a row.
 */
export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    for (let round = 0; round < 40; round += 1) {
      await document.fonts.ready;
      await frame();
      if (![...document.fonts].some((face) => face.status === 'loading')) break;
    }

    await Promise.all(
      document.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
    );

    let last = '';
    let still = 0;
    for (let round = 0; round < 200 && still < 5; round += 1) {
      await frame();
      const now = [
        document.documentElement.scrollWidth,
        document.documentElement.scrollHeight,
        document.querySelectorAll('*').length,
        document.getAnimations().length,
        [...document.fonts].filter((face) => face.status === 'loading').length,
      ].join(':');
      still = now === last ? still + 1 : 0;
      last = now;
    }
  });
}
