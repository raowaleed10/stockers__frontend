import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// docs/NO_DESIGN.md lists every piece built without an approved PNG, each with a screenshot in docs/no-design
// (made by `npm run shots:no-design`). This keeps the list and the pictures in step.

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const DOC = path.join(REPO, 'docs/NO_DESIGN.md');
const PICTURES = path.join(REPO, 'docs/no-design');
const SPEC = path.join(REPO, 'apps/web/tests/no-design/no-design.counter.spec.ts');

const doc = readFileSync(DOC, 'utf8');
const linked = [...doc.matchAll(/!\[[^\]]*\]\(no-design\/([a-z0-9-]+\.png)\)/g)].map((m) => m[1]);
const sections = [...doc.matchAll(/^## \d+\. .+$/gm)];

describe('docs/NO_DESIGN.md', () => {
  it('has a picture for every section, and one section for every picture', () => {
    expect(sections.length).toBeGreaterThan(0);
    expect(linked).toHaveLength(sections.length);
    expect(new Set(linked).size).toBe(linked.length);
  });

  it('points only at pictures that exist', () => {
    for (const file of linked) {
      expect(existsSync(path.join(PICTURES, file)), `docs/no-design/${file} is missing`).toBe(true);
    }
  });

  it('has no picture that no section shows', () => {
    const files = readdirSync(PICTURES).filter((file) => file.endsWith('.png'));
    expect(files.sort()).toEqual([...linked].sort());
  });

  it('has a screenshot entry in the spec for every picture (so one command makes them all again)', () => {
    const spec = readFileSync(SPEC, 'utf8');
    for (const file of linked) {
      expect(spec, `no entry for ${file} in no-design.counter.spec.ts`).toContain(
        `id: '${file.replace(/\.png$/, '')}'`,
      );
    }
  });

  it('gives every section a place to see it and its words', () => {
    const parts = doc.split(/^## \d+\. /m).slice(1);
    for (const part of parts) {
      expect(part).toMatch(/\*\*Where:\*\*/);
      expect(part).toMatch(/\*\*Words:\*\*/);
      expect(part).toMatch(/\*\*What:\*\*/);
    }
  });

  it('lists every section in the table at the top', () => {
    for (const section of sections) {
      const title = section[0].replace(/^## \d+\. /, '');
      expect(doc, `the table does not list "${title}"`).toContain(`[${title}](#`);
    }
  });
});
