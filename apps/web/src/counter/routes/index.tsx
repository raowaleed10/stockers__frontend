import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { NotFound } from '@/ui/NotFound';
import { AlertsPanel } from '../components/AlertsPanel';
import { Board } from '../screens/Board';
import { PagePlaceholder } from '../screens/PagePlaceholder';
import { SignIn } from '../screens/SignIn';
import { RequireWorker } from '../session/RequireWorker';

// Development only (docs/03): in a production build `import.meta.env.DEV` is false, so this is
// dropped and the kit page, with its sample words, is not in the bundle.
const KitPage = import.meta.env.DEV ? lazy(() => import('@/dev/kit/KitPage')) : null;
const TilesPage = import.meta.env.DEV ? lazy(() => import('@/dev/tiles/TilesPage')) : null;
const DataPage = import.meta.env.DEV ? lazy(() => import('../screens/dev/DataPage')) : null;
const GamesPreview = import.meta.env.DEV ? lazy(() => import('../screens/dev/GamesPreview')) : null;

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
 * What a tap on a table opens: P06 builds starting a game and a room, P07 builds the running game. Each shows its
 * name inside the real frame until then, like the screens above. (They become child routes of the board, so the
 * panel draws over it, as the alerts do.)
 */
function TableScreen({ what }: { what: 'start' | 'room' | 'running' }) {
  const { t } = useTranslation('board');
  const { id } = useParams<{ id: string }>();
  const title =
    what === 'start'
      ? t('cta.startGame')
      : what === 'room'
        ? t('cta.startRoom')
        : t('state.playing');
  return <PagePlaceholder title={`${title} (${id ?? ''})`} />;
}

export function CounterRoutes() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignIn />} />
      {/* Every other counter screen needs a worker session. */}
      <Route element={<RequireWorker />}>
        {/* The board is a layout route: panels such as the bell's alerts are its children and draw over it. */}
        <Route path="/" element={<Board />}>
          <Route path="alerts" element={<AlertsPanel />} />
        </Route>
        {/* `/` is the snooker and rooms tab (docs/03). */}
        <Route path="/board/snooker" element={<Navigate to="/" replace />} />
        <Route path="/board/room" element={<Navigate to="/" replace />} />
        <Route path="/board/:category" element={<Board />}>
          {/* The bell opens over the tab you are on, so the panel is a child of every tab. */}
          <Route path="alerts" element={<AlertsPanel />} />
        </Route>
        <Route path="/table/:id/start" element={<TableScreen what="start" />} />
        <Route path="/table/:id" element={<TableScreen what="running" />} />
        <Route path="/room/:id/start" element={<TableScreen what="room" />} />
        <Route path="/checkout/:playerId" element={<LaterScreen title="actions.checkout" />} />
        {GamesPreview ? (
          <Route
            path="/dev/games-preview"
            element={
              <Suspense fallback={null}>
                <GamesPreview />
              </Suspense>
            }
          />
        ) : null}
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
