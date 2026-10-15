import { Trans } from 'react-i18next';
import { MoneyText } from '@/ui/MoneyText';
import { cx } from '@/ui/cx';
import { StatusPill } from '@/ui/StatusPill';
import { useTile } from './tile-context';

/**
 * The words on a table: the number, the kind and price, the status pill, the game and the players, then
 * the timer and the amount, or the call to action, or the note. It reads everything from the tile.
 */
export function TileContent() {
  const { props, look, lockId } = useTile();
  const { number, label, pillLabel, gameLine, players, timer, amount, cta, note, lockReason } =
    props;

  let bottom;
  if (lockReason) {
    bottom = (
      <span id={lockId} className="tile-hint tile-hint-lg">
        {lockReason}
      </span>
    );
  } else if (note) {
    bottom = (
      <span id={lockId} className="tile-note">
        {note.title ? <span className="tile-note-title">{note.title}</span> : null}
        {note.detail ? (
          <span className={cx('tile-hint', !note.title && 'tile-hint-lg')}>{note.detail}</span>
        ) : null}
      </span>
    );
  } else if (cta) {
    bottom = (
      <span className="tile-cta-box">
        {cta.title ? <span className="tile-cta">{cta.title}</span> : null}
        {cta.hint ? <span className="tile-hint">{cta.hint}</span> : null}
      </span>
    );
  } else {
    const money =
      amount !== undefined ? (
        <span className="tile-amt">
          <MoneyText value={amount} />
        </span>
      ) : null;
    bottom = (
      <>
        {timer}
        {props.trailing ? (
          <span className="tile-end">
            {money}
            {props.trailing}
          </span>
        ) : (
          money
        )}
      </>
    );
  }

  return (
    <span className="tile-ct">
      <span className="tile-top">
        <span className="tile-idn">
          <span className="tile-num">{number}</span>
          <span className="tile-lab">
            {label[0]}
            <br />
            {label[1]}
          </span>
        </span>
        <StatusPill status={look.pill} label={pillLabel} className="tile-pill" />
      </span>
      {gameLine ? (
        <span className="tile-gt">
          {gameLine.main}
          {gameLine.detail ? <span> {gameLine.detail}</span> : null}
        </span>
      ) : null}
      {players ? (
        <span className="tile-pl">
          {players.under ? (
            <Trans i18nKey="tile.under" values={{ name: players.a }} components={{ w: <span /> }} />
          ) : players.b !== undefined ? (
            <Trans
              i18nKey="tile.versus"
              values={{ a: players.a, b: players.b }}
              components={{ w: <span /> }}
            />
          ) : (
            players.a
          )}
        </span>
      ) : null}
      <span className="tile-bot">{bottom}</span>
    </span>
  );
}
