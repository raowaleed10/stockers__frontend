import type { BoardCategory, BoardResponse, BoardTable } from '@stockers/shared';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/ui/Button';
import { CounterDialog } from '@/ui/CounterDialog';
import { useCloseTable } from '../../start/use-close';
import { useTableScreen } from '../../start/use-table';

export interface TableContext {
  table: BoardTable;
  category: BoardCategory | undefined;
  board: BoardResponse;
}

/**
 * What every table screen needs before it can draw: the table. While the board loads it draws nothing (the board is
 * behind it), if it cannot load it says so with a way to try again, and a table that does not exist is "Page not found".
 */
export function TableGate({
  tableId,
  children,
}: {
  tableId: string | undefined;
  children: (context: TableContext) => ReactNode;
}) {
  const { t } = useTranslation('start');
  const { t: tCommon } = useTranslation();
  const close = useCloseTable();
  const { board, table, category } = useTableScreen(tableId);

  if (board.isPending) return null;
  if (board.isError) {
    return (
      <CounterDialog
        title={t('loadFailed')}
        onClose={close}
        actions={
          <Button theme="counter" variant="primary" onClick={() => void board.refetch()}>
            {t('retry')}
          </Button>
        }
      />
    );
  }
  if (!table) return <CounterDialog title={tCommon('notFound')} onClose={close} />;
  return <>{children({ table, category, board: board.data })}</>;
}
