import type { InvalidationMap } from '@/lib/events';

/**
 * What each live event refreshes on the counter (docs/06 §4). A key matches by its first word, so
 * `['board']` also refreshes `['board', 'pool']`.
 */
export const counterInvalidations: InvalidationMap = {
  'board.changed': [
    ['board'],
    ['clubStatus'],
    ['game'],
    ['today'],
    ['closePreview'],
    ['recent'],
    ['undoable'],
  ],
  'game.changed': [['game'], ['board'], ['clubStatus'], ['recent'], ['players'], ['undoable']],
  'waiting.changed': [
    ['board'],
    ['undoable'],
    ['checkout'],
    ['today'],
    ['closePreview'],
    ['players'],
    ['statement'],
    ['canteen'],
  ],
  'sheet.closed': [
    ['board'],
    ['undoable'],
    ['lastClose'],
    ['clubStatus'],
    ['game'],
    ['checkout'],
    ['today'],
    ['closePreview'],
    ['players'],
    ['statement'],
    ['canteen'],
  ],
  'notification.created': [['board'], ['alerts']],
  'worker.signedIn': [['me'], ['workers'], ['board']],
  'worker.signedOut': [['me'], ['workers'], ['board']],
  'price.changed': [['board']],
  'settings.changed': [['workers'], ['board'], ['checkout']],
};
