import type { TableKind, TableStatus } from '@stockers/shared';
import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { MiniTable, type TileStatus } from '@/tiles';
import { cx } from '@/ui/cx';
import { StatusPill } from '@/ui/StatusPill';
import { Sample } from './Sample';
import { SCREEN_16, SCREEN_3, SCREEN_4, SCREEN_5, SCREEN_6_UR } from './samples-screens';
import { KINDS, matrixSample, STATUSES, type GalleryLang } from './samples-matrix';
import { i18n } from './tiles-i18n';

/** A group of tiles laid out the way the approved screen lays them out, at the same width. */
function Group({
  id,
  title,
  note,
  children,
  className,
  style,
}: {
  id: string;
  title: string;
  note?: string;
  children: ReactNode;
  className: string;
  style?: CSSProperties;
}) {
  return (
    <section data-section={id} aria-label={title} className="flex flex-col gap-3">
      <h2 className="text-[22px] font-bold">{title}</h2>
      {note ? <p className="text-[15px] text-c-text-2">{note}</p> : null}
      <div className={cx('p-3', className)} style={style}>
        {children}
      </div>
    </section>
  );
}

/** One language of the gallery: its own i18n instance and text direction, so English and Urdu sit together. */
function LangBlock({
  lang,
  children,
  className,
}: {
  lang: GalleryLang;
  children: ReactNode;
  className?: string;
}) {
  const instance = useMemo(() => i18n.cloneInstance({ lng: lang }), [lang]);
  return (
    <I18nextProvider i18n={instance}>
      <div
        lang={lang}
        dir={lang === 'ur' ? 'rtl' : 'ltr'}
        data-lang={lang}
        className={cx(lang === 'ur' ? 'font-urdu' : 'font-body', className)}
      >
        {children}
      </div>
    </I18nextProvider>
  );
}

const WIDTH: Record<TableKind, number> = {
  snooker: 319,
  room: 319,
  pool: 324,
  carrom: 300,
  foosball: 441,
  ludo: 324,
  playstation: 254,
};

