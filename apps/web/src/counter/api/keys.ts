/** Query keys of the counter app (docs/06 §5). Events invalidate by the first word of a key. */
export const counterKeys = {
  me: ['me'] as const,
  workers: ['workers'] as const,
  alerts: ['alerts'] as const,
  board: (category?: string) => ['board', category ?? 'snooker'] as const,
  game: (id: string) => ['game', id] as const,
  players: (q?: string) => ['players', q ?? ''] as const,
  player: (id: string) => ['player', id] as const,
  statement: (id: string) => ['statement', id] as const,
  checkout: () => ['checkout'] as const,
  checkoutBill: (playerId: string) => ['checkout', playerId] as const,
  canteen: ['canteen'] as const,
  today: ['today'] as const,
  closePreview: ['closePreview'] as const,
};
