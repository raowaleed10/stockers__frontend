import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { NotFound } from '@/ui/NotFound';
import { Activity } from '../screens/activity/Activity';
import { HomePage } from '../screens/dashboard/HomePage';
import { OwnerPage } from '../screens/OwnerPage';
import { Reports } from '../screens/reports/Reports';
import { SignIn } from '../screens/SignIn';
import { RequireOwner } from '../session/RequireOwner';

// Development only (docs/03): in a production build `import.meta.env.DEV` is false, so this is
// dropped and the kit page, with its sample words, is not in the bundle.
const KitPage = import.meta.env.DEV ? lazy(() => import('@/dev/kit/KitPage')) : null;
const DataPage = import.meta.env.DEV ? lazy(() => import('../screens/dev/DataPage')) : null;

/**
 * Every owner route of `docs/03`. `/sign-in` is open; everything else needs an owner session (`RequireOwner`) and is drawn
 * inside the owner frame. A path that is not here is a plain "Page not found", the same as for any mistyped address.
 */
export function OwnerRoutes() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignIn />} />
      <Route element={<RequireOwner />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/live" element={<OwnerPage id="live" />} />
        <Route path="/sheets" element={<OwnerPage id="sheets" />} />
        <Route path="/sheets/:key" element={<OwnerPage id="sheets" />} />
        <Route path="/sheets/:key/edit" element={<OwnerPage id="sheets" />} />
        <Route path="/players" element={<OwnerPage id="players" />} />
        <Route path="/players/:id" element={<OwnerPage id="players" />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/prices" element={<OwnerPage id="prices" />} />
        <Route path="/prices/add" element={<OwnerPage id="prices" />} />
        <Route path="/prices/:id" element={<OwnerPage id="prices" />} />
        <Route path="/canteen" element={<OwnerPage id="canteen" />} />
        <Route path="/expenses" element={<OwnerPage id="expenses" />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/workers" element={<OwnerPage id="workers" />} />
        <Route path="/settings" element={<OwnerPage id="settings" />} />
        <Route path="/alerts" element={<OwnerPage id="alerts" />} />
      </Route>
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
