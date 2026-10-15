import { formatRs, waitingTotal, type FormatLang, type WaitingBill } from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';
import { BillWords } from './BillWords';

export interface WaitingPanelProps {
  bills: readonly WaitingBill[];
  /** A row was pressed: open this player's bill. */
  onOpen: (playerId: string) => void;
}

/**
 * "Waiting to pay" on the live board (screens 3 and 6): everyone who has not paid for tonight yet, with the phone
 * tail, what the bill is for and the amount, and the total at the bottom. Rows are 64 px. The first row has the
 * raised colour, as the screens draw it. Nothing is written here about old credit: this is tonight's money.
 */
export function WaitingPanel({ bills, onOpen }: WaitingPanelProps) {
  const { t, i18n } = useTranslation('board');
  const lang: FormatLang = i18n.language === 'ur' ? 'ur' : 'en';
  const total = waitingTotal(bills);

  return (
    <aside
      aria-label={t('waiting.title')}
      // `box-content`: the 320 px basis of screen 3 is the width inside the padding and border (358 px in all).
      className="box-content flex min-w-0 flex-[1_1_320px] flex-col gap-1.5 rounded-card border border-c-line bg-c-panel p-[18px] rtl:gap-0.5 rtl:px-[18px] rtl:py-3.5"
    >
      <div className="flex items-baseline justify-between pb-2 rtl:pb-1.5">
        <h2 className="m-0 text-[21px] font-bold rtl:text-[19px]">{t('waiting.title')}</h2>
        <span className="text-[15px] text-c-text-2 rtl:text-[14px]">
          {t('waiting.players', { count: bills.length })}
        </span>
      </div>

      {bills.length === 0 ? (
        <p className="m-0 py-4 text-[18px] text-c-text-2">{t('waiting.empty')}</p>
      ) : (
        <>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0 rtl:gap-0.5">
            {bills.map((bill, index) => (
              <li key={bill.playerId}>
                <button
                  type="button"
                  onClick={() => onOpen(bill.playerId)}
                  className={cx(
                    'flex min-h-[64px] w-full items-center justify-between rounded-[12px] border-0 px-3.5 py-2 text-start text-c-text rtl:py-1',
                    focusRing.counter,
                    index === 0 ? 'bg-c-raised' : 'bg-transparent',
                    'active:bg-c-raised-2',
                  )}
                >
                  <span className="flex min-w-0 flex-col rtl:leading-[1.7]">
                    <span className="text-[18px] font-semibold rtl:text-[16px]">
                      <bdi>{bill.name}</bdi>
                    </span>
                    <span className="text-[14px] text-c-text-2 rtl:text-[13px]">
                      {bill.phoneTail ? (
                        <>
                          {/* The tail comes from the server already masked: "•••• 4512". */}
                          <bdi dir="ltr">{bill.phoneTail}</bdi>
                          {bill.parts.length > 0 ? t('waiting.separator') : null}
                          <BillWords parts={bill.parts} />
                        </>
                      ) : (
                        <BillWords parts={bill.parts} capitalize />
                      )}
                    </span>
                  </span>
                  <span className="ms-3 whitespace-nowrap text-[19px] font-bold tabular-nums rtl:text-[17px]">
                    {formatRs(bill.tonight, lang)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-c-line pt-3 text-[16px] text-c-text-2 rtl:mt-1.5 rtl:pt-2 rtl:text-[15px]">
            <span>{t('waiting.total')}</span>
            <span className="whitespace-nowrap font-bold tabular-nums text-c-text">
              {formatRs(total, lang)}
            </span>
          </div>
        </>
      )}
    </aside>
  );
}
