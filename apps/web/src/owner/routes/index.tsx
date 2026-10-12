import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { NotFound } from '@/ui/NotFound';
import { Placeholder } from '../screens/Placeholder';

// Development only (docs/03): in a production build `import.meta.env.DEV` is false, so this is
// dropped and the kit page, with its sample words, is not in the bundle.
const KitPage = import.meta.env.DEV ? lazy(() => import('@/dev/kit/KitPage')) : null;
const DataPage = import.meta.env.DEV ? lazy(() => import('../screens/dev/DataPage')) : null;

export function OwnerRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Placeholder />} />
      {KitPage ? (
        <Route
          path="/dev/kit"
          element={
            <Suspense fallback={null}>
              <KitPage app="owner" />
            </Suspense>
          }
        />
      ) : null}
      {DataPage ? (
        <Route
          path="/dev/data"
          element={
            <Suspense fallback={null}>
              <DataPage />
            </Suspense>
          }
        />
      ) : null}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
