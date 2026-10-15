import type { TableKind } from '@stockers/shared';
import { useId, useMemo, type ReactNode } from 'react';
import { cx } from '@/ui/cx';
import { STATUS_LOOK } from './status';
import { TileContext, type TileState } from './tile-context';
import type { TileProps } from './types';
import './tiles.css';

export interface TileFrameProps extends TileProps {
  kind: TableKind;
  children: ReactNode;
}

/**
 * The outside of every tile: a real `<button>` (or a `<div role="group">` when the tile holds its own
 * buttons), its name, the keyboard focus ring, and the lock. The drawing goes inside as `children`.
 */
export function TileFrame({ kind, children, ...props }: TileFrameProps) {
  const lockId = useId();
  const look = STATUS_LOOK[props.status];
  // A tile with no price is disabled. A tile that is out of order stays focusable (so a screen reader can read
  // its note) but does nothing when pressed. Both say why through their description.
  const blocked = look.locked || props.status === 'outOfOrder';
  const state = useMemo<TileState>(() => ({ props, look, lockId }), [props, look, lockId]);
  const common = {
    'aria-label': props.ariaLabel,
    'data-kind': kind,
    'data-status': props.status,
    className: cx('tile', props.className),
  };

  return (
    <TileContext.Provider value={state}>
      {props.as === 'div' ? (
        <div role="group" {...common}>
          {children}
        </div>
      ) : (
        <button
          type="button"
          disabled={look.locked}
          aria-disabled={blocked || undefined}
          aria-describedby={blocked && (props.lockReason || props.note) ? lockId : undefined}
          onClick={blocked ? undefined : props.onPress}
          {...common}
        >
          {children}
        </button>
      )}
    </TileContext.Provider>
  );
}
