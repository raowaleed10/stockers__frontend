import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { routerFuture } from '@/lib/router-future';
import { readAppBase } from '../app-base';
import { OwnerRoutes } from './index';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]} future={routerFuture}>
      <OwnerRoutes />
    </MemoryRouter>,
  );

describe('owner routes', () => {
  it('shows the placeholder at /', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: 'Stockers' })).toBeInTheDocument();
  });

  it('shows a plain "Page not found" for any other address', () => {
    renderAt('/anything-else');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});

describe('readAppBase', () => {
  const docWith = (head: string) => new DOMParser().parseFromString(head, 'text/html');

  it('reads the base path from the meta tag and drops the trailing slash', () => {
    const doc = docWith('<meta name="app-base" content="/some-path/">');
    expect(readAppBase(doc)).toBe('/some-path');
  });

  it('keeps "/" as the root', () => {
    expect(readAppBase(docWith('<meta name="app-base" content="/">'))).toBe('/');
  });

  it('returns null when the tag is missing or is not a path', () => {
    expect(readAppBase(docWith(''))).toBeNull();
    expect(readAppBase(docWith('<meta name="app-base" content="somewhere">'))).toBeNull();
  });
});
