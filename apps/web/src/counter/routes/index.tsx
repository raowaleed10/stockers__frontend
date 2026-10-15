import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, Route, Routes } from 'react-router-dom';
import { NotFound } from '@/ui/NotFound';
import { AlertsPanel } from '../components/AlertsPanel';
import { PagePlaceholder } from '../screens/PagePlaceholder';
import { SignIn } from '../screens/SignIn';
import { RequireWorker } from '../session/RequireWorker';

// Development only (docs/03): in a production build `import.meta.env.DEV` is false, so this is
// dropped and the kit page, with its sample words, is not in the bundle.
const KitPage = import.meta.env.DEV ? lazy(() => import('@/dev/kit/KitPage')) : null;
const TilesPage = import.meta.env.DEV ? lazy(() => import('@/dev/tiles/TilesPage')) : null;
const DataPage = import.meta.env.DEV ? lazy(() => import('../screens/dev/DataPage')) : null;

/** The screens that later steps build. Each shows its name inside the real frame until then. */
const LATER_SCREENS = [
  { path: '/checkout', title: 'actions.checkout' },
  { path: '/canteen', title: 'actions.canteen' },
  { path: '/players', title: 'actions.players' },
  { path: '/today', title: 'actions.today' },
  { path: '/expense', title: 'actions.expense' },
  { path: '/close-sheet', title: 'actions.closeSheet' },
  // Pause all is an action, not a screen: P05 or P07 replaces this placeholder with the real thing.
  { path: '/pause-all', title: 'actions.pauseAll' },
] as const;

function LaterScreen({ title }: { title: (typeof LATER_SCREENS)[number]['title'] }) {
  const { t } = useTranslation('frame');
  return <PagePlaceholder title={t(title)} />;
}

/**
 * The board (P05 builds it). The panels that open over it, such as the bell's alerts at /alerts, are its child
 * routes: they draw into the `<Outlet/>` on top of the board, so the board stays behind them as on screen 11.
 */
function BoardPlaceholder() {
  const { t } = useTranslation();
  return (
    <div className="relative flex flex-1 flex-col">
      <PagePlaceholder title={t('brand')} />
      <Outlet />
    </div>
  );
}

export function CounterRoutes() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignIn />} />
      {/* Every other counter screen needs a worker session. */}
      <Route element={<RequireWorker />}>
        <Route path="/" element={<BoardPlaceholder />}>
          <Route path="alerts" element={<AlertsPanel />} />
        </Route>
        {LATER_SCREENS.map(({ path, title }) => (
          <Route key={path} path={path} element={<LaterScreen title={title} />} />
        ))}
      </Route>
      {KitPage ? (
        <Route
          path="/dev/kit"
          element={
            <Suspense fallback={null}>
              <KitPage app="counter" />
            </Suspense>
          }
        />
      ) : null}
      {TilesPage ? (
        <Route
          path="/dev/tiles"
          element={
            <Suspense fallback={null}>
              <TilesPage />
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
