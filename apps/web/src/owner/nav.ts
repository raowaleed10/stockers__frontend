/**
 * Where the owner portal goes. The sidebar (screen 36) lists the 11 pages in this order (docs/04 §7); on a phone the tab
 * bar (screen 53) keeps four of them and "More" holds the rest (D66).
 */
export type NavId =
  | 'dashboard'
  | 'live'
  | 'sheets'
  | 'players'
  | 'reports'
  | 'prices'
  | 'canteen'
  | 'expenses'
  | 'activity'
  | 'workers'
  | 'settings';

export interface NavItem {
  id: NavId;
  path: string;
  /** Only the exact path is the open page (the dashboard is `/`). */
  end?: boolean;
}

export const SIDEBAR_ITEMS: readonly NavItem[] = [
  { id: 'dashboard', path: '/', end: true },
  { id: 'live', path: '/live' },
  { id: 'sheets', path: '/sheets' },
  { id: 'players', path: '/players' },
  { id: 'reports', path: '/reports' },
  { id: 'prices', path: '/prices' },
  { id: 'canteen', path: '/canteen' },
  { id: 'expenses', path: '/expenses' },
  { id: 'activity', path: '/activity' },
  { id: 'workers', path: '/workers' },
  { id: 'settings', path: '/settings' },
];

/** The phone's bottom tabs: the label is the tab's own word (Home, Live, Sheets, Players), then More. */
export const PHONE_TABS = [
  { id: 'dashboard', tab: 'home', path: '/', end: true },
  { id: 'live', tab: 'live', path: '/live' },
  { id: 'sheets', tab: 'sheets', path: '/sheets' },
  { id: 'players', tab: 'players', path: '/players' },
] as const satisfies readonly (NavItem & { tab: string })[];

/** What "More" lists: every page the tab bar does not have, in the sidebar's order. */
export const MORE_ITEMS: readonly NavItem[] = SIDEBAR_ITEMS.filter(
  (item) => !PHONE_TABS.some((tab) => tab.id === item.id),
);

/** The page the notification bell opens (screen 58 on a phone). */
export const ALERTS_PATH = '/alerts';

/** True when `pathname` (without the base path) is this item's page or one under it. */
export function isOpen(item: NavItem, pathname: string): boolean {
  if (item.end) return pathname === item.path || pathname === `${item.path}/`;
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}
