import { useTranslation } from 'react-i18next';
import { useFormat } from '@/lib/use-format';
import { useClubStatus } from '../api';
import { BigClock } from './BigClock';
import { Brand } from './Brand';
import { RichText } from './RichText';

/** The green panel of the sign-in page (screens 1, 2): the big clock and what the club is doing right now. */
export function ClockPanel() {
  const { t } = useTranslation('signin');
  const club = useClubStatus();
  const { clock } = useFormat();
  return (
    <section className="flex min-h-[420px] min-w-0 flex-[1_1_520px] flex-col justify-between bg-c-felt px-14 py-12">
      <Brand look="signIn" />
      <BigClock look="signIn" />
      <div className="flex flex-col gap-1 text-[18px]">
        <span className="font-semibold">{t('place')}</span>
        {/* No session yet, so this comes from the public club status (docs/06 §2), not the board. */}
        {club.data ? (
          <span className="text-c-on-felt">
            <RichText
              ns="signin"
              i18nKey="clubStatus"
              values={{
                number: club.data.sheetNumber,
                time: clock(club.data.openedAt),
                inUse: club.data.inUse,
                total: club.data.total,
              }}
            />
          </span>
        ) : null}
      </div>
    </section>
  );
}
