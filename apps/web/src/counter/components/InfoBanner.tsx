import { Info, Tag } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * "Pool tables have no price yet" (screen 4): the amber box with the price tag, a bold title and one line. It is a
 * status message, so a screen reader reads it when the board opens.
 */
export function PriceBanner({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-center gap-3.5 rounded-[16px] border border-c-warn-line bg-c-warn-bg px-5 py-4"
    >
      <Tag aria-hidden="true" size={26} strokeWidth={2} className="shrink-0 text-s-pause" />
      <div className="flex flex-col gap-0.5">
        <span className="text-[19px] font-bold">{title}</span>
        <span className="text-[16px] text-c-text-3">{children}</span>
      </div>
    </div>
  );
}

/** "For the look only." (screen 5): the one-line box with the round "i", a brass lead and the sentence. */
export function LookBanner({ lead, children }: { lead: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-c-note-line bg-c-raised px-[18px] py-3.5 text-c-brass">
      <Info aria-hidden="true" size={22} strokeWidth={2} className="shrink-0" />
      <span className="text-[16px] text-c-text">
        <b className="text-c-brass">{lead}</b> {children}
      </span>
    </div>
  );
}

/** One of the two cards under the locked boards (screen 4): a title and a paragraph. */
export function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-[1_1_420px] flex-col gap-2.5 rounded-card border border-c-line bg-c-panel px-5 py-[18px]">
      <h2 className="m-0 text-[20px] font-bold">{title}</h2>
      <p className="m-0 text-[17px] leading-[1.45] text-c-text-3 rtl:leading-[1.8]">{children}</p>
    </div>
  );
}
