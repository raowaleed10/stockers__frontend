import { http, HttpResponse } from 'msw';

// Counter API only (/api/counter/*). The real handlers come in P03.
export const counterHandlers = [
  http.get('/api/counter/health', () => HttpResponse.json({ ok: true })),
];
