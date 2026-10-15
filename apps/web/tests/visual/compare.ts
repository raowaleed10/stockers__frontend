import type { Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Compares a screenshot of our page with the approved PNG, in a browser page (no image package needed).
 * A pixel counts as different when one colour channel is more than `channel` (of 255) away; the budget of
 * docs/10 §3 is that at most 6 % may differ ("same layout and look": text edges and gradients never match to
 * the pixel). Both pictures are cut to the same `crop` and the `masks` are ignored in both, so a clock that
 * the design draws at another moment can be left out. It also builds a side-by-side picture: ours, the
 * design, and the difference in red.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const BUDGET = 0.06;
export const CHANNEL = 48;

export interface CompareOptions {
  /** The part of both pictures to compare. Default: the whole of the design PNG. */
  crop?: Rect;
  /** Parts to ignore in both pictures. */
  masks?: Rect[];
  channel?: number;
}

export interface CompareResult {
  /** The share of compared pixels that differ, 0 to 1. */
  ratio: number;
  /** The side-by-side picture, PNG as base64. */
  picture: string;
  /** Size of the two pictures, to tell a size problem from a colour problem. */
  ours: { width: number; height: number };
  design: { width: number; height: number };
}

/** Runs the comparison in `scratch`, any blank page. */
export async function comparePngs(
  scratch: Page,
  ours: Buffer,
  design: Buffer,
  options: CompareOptions = {},
): Promise<CompareResult> {
  return scratch.evaluate(
    async ({ oursData, designData, crop, masks, channel }) => {
      const load = (data: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = `data:image/png;base64,${data}`;
        });
      const [mine, theirs] = await Promise.all([load(oursData), load(designData)]);
      const area = crop ?? { x: 0, y: 0, width: theirs.width, height: theirs.height };
      const width = Math.round(area.width);
      const height = Math.round(area.height);
      const draw = (image: HTMLImageElement) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true })!;
        context.fillStyle = '#ff00ff'; // what is left when a picture is smaller than the crop
        context.fillRect(0, 0, width, height);
        context.drawImage(image, area.x, area.y, width, height, 0, 0, width, height);
        return { canvas, data: context.getImageData(0, 0, width, height) };
      };
      const a = draw(mine);
      const b = draw(theirs);

      const masked = new Uint8Array(width * height);
      for (const mask of masks) {
        const x0 = Math.max(0, Math.round(mask.x - area.x));
        const y0 = Math.max(0, Math.round(mask.y - area.y));
        const x1 = Math.min(width, Math.round(mask.x + mask.width - area.x));
        const y1 = Math.min(height, Math.round(mask.y + mask.height - area.y));
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) masked[y * width + x] = 1;
      }

      const diff = document.createElement('canvas');
      diff.width = width;
      diff.height = height;
      const diffContext = diff.getContext('2d')!;
      const diffData = diffContext.createImageData(width, height);
      let differing = 0;
      let compared = 0;
      for (let p = 0; p < width * height; p++) {
        const i = p * 4;
        if (masked[p]) {
          diffData.data[i] = 60;
          diffData.data[i + 1] = 60;
          diffData.data[i + 2] = 110;
          diffData.data[i + 3] = 255;
          continue;
        }
        compared++;
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
        ratio: compared === 0 ? 0 : differing / compared,
        picture: sheet.toDataURL('image/png').replace(/^data:image\/png;base64,/, ''),
        ours: { width: mine.width, height: mine.height },
        design: { width: theirs.width, height: theirs.height },
      };
    },
    {
      oursData: ours.toString('base64'),
      designData: design.toString('base64'),
      crop: options.crop ?? null,
      masks: options.masks ?? [],
      channel: options.channel ?? CHANNEL,
    },
  );
}

/** Saves the side-by-side picture and a one-line note under `test-results/<folder>/`. */
export function saveComparison(folder: string, name: string, result: CompareResult): void {
  const out = path.resolve('test-results', folder);
  mkdirSync(out, { recursive: true });
  writeFileSync(path.join(out, `${name}.png`), Buffer.from(result.picture, 'base64'));
  writeFileSync(
    path.join(out, `${name}.txt`),
    `${(result.ratio * 100).toFixed(2)} % differ (ours ${result.ours.width}x${result.ours.height}, design ${result.design.width}x${result.design.height})\n`,
  );
}
