import type { InvalidationMap } from '@/lib/events';

/**
 * What each live event refreshes on the counter (docs/06 §4). A key matches by its first word, so
 * `['board']` also refreshes `['board', 'pool']`.
 */
export const counterInvalidations: InvalidationMap = {
  'board.changed': [['board'], ['game'], ['today'], ['closePreview']],
  'game.changed': [['game'], ['board']],
  'waiting.changed': [
    ['board'],
    ['checkout'],
    ['today'],
    ['closePreview'],
    ['players'],
    ['statement'],
    ['canteen'],
  ],
  'sheet.closed': [
    ['board'],
    ['game'],
    ['checkout'],
    ['today'],
    ['closePreview'],
    ['players'],
    ['statement'],
    ['canteen'],
  ],
  'notification.created': [['board']],
  'worker.signedIn': [['me'], ['workers'], ['board']],
  'worker.signedOut': [['me'], ['workers'], ['board']],
  'price.changed': [['board']],
  'settings.changed': [['workers'], ['board'], ['checkout']],
};