function Matrix({ lang }: { lang: GalleryLang }) {
  const { t } = useTranslation('tiles');
  return (
    <LangBlock lang={lang} className="flex flex-col gap-8">
      {KINDS.map((kind) => (
        <section
          key={kind}
          data-section={`matrix-${lang}-${kind}`}
          aria-label={`${lang} ${kind}`}
          className="flex flex-col gap-3"
        >
          <h3 className="font-body text-[18px] font-bold" lang="en" dir="ltr">
            {t(`chrome.kinds.${kind}`)}
          </h3>
          <div className="flex flex-wrap gap-x-[26px] gap-y-8 p-3">
            {STATUSES.map((status: TileStatus) => (
              <div key={status} style={{ width: WIDTH[kind] }} className="flex">
                <Sample sample={matrixSample(lang, kind, status)} className="w-full" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </LangBlock>
  );
}

const PHONE_ROWS: { number: string; status: TableStatus; room?: boolean; words: string }[] = [
  { number: '1', status: 'playing', words: 'Table 1' },
  { number: '2', status: 'free', words: 'Table 2' },
  { number: '4', status: 'over30', words: 'Table 4' },
  { number: '6', status: 'paused', words: 'Table 6' },
  { number: '7', status: 'outOfOrder', words: 'Table 7' },
  { number: 'R1', status: 'playing', room: true, words: 'Room 1' },
  { number: 'R2', status: 'free', room: true, words: 'Room 2' },
];

function PhoneList() {
  return (
    <ul
      data-section="s54"
      className="flex w-[358px] list-none flex-col gap-3 rounded-card bg-o-page p-4 text-o-ink"
    >
      {PHONE_ROWS.map((row) => (
        <li
          key={row.words}
          className="flex items-center gap-3 rounded-[16px] border-2 border-o-line bg-o-card px-3.5 py-3"
        >
          <MiniTable number={row.number} status={row.status} room={row.room} />
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="text-[17px] font-bold">{row.words}</span>
            <StatusPill status={row.status} tone="light" />
          </span>
        </li>
      ))}
    </ul>
  );
}

const TILE = 'flex-[1_1_300px] min-w-0';
const POOL_TILE = 'flex-[1_1_300px] min-w-0';
const TILES_380 = 'flex-[1_1_380px] min-w-0';

const grid = (columns: string) =>
  ({ display: 'grid', gridTemplateColumns: columns, gap: 26 }) as CSSProperties;

/**
 * The tile gallery (development only, route `/dev/tiles`): the tiles of screens 3, 4, 5, 6 and 16 at the sizes
 * of the screens, then every kind of table in every state, in English and Urdu. The visual test compares
 * the first five groups with the PNGs.
 */
export default function TilesPage() {
  const { t } = useTranslation('tiles');
  return (
    <main className="min-h-screen bg-c-page text-c-text">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-12 px-4 py-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-[32px] font-bold">{t('chrome.title')}</h1>
          <p className="max-w-[820px] text-[16px] opacity-80">{t('chrome.intro')}</p>
        </header>

        <Group
          id="s03"
          title={t('chrome.s3')}
          className="flex flex-wrap gap-[22px]"
          style={{ width: 1001.6 + 24 }}
        >
          {SCREEN_3.map((sample) => (
            <Sample key={sample.id} sample={sample} className={TILE} />
          ))}
        </Group>

        <Group
          id="s04"
          title={t('chrome.s4')}
          className="flex flex-wrap gap-[22px]"
          style={{ width: 1380 + 24 }}
        >
          {SCREEN_4.map((sample) => (
            <Sample key={sample.id} sample={sample} className={POOL_TILE} />
          ))}
        </Group>

        <section data-section="s05" aria-label={t('chrome.s5')} className="flex flex-col gap-6">
          <h2 className="text-[22px] font-bold">{t('chrome.s5')}</h2>
          {(
            [
              ['pool', 'repeat(auto-fill, minmax(300px, 1fr))'],
              ['carrom', 'repeat(auto-fill, minmax(250px, 300px))'],
              ['foosball', 'repeat(auto-fill, minmax(380px, 1fr))'],
              ['ludo', 'repeat(auto-fill, minmax(320px, 1fr))'],
              ['playstation', 'repeat(auto-fill, minmax(250px, 1fr))'],
            ] as const
          ).map(([kind, columns]) => (
            <div key={kind} className="flex flex-col gap-3" style={{ width: 1376 + 16 }}>
              <h3 className="text-[19px] font-bold">{t(`chrome.s5${kind}`)}</h3>
              <div className="px-2 pb-1.5 pt-3" style={grid(columns)}>
                {SCREEN_5.filter((sample) => sample.kind === kind).map((sample) => (
                  <Sample key={sample.id} sample={sample} />
                ))}
              </div>
            </div>
          ))}
        </section>

        <LangBlock lang="ur">
          <Group
            id="s06"
            title={t('chrome.s6')}
            className="flex flex-wrap gap-[22px]"
            style={{ width: 1001.6 + 24 }}
          >
            {SCREEN_6_UR.map((sample) => (
              <Sample key={sample.id} sample={sample} className={TILE} />
            ))}
          </Group>
        </LangBlock>

        <Group
          id="s16"
          title={t('chrome.s16')}
          className="flex flex-wrap gap-[22px]"
          style={{ width: 1380 + 24 }}
        >
          {SCREEN_16.map((sample) => (
            <Sample key={sample.id} sample={sample} className={TILES_380} />
          ))}
        </Group>

        <section aria-label={t('chrome.matrix')} className="flex flex-col gap-6">
          <h2 className="text-[22px] font-bold">{t('chrome.matrix')}</h2>
          <h3 className="text-[19px] font-bold">{t('chrome.english')}</h3>
          <Matrix lang="en" />
          <h3 className="text-[19px] font-bold">{t('chrome.urdu')}</h3>
          <Matrix lang="ur" />
        </section>

        <section aria-label={t('chrome.phone')} className="flex flex-col gap-3">
          <h2 className="text-[22px] font-bold">{t('chrome.phone')}</h2>
          <PhoneList />
        </section>
      </div>
    </main>
  );
}
