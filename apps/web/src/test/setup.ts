import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { cloneElement, createElement, type ReactElement } from 'react';
import { afterEach, vi } from 'vitest';
import '@/lib/i18n';

// jsdom has no layout, so Recharts' `ResponsiveContainer` measures 0 × 0 and draws nothing. A chart is drawn at a fixed 800 px
// wide in tests, so its bars and lines are in the page and a test can count them.
vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal<typeof import('recharts')>();
  return {
    ...original,
    ResponsiveContainer: ({
      children,
      height = 200,
    }: {
      children: ReactElement;
      height?: number | string;
    }) => {
      const tall = typeof height === 'number' ? height : 200;
      return createElement(
        'div',
        { style: { width: 800, height: tall } },
        cloneElement(children, { width: 800, height: tall }),
      );
    },
  };
});

afterEach(() => {
  cleanup();
});
