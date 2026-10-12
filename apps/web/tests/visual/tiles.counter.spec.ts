import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SCREEN_16, SCREEN_3, SCREEN_4, SCREEN_5 } from '../../src/dev/tiles/samples-screens';

/**
 * The tile-crop test (P02). Each tile on `/dev/tiles` is compared with the same tile cut out of the approved
 * PNG in `design/screens`. The PNGs were made from `design/html`, so the HTML tells us where each tile is.
 * The full-screen visual tests come in P05; this one proves the tiles themselves.
 *
 * For every tile it saves `test-results/tiles/<id>.png`: ours on the left, the design in the middle and the
 * difference (red) on the right, so a person can open it and see what is wrong.
 */

// How much of a tile may differ. Text edges, font hinting and gradients never match to the pixel, so the
// budget follows docs/10 §3 ("same layout and look"): at most 6 % of the pixels, counting a pixel only when
// a colour channel is more than 48 (of 255) away.
const BUDGET = 0.06;
const CHANNEL = 48;
// Room around a tile for its status ring and glow.
const MARGIN = 14;

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const OUT = path.resolve('test-results/tiles');

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const SCREENS = [
  { section: 's03', file: '03-live-board', height: 952, samples: SCREEN_3 },
  { section: 's04', file: '04-pool-tables-before-a-price-is-set', height: 900, samples: SCREEN_4 },
  {
    section: 's05',
    file: '05-pool-carrom-foosball-ludo-and-playstation',
    height: 1901,
    samples: SCREEN_5,
  },
  { section: 's16', file: '16-power-cut', height: 966, samples: SCREEN_16 },
];

/** Where each tile is on the approved screen, found by its name in the design HTML. */
async function designRects(page: Page, file: string): Promise<Record<string, Rect>> {
  await page.goto(pathToFileURL(path.join(REPO, 'design/html', `${file}.html`)).href);
  await page.evaluate(() => document.fonts.ready);
  return page.$$eval('.t[aria-label]', (elements) =>
    Object.fromEntries(
      elements.map((element) => {
        const box = element.getBoundingClientRect();
        return [
          element.getAttribute('aria-label'),
          { x: box.x, y: box.y + window.scrollY, width: box.width, height: box.height },
        ];
      }),
    ),
  );
}

/** Compares two PNGs in a browser page (no image library needed) and builds the side-by-side picture. */
async function compare(page: Page, ours: Buffer, design: Buffer, crop: Rect) {
  return page.evaluate(
    async ({ oursData, designData, crop, margin, channel }) => {
      const load = (data: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = `data:image/png;base64,${data}`;
        });
      const [mine, theirs] = await Promise.all([load(oursData), load(designData)]);
      const width = Math.round(crop.width + margin * 2);
      const height = Math.round(crop.height + margin * 2);
      const draw = (image: HTMLImageElement, sx: number, sy: number) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true })!;
        context.drawImage(image, sx, sy, width, height, 0, 0, width, height);
        return { canvas, data: context.getImageData(0, 0, width, height) };
      };
      const a = draw(mine, 0, 0);
      const b = draw(theirs, Math.round(crop.x - margin), Math.round(crop.y - margin));
      const diff = document.createElement('canvas');
      diff.width = width;
      diff.height = height;
      const diffContext = diff.getContext('2d')!;
      const diffData = diffContext.createImageData(width, height);
      let differing = 0;
      for (let i = 0; i < a.data.data.length; i += 4) {
        const gap = Math.max(
          Math.abs(a.data.data[i] - b.data.data[i]),
          Math.abs(a.data.data[i + 1] - b.data.data[i + 1]),
          Math.abs(a.data.data[i + 2] - b.data.data[i + 2]),
        );
        const bad = gap > channel;
        if (bad) differing++;
        diffData.data[i] = bad ? 255 : 30;
        diffData.data[i + 1] = bad ? 40 : 30;
        diffData.data[i + 2] = bad ? 40 : 30;
        diffData.data[i + 3] = 255;
      }
      diffContext.putImageData(diffData, 0, 0);
      const sheet = document.createElement('canvas');
      sheet.width = width * 3 + 20;
      sheet.height = height;
      const sheetContext = sheet.getContext('2d')!;
      sheetContext.fillStyle = '#000';
      sheetContext.fillRect(0, 0, sheet.width, sheet.height);
      sheetContext.drawImage(a.canvas, 0, 0);
      sheetContext.drawImage(b.canvas, width + 10, 0);
      sheetContext.drawImage(diff, (width + 10) * 2, 0);
      return {
        ratio: differing / (width * height),
        picture: sheet.toDataURL('image/png').replace(/^data:image\/png;base64,/, ''),
      };
    },
    {
      oursData: ours.toString('base64'),
      designData: design.toString('base64'),
      crop,
      margin: MARGIN,
      channel: CHANNEL,
    },
  );
}

for (const screen of SCREENS) {
  test.describe(`tiles of screen ${screen.file.slice(0, 2)} against its PNG`, () => {
    // One page of the gallery and one of the design for all the tiles of a screen (per worker): they are slow to open.
    let gallery: Page;
    let scratch: Page;
    let rects: Record<string, Rect>;
    let png: Buffer;

    test.beforeAll(async ({ browser }) => {
      const designPage = await browser.newPage({
        viewport: { width: 1440, height: screen.height },
      });
      rects = await designRects(designPage, screen.file);
      await designPage.close();
      png = readFileSync(path.join(REPO, 'design/screens', `${screen.file}.png`));
      gallery = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await gallery.goto('/dev/tiles');
      await gallery.waitForSelector(`[data-section="${screen.section}"]`);
      await gallery.evaluate(() => document.fonts.ready);
      scratch = await browser.newPage();
      mkdirSync(OUT, { recursive: true });
    });

    test.afterAll(async () => {
      await gallery.close();
      await scratch.close();
    });

    for (const sample of screen.samples) {
      test(`${sample.id}: ${sample.ariaLabel}`, async () => {
        const wanted = rects[sample.ariaLabel];
        expect(wanted, `the design has no tile named "${sample.ariaLabel}"`).toBeDefined();
        const tile = gallery.locator(
          `[data-section="${screen.section}"] [aria-label="${sample.ariaLabel}"]`,
        );
        await tile.scrollIntoViewIfNeeded();
        const box = (await tile.boundingBox())!;
        // The tile must be the size the design draws (a pixel or two for rounding).
        expect(Math.abs(box.width - wanted.width), 'width').toBeLessThanOrEqual(2);
        expect(Math.abs(box.height - wanted.height), 'height').toBeLessThanOrEqual(2);
        const page = await tile.page().screenshot({
          fullPage: true,
          clip: {
            x: box.x - MARGIN,
            y: box.y + (await gallery.evaluate(() => window.scrollY)) - MARGIN,
            width: wanted.width + MARGIN * 2,
            height: wanted.height + MARGIN * 2,
          },
        });
        const { ratio, picture } = await compare(scratch, page, png, wanted);
        writeFileSync(path.join(OUT, `${sample.id}.png`), Buffer.from(picture, 'base64'));
        writeFileSync(
          path.join(OUT, `${sample.id}.txt`),
          `${(ratio * 100).toFixed(2)} % ${sample.ariaLabel}
`,
        );
        expect(
          ratio,
          `${(ratio * 100).toFixed(1)} % of the pixels differ (see test-results/tiles)`,
        ).toBeLessThanOrEqual(BUDGET);
      });
    }
  });
}
