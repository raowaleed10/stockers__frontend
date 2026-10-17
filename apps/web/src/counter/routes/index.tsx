import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes } from 'react-router-dom';
import { NotFound } from '@/ui/NotFound';
import { AlertsPanel } from '../components/AlertsPanel';
import { Board } from '../screens/Board';
import { BillPage } from '../screens/checkout/BillPage';
import { CheckoutList } from '../screens/checkout/CheckoutList';
import { DiscountDialog } from '../screens/checkout/DiscountDialog';
import { PartPayment } from '../screens/checkout/PartPayment';
import { CorrectFrame } from '../screens/end/CorrectFrame';
import { EndGame } from '../screens/end/EndGame';
import { NextFrame } from '../screens/end/NextFrame';
import { Overtime } from '../screens/end/Overtime';
import { RoomEnd } from '../screens/end/RoomEnd';
import { RoomStart } from '../screens/end/RoomStart';
import { BackInOrder } from '../screens/start/BackInOrder';
import { ChangeType } from '../screens/start/ChangeType';
import { NewPlayer } from '../screens/start/NewPlayer';
import { OutOfOrder } from '../screens/start/OutOfOrder';
import { StartDouble } from '../screens/start/StartDouble';
import { StartPlayers } from '../screens/start/StartPlayers';
import { StartType } from '../screens/start/StartType';
import { DamageCharge } from '../screens/table/DamageCharge';
import { MoveTable } from '../screens/table/MoveTable';
import { StopFrame } from '../screens/table/StopFrame';
import { TablePanel } from '../screens/table/TablePanel';
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
  { path: '/canteen', title: 'actions.canteen' },
  { path: '/players', title: 'actions.players' },
  { path: '/today', title: 'actions.today' },
  { path: '/expense', title: 'actions.expense' },
  { path: '/close-sheet', title: 'actions.closeSheet' },
] as const;

function LaterScreen({ title }: { title: (typeof LATER_SCREENS)[number]['title'] }) {
  const { t } = useTranslation('frame');
  return <PagePlaceholder title={t(title)} />;
}

/**
 * The screens that open over a board, for one table (docs/03, screens 7 to 12). They are children of both `/` and
 * `/board/:category`, so they open over the tab you are on and closing returns to it (D57). `players/new` is the
 * "Add a new player" of screen 10.
 */
const TABLE_ROUTES = [
  <Route key="start" path="table/:id/start" element={<StartType />} />,
  <Route key="start-players" path="table/:id/start/players" element={<StartPlayers />} />,
  <Route key="start-double" path="table/:id/start/double" element={<StartDouble />} />,
  <Route key="start-ooo" path="table/:id/start/out-of-order" element={<OutOfOrder />} />,
  <Route key="back" path="table/:id/back-in-order" element={<BackInOrder />} />,
  <Route key="change" path="table/:id/change-type" element={<ChangeType />} />,
  <Route
    key="change-players"
    path="table/:id/change-type/players"
    element={<StartPlayers mode="change" />}
  />,
  <Route
    key="change-double"
    path="table/:id/change-type/double"
    element={<StartDouble mode="change" />}
  />,
  <Route key="panel" path="table/:id" element={<TablePanel />} />,
  <Route key="move" path="table/:id/move" element={<MoveTable />} />,
  <Route key="stop" path="table/:id/stop" element={<StopFrame />} />,
  <Route key="damage" path="table/:id/damage" element={<DamageCharge />} />,
  <Route key="end" path="table/:id/end" element={<EndGame />} />,
  <Route key="overtime" path="table/:id/end/overtime" element={<Overtime />} />,
  <Route key="next" path="table/:id/next" element={<NextFrame />} />,
  <Route key="correct" path="table/:id/correct/:gameId" element={<CorrectFrame />} />,
  <Route
    key="correct-over"
    path="table/:id/correct/:gameId/overtime"
    element={<CorrectFrame step="overtime" />}
  />,
  <Route
    key="correct-stop"
    path="table/:id/correct/:gameId/stop"
    element={<CorrectFrame step="stop" />}
  />,
  <Route key="room" path="room/:id/start" element={<RoomStart />} />,
  <Route key="room-end" path="room/:id/end" element={<RoomEnd />} />,
  <Route key="new-player" path="players/new" element={<NewPlayer />} />,
];

export function CounterRoutes() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignIn />} />
      {/* Every other counter screen needs a worker session. */}
      <Route element={<RequireWorker />}>
        {/* The board is a layout route: panels such as the bell's alerts are its children and draw over it. */}
        <Route path="/" element={<Board />}>
          <Route path="alerts" element={<AlertsPanel />} />
          {TABLE_ROUTES}
        </Route>
        {/* `/` is the snooker and rooms tab (docs/03). */}
        <Route path="/board/snooker" element={<Navigate to="/" replace />} />
        <Route path="/board/room" element={<Navigate to="/" replace />} />
        <Route path="/board/:category" element={<Board />}>
          {/* The bell opens over the tab you are on, so the panel is a child of every tab. */}
          <Route path="alerts" element={<AlertsPanel />} />
          {TABLE_ROUTES}
        </Route>
        {/* The checkout screens (24 to 27) are pages with their own header: the frame draws no bars on them. */}
        <Route path="/checkout" element={<CheckoutList />} />
        <Route path="/checkout/:playerId" element={<BillPage />}>
          <Route path="discount" element={<DiscountDialog />} />
        </Route>
        <Route path="/checkout/:playerId/part" element={<PartPayment />} />
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
