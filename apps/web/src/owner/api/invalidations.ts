import type { InvalidationMap } from '@/lib/events';

/**
 * What each live event refreshes in the owner portal (docs/06 §4). A key matches by its first word,
 * so `['sheet']` also refreshes `['sheet', 's48']`.
 */
export const ownerInvalidations: InvalidationMap = {
  'board.changed': [['live'], ['dashboard']],
  'game.changed': [['live'], ['dashboard']],
  'waiting.changed': [['live'], ['dashboard'], ['players'], ['player']],
  'sheet.closed': [
    ['live'],
    ['dashboard'],
    ['sheets'],
    ['sheetFolders'],
    ['sheet'],
    ['activity'],
    ['players'],
    ['player'],
    ['notifications'],
    ['expenses'],
    ['reports'],
  ],
  'notification.created': [['notifications'], ['dashboard'], ['activity']],
  'worker.signedIn': [['workers']],
  'worker.signedOut': [['workers']],
  'price.changed': [['prices'], ['live']],
  'settings.changed': [['settings'], ['workers']],
};
